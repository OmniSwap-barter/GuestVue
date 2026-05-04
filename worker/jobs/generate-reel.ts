// ─── Generate Reel Job ────────────────────────────────────────────────────────
// Runs on Railway. Uses FFmpeg to produce 9:16 (1080×1920) MP4 reels from
// a mix of photos and videos, with music overlay, text/logo overlays, and
// variable clip speeds.
//
// Consumes from BullMQ (preferred) OR dispatched via HTTP from Next.js.
//
// ─────────────────────────────────────────────────────────────────────────────

import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'
// ffmpeg-static bundles a static FFmpeg binary — no system install needed
import ffmpegStatic from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

// Use bundled ffmpeg binary, fall back to system ffmpeg if somehow available
const FFMPEG_BIN = ffmpegStatic || 'ffmpeg'
console.log(`[worker] FFmpeg binary: ${FFMPEG_BIN}`)

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Upload helper: R2 (preferred) with Supabase Storage fallback ──────────────
async function uploadReelOutput(key: string, body: Buffer, contentType: string): Promise<string> {
  // Try R2 if credentials are available
  const hasR2 = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )

  if (hasR2) {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        requestChecksumCalculation: 'WHEN_REQUIRED' as any,
        responseChecksumValidation: 'WHEN_REQUIRED' as any,
      })
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: body,
        ContentType: contentType,
      }))
      const pubUrl = process.env.R2_PUBLIC_URL || `https://pub-81436af2ca3a49feb0bc7261118c4f17.r2.dev`
      console.log('[reel] Uploaded to R2')
      return `${pubUrl}/${key}`
    } catch (err: any) {
      console.warn('[reel] R2 upload failed, falling back to Supabase Storage:', err.message)
    }
  }

  // Fallback: Supabase Storage (same bucket used by guest uploads)
  console.log('[reel] Uploading to Supabase Storage')
  const { data, error } = await supabase.storage
    .from('event-uploads')
    .upload(key, body, { contentType, upsert: true })

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('event-uploads')
    .getPublicUrl(key)

  return publicUrl
}

// ── Media item ────────────────────────────────────────────────────────────────
interface MediaFile {
  localPath: string
  type: 'photo' | 'video'
  duration: number   // seconds to hold this clip
  speed: number      // 1.0 = normal, 0.5 = half, 2.0 = double
}

// ── Job args ──────────────────────────────────────────────────────────────────
export interface GenerateReelArgs {
  reelId: string
  eventId: string
  type: 'basic' | 'advanced'
  uploadIds?: string[]
  musicTrack?: string | null
  removeWatermark?: boolean
  logoUrl?: string | null
  logoPosition?: 'throughout' | 'outro'
  theme?: string | null
  transition?: string
  textOverlays?: { title?: string; caption?: string; outro?: string } | null
}

// ── Theme → xfade transition map ──────────────────────────────────────────────
function shotstackToXfade(t: string): string {
  const map: Record<string, string> = {
    fade: 'fade',
    zoom: 'fade',
    wipeLeft: 'wipeleft',
    wipeRight: 'wiperight',
    slideLeft: 'slideleft',
    carouselLeft: 'slideleft',
    wobble: 'radial',
    distortHorizontal: 'wipeleft',
  }
  return map[t] ?? 'fade'
}

const THEME_TRANSITIONS: Record<string, string[]> = {
  viral_wedding:     ['fade', 'fade', 'slideleft', 'fade'],
  birthday_bangerz:  ['slideleft', 'wipeleft', 'slideleft', 'fade'],
  afrobeats_moments: ['slideleft', 'wipeleft', 'slideleft', 'wiperight'],
  amapiano_vibes:    ['wipeleft', 'wiperight', 'wipeleft', 'wiperight'],
  love_story:        ['fade', 'slideleft', 'fade', 'fade'],
  corporate_flex:    ['wipeleft', 'slideleft', 'wipeleft', 'slideleft'],
  party_highlights:  ['slideleft', 'wipeleft', 'fade', 'slideleft'],
  glow_up_reel:      ['slideleft', 'fade', 'slideleft', 'wipeleft'],
  highlife_classic:  ['slideleft', 'fade', 'slideleft', 'fade'],
  cinema_mode:       ['slideleft', 'slideleft', 'fade', 'slideleft'],
}

