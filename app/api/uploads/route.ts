import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

const MAX_PHOTO_BYTES = 20 * 1024 * 1024   // 20 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024  // 200 MB

// Lazy-initialise S3/R2 client
function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// Simple IP-based rate limiting via Supabase (5 uploads/IP/minute)
// In production, use BullMQ + Redis for this — this is a lightweight fallback
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
  // Simple hash — in production use crypto.subtle with a server secret
  return Buffer.from(ip).toString('base64').slice(0, 32)
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

    // ── Upload to R2 ──────────────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg')
    const key = `events/${eventId}/originals/${randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()

    const r2 = getR2Client()
    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: Buffer.from(bytes),
          ContentType: file.type,
          Metadata: {
            eventId,
            originalName: file.name,
          },
        })
      )
    } catch (r2Err: unknown) {
      const msg = r2Err instanceof Error ? r2Err.message : String(r2Err)
      console.error('R2 upload failed:', {
        message: msg,
        bucket: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT,
        keyId: process.env.R2_ACCESS_KEY_ID?.slice(0, 8),
      })
      return NextResponse.json(
        { error: `Upload storage error: ${msg}` },
        { status: 500 }
      )
    }

    const originalUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    // ── Insert upload row ─────────────────────────────────────────────────────
    const { data: uploadRow, error: insertError } = await supabase
      .from('uploads')
      .insert({
        event_id: eventId,
        original_url: originalUrl,
        display_url: null, // set by worker after compression
        type: isVideo ? 'video' : 'photo',
        size_bytes: file.size,
        duration_secs: null,
        status: 'processing',
        moderation_ok: null,
        guest_ip_hash: ipHash,
        flagged_for_reel: false,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Upload insert error:', insertError)
      return NextResponse.json({ error: 'Database error — please try again.' }, { status: 500 })
    }

    // ── Increment event upload_count ──────────────────────────────────────────
    await supabase.rpc('increment_upload_count', { event_id_input: eventId })

    // ── Dispatch to Railway worker (fire-and-forget) ───────────────────────────
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
          key,
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

// Need to handle large file uploads
export const config = {
  api: { bodyParser: false },
}
