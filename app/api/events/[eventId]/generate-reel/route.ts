import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  // Next.js 15: params is async — must await
  const { eventId } = await params

  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single() as any
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Only paid plans can generate reels
  if (event.plan === 'free') {
    return NextResponse.json({ error: 'Reel generation requires Flex or Pro plan.' }, { status: 403 })
  }

  // Parse optional builder options from request body
  let uploadIds: string[] = []
  let musicTrack: string | null = null
  let removeWatermark = false
  let logoUrl: string | null = null

  try {
    const body = await req.json()
    uploadIds = Array.isArray(body.uploadIds) ? body.uploadIds : []
    musicTrack = typeof body.musicTrack === 'string' ? body.musicTrack : null
    removeWatermark = body.removeWatermark === true
    logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : null
  } catch {
    // body is optional — defaults used
  }

  // type must be 'basic' or 'advanced' (check constraint)
  const reelType = event.plan === 'pro' ? 'advanced' : 'basic'

  const { data: reel, error } = await admin
    .from('reels')
    .insert({
      event_id: eventId,
      type: reelType,
      status: 'queued',
      upload_ids: uploadIds.length > 0 ? uploadIds : [],
      music_track: musicTrack,
      formats: {
        remove_watermark: removeWatermark,
        logo_url: logoUrl,
      },
    })
    .select()
    .single() as any

  if (error) return NextResponse.json({ error: 'Failed to queue reel' }, { status: 500 })

  // Dispatch to Railway worker
  if (process.env.RAILWAY_WORKER_URL && process.env.WORKER_SECRET) {
    fetch(`${process.env.RAILWAY_WORKER_URL}/jobs/generate-reel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-secret': process.env.WORKER_SECRET,
      },
      body: JSON.stringify({
        reelId: reel.id,
        eventId,
        plan: event.plan,
        uploadIds,
        musicTrack,
        removeWatermark,
        logoUrl,
      }),
    }).catch(err => console.warn('Worker reel dispatch failed:', err.message))
  }

  return NextResponse.json({ reel, workerOnline: !!(process.env.RAILWAY_WORKER_URL && process.env.WORKER_SECRET) }, { status: 201 })
}