// ── Music track URLs ──────────────────────────────────────────────────────────
const MUSIC_BASE = process.env.MUSIC_BASE_URL ?? ''
const MUSIC_URLS: Record<string, string | null> = {
  afrobeats_upbeat:  MUSIC_BASE ? `${MUSIC_BASE}/afrobeats-upbeat.mp3` : null,
  afrobeats_chill:   MUSIC_BASE ? `${MUSIC_BASE}/afrobeats-chill.mp3` : null,
  amapiano_dance:    MUSIC_BASE ? `${MUSIC_BASE}/amapiano-dance.mp3` : null,
  highlife_classic:  MUSIC_BASE ? `${MUSIC_BASE}/highlife-classic.mp3` : null,
  pop_romantic:      MUSIC_BASE ? `${MUSIC_BASE}/pop-romantic.mp3` : null,
  pop_energetic:     MUSIC_BASE ? `${MUSIC_BASE}/pop-energetic.mp3` : null,
  cinematic:         MUSIC_BASE ? `${MUSIC_BASE}/cinematic-instrumental.mp3` : null,
}

// ── Theme-to-music map ────────────────────────────────────────────────────────
const THEME_MUSIC: Record<string, string> = {
  viral_wedding:     'pop_romantic',
  birthday_bangerz:  'afrobeats_upbeat',
  afrobeats_moments: 'afrobeats_chill',
  amapiano_vibes:    'amapiano_dance',
  love_story:        'pop_romantic',
  corporate_flex:    'cinematic',
  party_highlights:  'afrobeats_upbeat',
  glow_up_reel:      'pop_energetic',
  highlife_classic:  'highlife_classic',
  cinema_mode:       'cinematic',
}

