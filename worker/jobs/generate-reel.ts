// ─── Generate Reel Job ────────────────────────────────────────────────────────
// Basic reel: FFmpeg concat + music + hashtag overlay
// Advanced reel: Remotion render (animated title card, multi-format)

import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

const execFileAsync = promisify(execFile)

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface GenerateReelArgs {
  reelId: string
  eventId: string
  type: 'basic' | 'advanced'
}

export async function generateReel({ reelId, eventId, type }: GenerateReelArgs) {
  console.log(`[generate-reel] Starting ${type} reel ${reelId}`)

  // Mark as processing
  await supabase.from('reels').update({ status: 'processing' }).eq('id', reelId)

  try {
    // Get reel details & upload IDs
    const { data: reel } = await supabase.from('reels').select('*').eq('id', reelId).single()
    if (!reel) throw new Error('Reel not found')

    // Get the event for metadata
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (!event) throw new Error('Event not found')

    // Get upload display URLs
    const { data: uploads } = await supabase
      .from('uploads')
      .select('id, display_url, type')
      .in('id', reel.upload_ids)
      .eq('status', 'ready')
      .eq('type', 'photo') // reels use photos only for now

    if (!uploads || uploads.length < 3) {
      throw new Error('Not enough ready photos to generate a reel (minimum 3)')
    }

    const tmpDir = path.join(tmpdir(), `reel_${reelId}`)
    await mkdir(tmpDir, { recursive: true })

    if (type === 'basic') {
      await generateBasicReel({ reelId, eventId, event, uploads, tmpDir })
    } else {
      await generateAdvancedReel({ reelId, eventId, event, uploads, tmpDir })
    }

    // Cleanup temp files
    await execFileAsync('rm', ['-rf', tmpDir]).catch(() => {})

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[generate-reel] Failed ${reelId}:`, msg)
    await supabase.from('reels').update({
      status: 'failed',
      error_msg: msg,
      retry_count: supabase.rpc ? undefined : undefined, // handled by DB trigger
    }).eq('id', reelId)
  }
}

// ── Basic Reel: FFmpeg slideshow + crossfade + music overlay ──────────────────
async function generateBasicReel({ reelId, eventId, event, uploads, tmpDir }: {
  reelId: string
  eventId: string
  event: any
  uploads: any[]
  tmpDir: string
}) {
  // Download photos
  const photoPaths: string[] = []
  for (let i = 0; i < Math.min(uploads.length, 30); i++) {
    const u = uploads[i]
    const res = await fetch(u.display_url)
    const buf = Buffer.from(await res.arrayBuffer())
    const p = path.join(tmpDir, `photo_${i}.jpg`)
    await writeFile(p, buf)
    photoPaths.push(p)
  }

  const outputPath = path.join(tmpDir, 'reel.mp4')
  const duration = 2.5 // seconds per photo
  const hashtag = event.hashtag ? `#${event.hashtag}` : ''

  // Build FFmpeg filter for slideshow with crossfade
  const inputs = photoPaths.flatMap(p => ['-loop', '1', '-t', String(duration + 0.5), '-i', p])

  // Scale all inputs to 1080x1920 (9:16 for TikTok/Reels)
  const scaleFilters = photoPaths.map((_, i) => `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`)

  // Build xfade chain
  let filterChain = scaleFilters.join(';') + ';'
  let currentLabel = 'v0'
  for (let i = 1; i < photoPaths.length; i++) {
    const nextLabel = i === photoPaths.length - 1 ? 'vout' : `xf${i}`
    const offset = (i - 1) * duration
    filterChain += `[${currentLabel}][v${i}]xfade=transition=fade:duration=0.5:offset=${offset}[${nextLabel}];`
    currentLabel = nextLabel
  }

  // Add hashtag overlay
  if (hashtag) {
    filterChain = filterChain.replace('[vout]', '[vpre]')
    filterChain += `[vpre]drawtext=text='${hashtag}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100:shadowcolor=black:shadowx=2:shadowy=2[vout]`
  }

  await execFileAsync('ffmpeg', [
    ...inputs,
    '-filter_complex', filterChain,
    '-map', '[vout]',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-t', String(photoPaths.length * duration),
    '-y', outputPath,
  ])

  // Upload to R2
  const reelBuf = await readFile(outputPath)
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  const reelKey = `events/${eventId}/reels/${reelId}_basic.mp4`
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: reelKey,
    Body: reelBuf,
    ContentType: 'video/mp4',
  }))

  const outputUrl = `${process.env.R2_PUBLIC_URL}/${reelKey}`

  await supabase.from('reels').update({
    status: 'complete',
    output_url: outputUrl,
    completed_at: new Date().toISOString(),
    formats: { '9:16': outputUrl },
  }).eq('id', reelId)

  console.log(`[generate-reel] Basic reel done: ${outputUrl}`)

  // Send email notification
  if (process.env.RESEND_API_KEY) {
    const { data: host } = await supabase.from('profiles').select('email, full_name').eq('id', event.host_id).single()
    if (host) {
      const { sendReelReadyEmail } = await import('../../lib/resend')
      await sendReelReadyEmail({
        to: host.email,
        hostName: host.full_name || 'there',
        eventName: event.name,
        reelUrl: outputUrl,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${eventId}`,
      }).catch(e => console.warn('Email failed:', e))
    }
  }
}

// ── Advanced Reel: Remotion render (placeholder — wire up Remotion bundle) ─────
async function generateAdvancedReel({ reelId, eventId, event, uploads, tmpDir }: {
  reelId: string
  eventId: string
  event: any
  uploads: any[]
  tmpDir: string
}) {
  // Remotion render requires a compiled composition bundle.
  // 1. Create app/remotion/GuestVueReel.tsx composition
  // 2. Run: npx remotion bundle → bundle.js
  // 3. Use renderMedia() here with the bundle
  //
  // For now, fall back to basic reel and log a TODO
  console.warn('[generate-reel] Advanced reel → falling back to basic (Remotion bundle not yet compiled)')
  await generateBasicReel({ reelId, eventId, event, uploads, tmpDir })
}
