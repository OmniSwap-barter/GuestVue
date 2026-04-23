// ─── Process Upload Job ────────────────────────────────────────────────────────
// Runs on Railway. Downloads original from R2, compresses it, uploads display
// version back to R2, then updates the DB row.

import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
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

interface ProcessUploadArgs {
  uploadId: string
  eventId: string
  key: string
  type: 'photo' | 'video'
  plan: string
}

export async function processUpload({ uploadId, eventId, key, type, plan }: ProcessUploadArgs) {
  console.log(`[process-upload] Starting ${type} ${uploadId}`)

  try {
    // 1. Download original from R2
    const r2Url = `${process.env.R2_PUBLIC_URL}/${key}`
    const response = await fetch(r2Url)
    if (!response.ok) throw new Error(`Failed to fetch original: ${r2Url}`)

    const buffer = Buffer.from(await response.arrayBuffer())

    let displayUrl: string

    if (type === 'photo') {
      // ── Compress image with Sharp (JPEG ~2MB max) ───────────────────────────
      const compressed = await sharp(buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toBuffer()

      // Upload display version
      const displayKey = key.replace('/originals/', '/display/').replace(/\.[^.]+$/, '.jpg')
      const uploadRes = await uploadToR2(displayKey, compressed, 'image/jpeg')
      displayUrl = uploadRes

      // Generate thumbnail
      const thumb = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer()

      const thumbKey = key.replace('/originals/', '/thumbs/').replace(/\.[^.]+$/, '.jpg')
      await uploadToR2(thumbKey, thumb, 'image/jpeg')

    } else {
      // ── Compress video with FFmpeg (720p H.264) ─────────────────────────────
      const tmpIn = path.join(tmpdir(), `gv_in_${uploadId}.mp4`)
      const tmpOut = path.join(tmpdir(), `gv_out_${uploadId}.mp4`)

      await writeFile(tmpIn, buffer)

      await execFileAsync('ffmpeg', [
        '-i', tmpIn,
        '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease',
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'fast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', tmpOut,
      ])

      const compressed = await readFile(tmpOut)
      await unlink(tmpIn).catch(() => {})
      await unlink(tmpOut).catch(() => {})

      const videoDisplayKey = key.replace('/originals/', '/videos/').replace(/\.[^.]+$/, '_720p.mp4')
      displayUrl = await uploadToR2(videoDisplayKey, compressed, 'video/mp4')
    }

    // ── Content moderation for Pro plan ────────────────────────────────────────
    let moderationOk: boolean | null = null
    if (plan === 'pro' && type === 'photo') {
      moderationOk = await runRekognition(r2Url)
    }

    // ── Update DB row ─────────────────────────────────────────────────────────
    await supabase
      .from('uploads')
      .update({
        display_url: displayUrl,
        status: moderationOk === false ? 'flagged' : 'ready',
        moderation_ok: moderationOk,
      })
      .eq('id', uploadId)

    console.log(`[process-upload] Done ${uploadId} → ${displayUrl}`)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[process-upload] Failed ${uploadId}:`, msg)
    await supabase.from('uploads').update({ status: 'flagged', moderation_ok: null }).eq('id', uploadId)
  }
}

// ── R2 upload helper ──────────────────────────────────────────────────────────
async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

// ── AWS Rekognition content moderation ───────────────────────────────────────
async function runRekognition(imageUrl: string): Promise<boolean> {
  try {
    const { RekognitionClient, DetectModerationLabelsCommand } = await import('@aws-sdk/client-rekognition')
    const client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // For R2 images, download and pass as bytes
    const res = await fetch(imageUrl)
    const bytes = new Uint8Array(await res.arrayBuffer())

    const cmd = new DetectModerationLabelsCommand({
      Image: { Bytes: bytes },
      MinConfidence: 75,
    })

    const result = await client.send(cmd)
    const labels = result.ModerationLabels || []

    // Reject if any high-confidence moderation labels found
    const isUnsafe = labels.some(l => (l.Confidence || 0) >= 80)
    return !isUnsafe
  } catch (err) {
    console.warn('[rekognition] Failed (non-fatal, treating as safe):', err)
    return true // fail open — better UX than blocking all uploads
  }
}