// ── Main entry point ──────────────────────────────────────────────────────────
export async function generateReel(args: GenerateReelArgs) {
  const { reelId, eventId, type } = args
  console.log(`[generate-reel] Starting ${type} reel ${reelId}`)

  await supabase.from('reels').update({ status: 'processing' }).eq('id', reelId)

  const tmpDir = path.join(tmpdir(), `reel_${reelId}_${Date.now()}`)
  await mkdir(tmpDir, { recursive: true })

  try {
    // ── Fetch reel + event ─────────────────────────────────────────────────
    const { data: reel } = await supabase.from('reels').select('*').eq('id', reelId).single()
    if (!reel) throw new Error('Reel record not found')

    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (!event) throw new Error('Event not found')

    // Merge args (from BullMQ payload) with DB-stored formats field
    const formats = (reel as any).formats ?? {}
    const uploadIds: string[]       = (args.uploadIds ?? reel.upload_ids ?? []) as string[]
    const removeWatermark: boolean  = args.removeWatermark ?? formats.remove_watermark ?? false
    const logoUrl: string | null    = args.logoUrl ?? formats.logo_url ?? null
    const logoPosition              = (args.logoPosition ?? formats.logo_position ?? 'outro') as 'throughout' | 'outro'
    const theme: string | null      = args.theme ?? formats.theme ?? null
    const transition: string        = args.transition ?? formats.transition ?? 'fade'
    const textOverlays              = args.textOverlays ?? formats.text_overlays ?? null

    // Resolve music: job arg → theme default → null
    let musicTrack: string | null   = args.musicTrack ?? reel.music_track ?? null
    if (!musicTrack && theme && THEME_MUSIC[theme]) musicTrack = THEME_MUSIC[theme]

    if (uploadIds.length < 3) throw new Error('Minimum 3 media items required')

    // ── Resolve ordered upload URLs ────────────────────────────────────────
    const { data: uploads } = await supabase
      .from('uploads')
      .select('id, original_url, display_url, type')
      .in('id', uploadIds)

    if (!uploads || uploads.length < 3) throw new Error('Could not fetch enough upload records')

    const uploadMap = new Map(uploads.map((u: any) => [u.id, u]))
    const orderedUploads = uploadIds.map(id => uploadMap.get(id)).filter(Boolean) as any[]

    // ── Download all media to temp dir ─────────────────────────────────────
    // Detect actual file type from URL extension + Content-Type response header.
    // Do NOT trust the DB `type` field alone — uploads via iOS/Android often
    // save h264 video as type='photo' (e.g. Live Photos, HEVC clips).
    const VIDEO_EXTS = new Set(['mp4','mov','avi','mkv','webm','m4v','3gp','mts','hevc','ts','heic'])
    const mediaFiles: MediaFile[] = []
    for (let i = 0; i < Math.min(orderedUploads.length, 30); i++) {
      const u = orderedUploads[i]
      const url = u.original_url || u.display_url
      if (!url) continue

      // Check URL extension first
      const urlPath = url.split('?')[0]
      const urlExt  = (urlPath.split('.').pop() ?? '').toLowerCase()

      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`[reel] Skipping ${u.id}: HTTP ${res.status}`)
        continue
      }

      // Check Content-Type header as secondary signal
      const contentType = res.headers.get('content-type') ?? ''
      const isVideo = u.type === 'video' || VIDEO_EXTS.has(urlExt) || contentType.startsWith('video/')
      const ext = isVideo ? 'mp4' : 'jpg'
      const localPath = path.join(tmpDir, `media_${i}.${ext}`)

      console.log(`[reel] media_${i}: dbType=${u.type} urlExt=${urlExt} contentType=${contentType} → treating as ${isVideo ? 'video' : 'photo'}`)

      await writeFile(localPath, Buffer.from(await res.arrayBuffer()))
      mediaFiles.push({
        localPath,
        type: isVideo ? 'video' : 'photo',
        duration: isVideo ? 3.5 : 3.0,
        speed: 1.0,
      })
    }

    if (mediaFiles.length < 3) throw new Error('Not enough downloadable media (minimum 3)')

    // ── Download music ─────────────────────────────────────────────────────
    let musicPath: string | null = null
    if (musicTrack && MUSIC_URLS[musicTrack]) {
      try {
        const mres = await fetch(MUSIC_URLS[musicTrack]!)
        if (mres.ok) {
          musicPath = path.join(tmpDir, 'music.mp3')
          await writeFile(musicPath, Buffer.from(await mres.arrayBuffer()))
          console.log(`[reel] Music downloaded: ${musicTrack}`)
        }
      } catch { console.warn('[reel] Music download failed — no music') }
    }

    // ── Build + run FFmpeg ─────────────────────────────────────────────────
    const outputPath = path.join(tmpDir, 'reel.mp4')
    const xfadeTrans = theme && THEME_TRANSITIONS[theme]
      ? THEME_TRANSITIONS[theme]
      : [shotstackToXfade(transition)]

    await buildFFmpegReel({
      mediaFiles,
      musicPath,
      outputPath,
      removeWatermark,
      logoUrl,
      logoPosition,
      textOverlays,
      xfadeTransitions: xfadeTrans,
      eventHashtag: (event as any).hashtag ?? null,
      tmpDir,
    })

    // ── Upload reel (R2 → Supabase Storage fallback) ──────────────────────
    const reelBuf = await readFile(outputPath)
    const reelKey = `events/${eventId}/reels/${reelId}.mp4`
    const outputUrl = await uploadReelOutput(reelKey, reelBuf, 'video/mp4')

    console.log(`[generate-reel] Done: ${outputUrl}`)

    await supabase.from('reels').update({
      status: 'complete',
      output_url: outputUrl,
      completed_at: new Date().toISOString(),
      formats: { ...formats, '9:16': outputUrl },
    }).eq('id', reelId)

    // ── Email host ─────────────────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: host } = await supabase
          .from('profiles').select('email, full_name').eq('id', (event as any).host_id).single()
        if (host) {
          const { sendReelReadyEmail } = await import('../../lib/resend')
          await sendReelReadyEmail({
            to: (host as any).email,
            hostName: (host as any).full_name || 'there',
            eventName: (event as any).name,
            reelUrl: outputUrl,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/events/${eventId}`,
          })
        }
      } catch (e) { console.warn('[reel] Email failed:', e) }
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[generate-reel] FAILED ${reelId}:`, msg)
    await supabase.from('reels').update({
      status: 'failed',
      error_msg: msg.slice(0, 500),
    }).eq('id', reelId)
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ── FFmpeg reel builder ────────────────────────────────────────────────────────
interface BuildArgs {
  mediaFiles: MediaFile[]
  musicPath: string | null
  outputPath: string
  removeWatermark: boolean
  logoUrl: string | null
  logoPosition: 'throughout' | 'outro'
  textOverlays: { title?: string; caption?: string; outro?: string } | null
  xfadeTransitions: string[]
  eventHashtag: string | null
  tmpDir: string
}

const VALID_XFADE = new Set(['fade','wipeleft','wiperight','slideleft','slideright','circlecrop','radial','dissolve'])

async function buildFFmpegReel({
  mediaFiles,
  musicPath,
  outputPath,
  removeWatermark,
  logoUrl,
  logoPosition,
  textOverlays,
  xfadeTransitions,
  eventHashtag,
  tmpDir,
}: BuildArgs) {

  const CLIP_DUR  = 3.0
  const XFADE_DUR = 0.5
  const EFFECTIVE = CLIP_DUR - XFADE_DUR
  const totalDuration = EFFECTIVE * mediaFiles.length + XFADE_DUR

  // ── Download logo ──────────────────────────────────────────────────────
  let logoPath: string | null = null
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl)
      if (res.ok) {
        const ext = (logoUrl.split('.').pop()?.split('?')[0] ?? 'png').toLowerCase()
        const safeExt = ['png','jpg','jpeg','webp'].includes(ext) ? ext : 'png'
        logoPath = path.join(tmpDir, `logo.${safeExt}`)
        await writeFile(logoPath, Buffer.from(await res.arrayBuffer()))
      }
    } catch { console.warn('[reel] Logo download failed') }
  }

  // ── Build -i input args ─────────────────────────────────────────────────
  const inputArgs: string[] = []
  for (const mf of mediaFiles) {
    if (mf.type === 'video') {
      inputArgs.push('-stream_loop', '-1', '-t', String(CLIP_DUR + 1), '-i', mf.localPath)
    } else {
      inputArgs.push('-loop', '1', '-t', String(CLIP_DUR + 1), '-i', mf.localPath)
    }
  }

  let nextInputIdx = mediaFiles.length
  let musicInputIdx = -1
  let logoInputIdx  = -1

  if (musicPath) {
    inputArgs.push('-i', musicPath)
    musicInputIdx = nextInputIdx++
  }
  if (logoPath) {
    inputArgs.push('-i', logoPath)
    logoInputIdx = nextInputIdx++
  }

  // ── filter_complex ──────────────────────────────────────────────────────
  const fp: string[] = []

  // 1. Scale + pad all media to 1080×1920
  // Photos: simple scale+pad+fps (zoompan is too slow and causes timeouts).
  // Videos: scale+pad+trim to clip duration.
  for (let i = 0; i < mediaFiles.length; i++) {
    const mf = mediaFiles[i]
    if (mf.type === 'photo') {
      fp.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,`
        + `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,`
        + `fps=30,setpts=PTS-STARTPTS[v${i}]`
      )
    } else {
      fp.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,`
        + `pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1,`
        + `trim=0:${CLIP_DUR},setpts=PTS-STARTPTS[v${i}]`
      )
    }
  }

  // 2. xfade chain
  if (mediaFiles.length === 1) {
    fp.push(`[v0]copy[vbase]`)
  } else {
    let curLabel = 'v0'
    for (let i = 1; i < mediaFiles.length; i++) {
      const raw = xfadeTransitions[(i - 1) % xfadeTransitions.length] ?? 'fade'
      const t   = VALID_XFADE.has(raw) ? raw : 'fade'
      const offset = ((i - 1) * EFFECTIVE).toFixed(3)
      const outLabel = i === mediaFiles.length - 1 ? 'vbase' : `xf${i}`
      fp.push(`[${curLabel}][v${i}]xfade=transition=${t}:duration=${XFADE_DUR}:offset=${offset}[${outLabel}]`)
      curLabel = outLabel
    }
  }

  // 3. drawtext overlays (chained via comma)
  // fontfile= is required when fontconfig is unavailable (e.g. ffmpeg-static, slim containers)
  const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
  const dts: string[] = []

  function safeDt(txt: string) {
    return txt.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
  }

  if (textOverlays?.title) {
    dts.push(
      `drawtext=fontfile='${FONT}':text='${safeDt(textOverlays.title)}':fontsize=72:fontcolor=white:`
      + `x=(w-text_w)/2:y=h*0.18:shadowcolor=black:shadowx=2:shadowy=3:`
      + `enable='between(t,0,3.5)'`
    )
  }
  if (textOverlays?.caption) {
    const cs = Math.max(0, totalDuration / 2 - 2).toFixed(2)
    const ce = (parseFloat(cs) + 4).toFixed(2)
    dts.push(
      `drawtext=fontfile='${FONT}':text='${safeDt(textOverlays.caption)}':fontsize=56:fontcolor=white:`
      + `x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.55:boxborderw=16:`
      + `enable='between(t,${cs},${ce})'`
    )
  }
  if (textOverlays?.outro) {
    const os = Math.max(0, totalDuration - 4).toFixed(2)
    dts.push(
      `drawtext=fontfile='${FONT}':text='${safeDt(textOverlays.outro)}':fontsize=64:fontcolor=white:`
      + `x=(w-text_w)/2:y=h*0.65:shadowcolor=black:shadowx=2:shadowy=3:`
      + `enable='between(t,${os},${totalDuration.toFixed(2)})'`
    )
  }
  if (eventHashtag) {
    dts.push(
      `drawtext=fontfile='${FONT}':text='${safeDt('#' + eventHashtag)}':fontsize=40:fontcolor=white:`
      + `x=(w-text_w)/2:y=h-90:shadowcolor=black:shadowx=1:shadowy=2`
    )
  }
  if (!removeWatermark) {
    dts.push(
      `drawtext=fontfile='${FONT}':text='Powered by GuestVue':fontsize=26:fontcolor=white@0.60:`
      + `x=20:y=h-55`
    )
  }

  let videoLabel = 'vbase'
  // Track the label before drawtext so the no-text fallback can alias it correctly
  const preDrawtextLabel = videoLabel

  if (dts.length > 0) {
    const dtLabel = logoInputIdx >= 0 ? 'vtext' : 'vfinal'
    fp.push(`[${videoLabel}]${dts.join(',')}[${dtLabel}]`)
    videoLabel = dtLabel
  }

  // 4. Logo overlay
  if (logoInputIdx >= 0) {
    if (logoPosition === 'outro') {
      const os = Math.max(0, totalDuration - 2).toFixed(2)
      fp.push(
        `[${logoInputIdx}:v]scale=400:-1[logo]`,
        `[${videoLabel}][logo]overlay=(main_w-overlay_w)/2:(main_h*0.75-overlay_h/2):`
        + `enable='between(t,${os},${totalDuration.toFixed(2)})'[vfinal]`
      )
    } else {
      fp.push(
        `[${logoInputIdx}:v]scale=160:-1,format=rgba,colorchannelmixer=aa=0.85[logo]`,
        `[${videoLabel}][logo]overlay=main_w-overlay_w-18:18[vfinal]`
      )
    }
    videoLabel = 'vfinal'
  }

  if (videoLabel !== 'vfinal') {
    fp.push(`[${videoLabel}]copy[vfinal]`)
    videoLabel = 'vfinal'
  }

  // 5. Music: trim to reel length + fade out last 2s
  let audioLabel: string | null = null
  if (musicInputIdx >= 0) {
    const fadeStart = Math.max(0, totalDuration - 2).toFixed(2)
    fp.push(
      `[${musicInputIdx}:a]atrim=0:${totalDuration.toFixed(3)},`
      + `afade=t=out:st=${fadeStart}:d=2,`
      + `aformat=sample_rates=44100:channel_layouts=stereo[aout]`
    )
    audioLabel = 'aout'
  }

  // ── Assemble command ────────────────────────────────────────────────────
  const filterComplex = fp.join(';\n')

  const cmd: string[] = [
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', `[${videoLabel}]`,
  ]

  if (audioLabel) {
    cmd.push('-map', `[${audioLabel}]`, '-c:a', 'aac', '-b:a', '192k')
  } else {
    cmd.push('-an')
  }

  cmd.push(
    '-c:v', 'libx264',
    '-crf', '22',
    '-preset', 'fast',
    '-profile:v', 'high',
    '-level', '4.1',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-t', totalDuration.toFixed(3),
    '-y', outputPath,
  )

  console.log(`[reel] FFmpeg: ${mediaFiles.length} clips, ${totalDuration.toFixed(1)}s, music=${!!musicPath}, logo=${!!logoPath}`)

  const runFFmpeg = async (args: string[]) => {
    try {
      const { stderr } = await execFileAsync(FFMPEG_BIN, args, { maxBuffer: 100 * 1024 * 1024 })
      if (stderr) console.log('[reel] FFmpeg stderr:', stderr.slice(-500))
      return true
    } catch (err: any) {
      const ffStderr = (err.stderr ?? '').trim()
      const ffMsg    = (err.message ?? '').trim()
      console.error('[reel] FFmpeg error:', (ffStderr || ffMsg).slice(-800))
      if (existsSync(outputPath)) {
        console.warn('[reel] FFmpeg non-zero exit but output exists — proceeding')
        return true
      }
      return ffStderr || ffMsg || 'FFmpeg failed'
    }
  }

  // First attempt: full command with text overlays
  let result = await runFFmpeg(cmd)

  // Fallback: strip ALL drawtext filters if fonts aren't available
  if (result !== true) {
    console.warn('[reel] Retrying without text overlays (font issue detected)')

    // Rebuild filter_complex without any drawtext filters
    const fpNoText = fp.filter(f => !f.includes('drawtext'))

    // After stripping drawtext, [vfinal] may no longer be produced.
    // We need to alias preDrawtextLabel → vfinal if it isn't already defined.
    const hasVfinal = fpNoText.some(f => f.includes('[vfinal]'))
    if (!hasVfinal) {
      // preDrawtextLabel is the last label before drawtext was applied (e.g. 'vbase')
      if (preDrawtextLabel !== 'vfinal') {
        fpNoText.push(`[${preDrawtextLabel}]copy[vfinal]`)
      }
    }

    const cmdNoText = [
      ...inputArgs,
      '-filter_complex', fpNoText.join(';\n'),
      '-map', '[vfinal]',
    ]
    if (audioLabel) cmdNoText.push('-map', `[${audioLabel}]`, '-c:a', 'aac', '-b:a', '192k')
    else cmdNoText.push('-an')
    cmdNoText.push(
      '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
      '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', '-t', totalDuration.toFixed(3),
      '-y', outputPath,
    )

    result = await runFFmpeg(cmdNoText)
    if (result !== true) {
      throw new Error(`FFmpeg failed: ${String(result).slice(-600)}`)
    }
    console.log('[reel] Completed without text overlays (add fonts to fix)')
  }
}
