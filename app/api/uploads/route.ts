import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAX_PHOTO_BYTES = 20 * 1024 * 1024   // 20 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024  // 200 MB

// Supabase Storage bucket for guest uploads (public bucket, no R2 credentials needed)
const STORAGE_BUCKET = 'event-uploads'

// Simple IP-based rate limiting via Supabase (5 uploads/IP/minute)
async function checkRateLimit(supabase: ReturnType<typeof createAdminClient>, ipHash: string) {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count } = await supabase
    .from('uploads')
    .select('id', { count: 'exact', head: true })
    .eq('guest_ip_hash', ipHash)
    .gte('created_at', since)

  return (count ?? 0) >= 5
}

function hashIp(ip: string): string {
  return Buffer.from(ip).toString('base64').slice(0, 32)
}

// Ensure the storage bucket exists (idempotent)
async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
    allowedMimeTypes: ['image/*', 'video/*'],
  })
  // Ignore "already exists" errors
  if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
    console.warn('[upload] Could not create bucket (may already exist):', error.message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Missing file or eventId.' }, { status: 400 })
    }

    // ── File type check ───────────────────────────────────────────────────────
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: 'Only photos and videos are accepted.' }, { status: 400 })
    }

    // ── Size check ────────────────────────────────────────────────────────────
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES
    if (file.size > maxBytes) {
      const label = isVideo ? '200MB' : '20MB'
      return NextResponse.json({ error: `File too large (max ${label}).` }, { status: 400 })
    }

    // ── Load event & check limits ─────────────────────────────────────────────
    const supabase = createAdminClient()
    const { data: event } = await supabase
      .from('events')
      .select('id, host_id, status, upload_count, upload_limit, page_expires_at, plan')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (event.status !== 'active') {
      return NextResponse.json({ error: 'This event is no longer active.' }, { status: 403 })
    }

    if (event.page_expires_at && new Date(event.page_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This event page has expired.' }, { status: 403 })
    }

    if (event.upload_count >= event.upload_limit) {
      return NextResponse.json({ error: 'Upload limit reached for this event.' }, { status: 403 })
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0'
    const ipHash = hashIp(rawIp)

    const limited = await checkRateLimit(supabase, ipHash)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many uploads — please wait a minute.' },
        { status: 429 }
      )
    }

    // ── Upload to Supabase Storage ────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const storagePath = `events/${eventId}/originals/${randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()

    // Ensure bucket exists (creates if missing, no-op if already there)
    await ensureBucket(supabase)

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error('[upload] Supabase Storage upload failed:', storageError.message)
      return NextResponse.json(
        { error: `Upload failed: ${storageError.message}` },
        { status: 500 }
      )
    }

    // Build public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    const originalUrl = publicUrl

    // ── Insert upload row ─────────────────────────────────────────────────────
    const { data: uploadRow, error: insertError } = await supabase
      .from('uploads')
      .insert({
        event_id: eventId,
        original_url: originalUrl,
        display_url: originalUrl,
        type: isVideo ? 'video' : 'photo',
        size_bytes: file.size,
        duration_secs: null,
        status: 'ready',
        moderation_ok: true,
        guest_ip_hash: ipHash,
        flagged_for_reel: true,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Upload insert error:', insertError)
      return NextResponse.json({ error: 'Database error — please try again.' }, { status: 500 })
    }

    // ── Increment event upload_count ──────────────────────────────────────────
    await supabase.rpc('increment_upload_count', { event_id_input: eventId })
      .then(({ error }) => {
        if (error) {
          return supabase
            .from('events')
            .update({ upload_count: (event.upload_count ?? 0) + 1 })
            .eq('id', eventId)
        }
      })

    // ── Dispatch to Railway worker for compression (fire-and-forget) ──────────
    if (process.env.RAILWAY_WORKER_URL && process.env.WORKER_SECRET) {
      fetch(`${process.env.RAILWAY_WORKER_URL}/jobs/process-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worker-secret': process.env.WORKER_SECRET,
        },
        body: JSON.stringify({
          uploadId: uploadRow.id,
          eventId,
          key: storagePath,
          type: isVideo ? 'video' : 'photo',
          plan: event.plan,
        }),
      }).catch(err => console.warn('Worker dispatch failed (non-fatal):', err.message))
    }

    return NextResponse.json({ success: true, uploadId: uploadRow.id }, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// Handle large file uploads
export const config = {
  api: { bodyParser: false },
}
