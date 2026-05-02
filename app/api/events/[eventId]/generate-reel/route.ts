// ─── Generate Reel Route ──────────────────────────────────────────────────────
// Validates the request, creates the reel DB record, then dispatches to the
// Railway worker via BullMQ (primary) or direct HTTP (fallback).
//
// Rendering is done entirely by FFmpeg on the Railway worker — no Shotstack.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { enqueueGenerateReel, isQueueAvailable, type GenerateReelJobData } from '@/lib/queue'

// ── Tier limits (reels per month) ─────────────────────────────────────────────
const TIER_LIMITS: Record<string, number> = {
  free:      1,
  flex:      5,
  pro:       999,
  planner:   999,
  business:  999,
  corporate: 999,
}

// ── Dispatch to Railway worker via HTTP (fallback when no Redis) ───────────────
async function dispatchToWorkerHTTP(
  reelId: string,
  eventId: string,
  type: string,
  jobData: Omit<GenerateReelJobData, 'reelId' | 'eventId' | 'type'>
): Promise<boolean> {
  const workerUrl = process.env.RAILWAY_WORKER_URL
  const workerSecret = process.env.WORKER_SECRET
  if (!workerUrl || !workerSecret) return false

  try {
    const res = await fetch(`${workerUrl}/jobs/generate-reel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': workerSecret,
      },
      body: JSON.stringify({ reelId, eventId, type, ...jobData }),
    })
    return res.ok
  } catch (err) {
    console.error('[generate-reel] Worker HTTP dispatch failed:', err)
    return false
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // ── Verify event ownership ────────────────────────────────────────────────
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single() as any

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // ── Monthly reel limit check ──────────────────────────────────────────────
  const { data: profile } = await admin
    .from('profiles')
    .select('plan_type, is_unlimited')
    .eq('id', user.id)
    .single() as any

  const planType: string = profile?.plan_type ?? 'free'
  const isUnlimited: boolean = profile?.is_unlimited === true

  if (!isUnlimited) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const { data: userEvents } = await admin
      .from('events').select('id').eq('host_id', user.id) as any

    const eventIds: string[] = userEvents?.map((e: any) => e.id) ?? []

    if (eventIds.length > 0) {
      const { count: monthlyCount } = await admin
        .from('reels')
        .select('id', { count: 'exact', head: true })
        .in('event_id', eventIds)
        .gte('created_at', monthStart.toISOString())
        .neq('status', 'failed') as any

      const limit = TIER_LIMITS[planType] ?? 1
      if ((monthlyCount ?? 0) >= limit) {
        return NextResponse.json({
          error: 'monthly_limit_reached',
          limit,
          planType,
          message: `You've used your ${limit} reel${limit === 1 ? '' : 's'} this month. Upgrade to generate more.`,
        }, { status: 403 })
      }
    }
  }

  // ── Parse request body ────────────────────────────────────────────────────
  let uploadIds: string[] = []
  let musicTrack: string | null = null
  let removeWatermark = false
  let logoUrl: string | null = null
  let theme: string | null = null
  let transition = 'fade'
  let textOverlays: { title?: string; caption?: string; outro?: string } | null = null
  let logoPosition: 'throughout' | 'outro' = 'outro'

  try {
    const body = await req.json()
    uploadIds      = Array.isArray(body.uploadIds) ? body.uploadIds : []
    musicTrack     = typeof body.musicTrack === 'string' ? body.musicTrack : null
    removeWatermark = body.removeWatermark === true
    logoUrl        = typeof body.logoUrl === 'string' ? body.logoUrl : null
    theme          = typeof body.theme === 'string' ? body.theme : null
    transition     = typeof body.transition === 'string' ? body.transition : 'fade'
    textOverlays   = body.textOverlays && typeof body.textOverlays === 'object' ? body.textOverlays : null
    logoPosition   = body.logoPosition === 'throughout' ? 'throughout' : 'outro'
  } catch { /* body is optional */ }

  // Free plan always gets watermark
  if (event.plan === 'free' || planType === 'free') removeWatermark = false

  // ── Validate media selection ──────────────────────────────────────────────
  if (uploadIds.length < 3) {
    return NextResponse.json({ error: 'Select at least 3 photos or videos.' }, { status: 400 })
  }

  // Quick existence check — worker fetches the actual URLs
  const { data: uploads } = await admin
    .from('uploads')
    .select('id')
    .in('id', uploadIds)
    .eq('event_id', eventId) as any

  if (!uploads || uploads.length < 3) {
    return NextResponse.json({ error: 'Could not find enough media for this event.' }, { status: 400 })
  }

  const reelType = (event.plan === 'pro' || isUnlimited) ? 'advanced' : 'basic'

  // ── Create reel record (queued) ───────────────────────────────────────────
  const { data: reel, error: reelErr } = await admin
    .from('reels')
    .insert({
      event_id: eventId,
      type: reelType,
      status: 'queued',
      upload_ids: uploadIds,
      music_track: musicTrack,
      published_to_gallery: false,
      formats: {
        remove_watermark: removeWatermark,
        logo_url: logoUrl,
        theme,
        transition,
        text_overlays: textOverlays,
        logo_position: logoPosition,
      } as any,
    })
    .select()
    .single() as any

  if (reelErr) {
    console.error('[generate-reel] Failed to create reel record:', reelErr)
    return NextResponse.json({ error: 'Failed to queue reel' }, { status: 500 })
  }

  // ── Job payload ───────────────────────────────────────────────────────────
  const jobPayload: GenerateReelJobData = {
    reelId: reel.id,
    eventId,
    type: reelType,
    uploadIds,
    musicTrack,
    removeWatermark,
    logoUrl,
    logoPosition,
    theme,
    transition,
    textOverlays,
  }

  // ── Dispatch: BullMQ (primary) → Railway HTTP (fallback) ──────────────────

  // Path 1: BullMQ via Upstash Redis
  if (isQueueAvailable()) {
    try {
      const jobId = await enqueueGenerateReel(jobPayload)
      if (jobId) {
        await admin.from('reels').update({ status: 'processing' }).eq('id', reel.id)
        reel.status = 'processing'
        console.log(`[generate-reel] BullMQ job ${jobId} queued for reel ${reel.id}`)
        return NextResponse.json({ reel, workerOnline: true, engine: 'bullmq' }, { status: 201 })
      }
    } catch (err) {
      console.error('[generate-reel] BullMQ enqueue failed, trying HTTP fallback:', err)
    }
  }

  // Path 2: Direct HTTP to Railway worker
  if (process.env.RAILWAY_WORKER_URL) {
    const { reelId, eventId: eid, type, ...rest } = jobPayload
    const dispatched = await dispatchToWorkerHTTP(reelId, eid, type, rest)
    if (dispatched) {
      await admin.from('reels').update({ status: 'processing' }).eq('id', reel.id)
      reel.status = 'processing'
      console.log(`[generate-reel] HTTP dispatch to Railway worker for reel ${reel.id}`)
      return NextResponse.json({ reel, workerOnline: true, engine: 'railway-http' }, { status: 201 })
    }
  }

  // No engine available — fail clearly
  await admin.from('reels').update({
    status: 'failed',
    error_msg: 'Worker not reachable. Set REDIS_URL in Vercel environment variables.',
  }).eq('id', reel.id)

  return NextResponse.json({
    reel: { ...reel, status: 'failed' },
    workerOnline: false,
    message: 'Add REDIS_URL to Vercel environment variables to enable reel generation.',
  }, { status: 201 })
}
