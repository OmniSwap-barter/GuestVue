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
import { existsSync, statSync } from 'fs'
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

// ── Upload reel to Supabase Storage ──────────────────────────────────────────
// Supabase Storage is used for all reel outputs because:
//   1. CORS headers are correctly set — videos play inline in the browser
//   2. Same auth as the rest of the app — no extra credentials needed
//   3. R2 public buckets block <video> streaming due to missing CORS headers
async function uploadReelOutput(key: string, body: Buffer, contentType: string): Promise<string> {
  console.log('[reel] Uploading to Supabase Storage')
  const { error } = await supabase.storage
    .from('event-uploads')
    .upload(key, body, { contentType, upsert: true })

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from('event-uploads')
    .getPublicUrl(key)

  console.log('[reel] Uploaded to Supabase Storage:', publicUrl)
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
  /** Uniform playback speed applied to all video clips. 1.0 = normal. */
  clipSpeed?: 0.5 | 1.0 | 1.5 | 2.5
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

// ── Audio speed helpers ───────────────────────────────────────────────────────
// atempo only accepts values in [0.5, 2.0]. For speeds outside that range
// we chain multiple atempo filters (e.g. 2.5x = atempo=2.0,atempo=1.25).
function buildAtempoChain(speed: number): string {
  if (speed === 1.0) return 'aresample=44100'
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
  const filters: string[] = []
  let remaining = speed
  // Reduce speeds > 2.0 by chaining 2.0 stages
  while (remaining > 2.0 + 1e-9) {
    filters.push('atempo=2.0')
    remaining /= 2.0
  }
  // Raise speeds < 0.5 by chaining 0.5 stages
  while (remaining < 0.5 - 1e-9) {
    filters.push('atempo=0.5')
    remaining /= 0.5
  }
  filters.push(`atempo=${clamp(remaining, 0.5, 2.0).toFixed(4)}`)
  return filters.join(',')
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

    // Uniform speed applied to all video clips (photos are always static)
    const clipSpeed: number = args.clipSpeed ?? (formats.clip_speed as number | undefined) ?? 1.0

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
    // heic is an Apple still-image format — NOT a video. Treating it as video
    // causes FFmpeg to receive a HEIC file with -stream_loop -1, producing zero
    // decoded frames and killing the entire filter_complex ("Nothing was written").
    // HEIC files are saved as .jpg and looped as photos instead.
    const VIDEO_EXTS = new Set(['mp4','mov','avi','mkv','webm','m4v','3gp','mts','hevc','ts'])
    const mediaFiles: MediaFile[] = []
    for (let i = 0; i < Math.min(orderedUploads.length, 30); i++) {
      const u = orderedUploads[i]
      const url = u.original_url || u.display_url
      if (!url) continue

      // Check URL extension first
      const urlPath = url.split('?')[0]
      const urlExt  = (urlPath.split('.').pop() ?? '').toLowerCase()

      // HEIC/HEIF are Apple still-image containers. ffmpeg-static does NOT include
      // libheif, so FFmpeg probes the file content (not the extension) and fails
      // to decode HEIC bytes — even when the file is saved as .jpg. This causes
      // error -22 (Invalid argument) in the filter_complex thread, which aborts
      // the entire render ("Nothing was written into output file"). Skip early.
      if (urlExt === 'heic' || urlExt === 'heif') {
        console.warn(`[reel] Skipping ${u.id}: HEIC/HEIF extension — not decodable by ffmpeg-static`)
        continue
      }

      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`[reel] Skipping ${u.id}: HTTP ${res.status}`)
        continue
      }

      // Check Content-Type header as secondary signal
      const contentType = res.headers.get('content-type') ?? ''

      // Also skip if the server reports HEIC/HEIF content-type regardless of URL extension
      if (contentType.includes('heic') || contentType.includes('heif') || contentType.includes('image/heic') || contentType.includes('image/heif')) {
        console.warn(`[reel] Skipping ${u.id}: HEIC/HEIF content-type (${contentType}) — not decodable by ffmpeg-static`)
        continue
      }

      const isVideo = u.type === 'video' || VIDEO_EXTS.has(urlExt) || contentType.startsWith('video/')
      const ext = isVideo ? 'mp4' : 'jpg'
      const localPath = path.join(tmpDir, `media_${i}.${ext}`)

      console.log(`[reel] media_${i}: dbType=${u.type} urlExt=${urlExt} contentType=${contentType} → treating as ${isVideo ? 'video' : 'photo'}`)

      await writeFile(localPath, Buffer.from(await res.arrayBuffer()))
      mediaFiles.push({
        localPath,
        type: isVideo ? 'video' : 'photo',
        duration: isVideo ? 3.5 : 3.0,
        // Speed only applies to video clips; photos are always static
        speed: isVideo ? clipSpeed : 1.0,
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
      theme,
      tmpDir,
    })

    // ── Guard: reject suspiciously small files before uploading ───────────
    // A valid 9:16 MP4 with at least a few clips is always well over 50 KB.
    // If FFmpeg exited non-zero but left a partial file, this catches it.
    const fileSize = statSync(outputPath).size
    if (fileSize < 50_000) {
      throw new Error(
        `FFmpeg produced a suspiciously small file (${fileSize} bytes) — likely a failed or empty render`
      )
    }
    console.log(`[generate-reel] Output file size: ${(fileSize / 1024).toFixed(0)} KB`)

    // ── Upload reel (Supabase Storage) ─────────────────────────────────────
    const reelBuf = await readFile(outputPath)
    const reelKey = `events/${eventId}/reels/${reelId}.mp4`
    const outputUrl = await uploadReelOutput(reelKey, reelBuf, 'video/mp4')

    console.log(`[generate-reel] Done: ${outputUrl}`)

    await supabase.from('reels').update({
      status: 'complete',
      output_url: outputUrl,
      draft_url:  outputUrl,   // mirror so DraftWorkspace can play/download immediately
      completed_at: new Date().toISOString(),
      formats: { ...formats, '9:16': outputUrl, clip_speed: clipSpeed },
    }).eq('id', reelId)

    // ── Email host ─────────────────────────────────────────────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: host } = await supabase
          .from('profiles').select('email, full_name').eq('id', event.host_id).single()
        if (host?.email) {
          // Use the worker-local copy of resend helpers — the repo-root lib/resend.ts
          // is NOT available inside the Railway Docker image (build context = worker/).
          const { sendReelReadyEmail } = await import('../lib/resend')
          await sendReelReadyEmail({
            to: host.email,
            hostName: host.full_name || 'there',
            eventName: event.name,
            reelUrl: outputUrl,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://theguestvue.com'}/dashboard/events/${eventId}`,
          })
          console.log(`[reel] Email sent to ${host.email}`)
        }
      } catch (e) { console.warn('[reel] Email failed (non-fatal):', e) }
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
  theme: string | null
  tmpDir: string
}

const VALID_XFADE = new Set(['fade','wipeleft','wiperight','slideleft','slideright','circlecrop','radial','dissolve'])

// ── Theme-aware color grade (applied per clip after scale/crop) ───────────────
// Keeps it subtle — the goal is mood, not Instagram filter overkill.
const THEME_COLOR_GRADE: Record<string, string> = {
  viral_wedding:     'colorchannelmixer=rr=1.10:gg=0.98:bb=0.88',  // warm gold
  love_story:        'colorchannelmixer=rr=1.08:gg=0.97:bb=0.90',  // warm rose
  birthday_bangerz:  'colorchannelmixer=rr=1.04:gg=1.00:bb=1.06',  // cool pop
  cinema_mode:       'colorchannelmixer=rr=0.95:gg=0.98:bb=1.05',  // cool cinematic
  corporate_flex:    'colorchannelmixer=rr=0.97:gg=0.99:bb=1.03',  // slight cool
  glow_up_reel:      'colorchannelmixer=rr=1.05:gg=1.01:bb=0.95',  // warm glow
}

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
  theme,
  tmpDir,
}: BuildArgs) {

  // Wedding/romance themes use longer, more cinematic clip timing
  const isCinematic = theme === 'viral_wedding' || theme === 'love_story' || theme === 'cinema_mode'
  const CLIP_DUR  = isCinematic ? 4.0 : 3.0
  const XFADE_DUR = isCinematic ? 0.8 : 0.5
  const EFFECTIVE = CLIP_DUR - XFADE_DUR

  // Color grade filter for this theme (empty string = no grade)
  const colorGrade = theme ? (THEME_COLOR_GRADE[theme] ?? '') : ''
  const totalDuration = EFFECTIVE * mediaFiles.length + XFADE_DUR

  // ── Pre-flight guards — catch bad inputs before FFmpeg sees them ────────
  if (mediaFiles.length === 0) {
    throw new Error('No valid media files to render — all inputs were skipped or failed to download')
  }
  if (totalDuration < 1) {
    throw new Error(
      `Computed duration is ${totalDuration.toFixed(3)}s — too short to render. Check clip durations.`
    )
  }

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
  // Clamp: photos must hold for at least 1.5s so the concat/xfade filter has
  // enough frames to work with. CLIP_DUR is always ≥3.0 from the constants above,
  // but this guard makes it explicit and safe if those constants are ever touched.
  const holdDuration = Math.max(CLIP_DUR, 1.5)

  for (const mf of mediaFiles) {
    if (mf.type === 'video') {
      // +1 headroom so xfade can blend into the next clip without running out of frames
      inputArgs.push('-stream_loop', '-1', '-t', String(holdDuration + 1), '-i', mf.localPath)
    } else {
      inputArgs.push('-loop', '1', '-t', String(holdDuration + 1), '-i', mf.localPath)
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

  // 1. Smart cover-crop all media to 1080×1920 (no black bars).
  //    force_original_aspect_ratio=increase scales to COVER, then crop=1080:1920
  //    trims from center — equivalent to CSS object-fit:cover.
  //    This fills the frame for all aspect ratios: landscape, portrait, square.
  //    Color grade applied per clip if theme has one.
  //
  //    Variable speed for video clips:
  //    We trim (speed × CLIP_DUR) seconds of source material so that after
  //    setpts=PTS/speed the output is exactly CLIP_DUR seconds long.
  //    e.g. 2x speed: trim 6s → setpts=PTS/2 → 3s output  (fast forward)
  //         0.5x:     trim 1.5s → setpts=PTS/0.5 → 3s output (slow motion)
  for (let i = 0; i < mediaFiles.length; i++) {
    const mf = mediaFiles[i]
    const grade = colorGrade ? `,${colorGrade}` : ''
    if (mf.type === 'photo') {
      fp.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,`
        + `crop=1080:1920,setsar=1,`
        + `fps=30,setpts=PTS-STARTPTS${grade}[v${i}]`
      )
    } else {
      const srcDur   = (CLIP_DUR * mf.speed).toFixed(3)  // source seconds to consume
      const speedStr = mf.speed !== 1.0 ? `,setpts=PTS/${mf.speed}` : ''
      fp.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,`
        + `crop=1080:1920,setsar=1,`
        + `trim=0:${srcDur},setpts=PTS-STARTPTS${grade}${speedStr}[v${i}]`
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
      // offset = i × EFFECTIVE = i × (CLIP_DUR - XFADE_DUR)
      // Each prior xfade shortens the cumulative timeline by XFADE_DUR,
      // so the offset must account for that shrinkage — not use raw CLIP_DUR.
      //   i=1: 1×2.5 = 2.5s — [v0]  is 3.0s long, blend needs t=2.5→3.0 ✓
      //   i=2: 2×2.5 = 5.0s — [xf1] is 5.5s long, blend needs t=5.0→5.5 ✓
      //   i=3: 3×2.5 = 7.5s — [xf2] is 8.0s long, blend needs t=7.5→8.0 ✓
      const offset = (i * EFFECTIVE).toFixed(3)
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

  // 5. Audio chain — two cases:
  //
  //    A) Music selected: trim to reel length, fade out, normalise volume.
  //
  //    B) No music → -an (silent). Raw video-clip audio ([i:a]) is intentionally
  //       NOT extracted. Many mobile uploads (HEVC, iOS Live Photos, screen
  //       recordings) have no audio stream at all. Referencing [i:a] on a
  //       stream-less file causes FFmpeg error -22 (Invalid argument) which
  //       aborts the entire render — video AND audio encoders both fail,
  //       producing "Nothing was written into output file". The drawtext-strip
  //       fallback retry doesn't help because the broken audio filter is still
  //       present. Removing Case B entirely eliminates this class of crash.
  //       Highlight reels use music as their primary soundtrack anyway.
  //
  let audioLabel: string | null = null

  if (musicInputIdx >= 0) {
    // Music selected: trim to reel length, fade out last 2s, normalise
    const fadeStart = Math.max(0, totalDuration - 2).toFixed(2)
    fp.push(
      `[${musicInputIdx}:a]atrim=0:${totalDuration.toFixed(3)},`
      + `afade=t=out:st=${fadeStart}:d=2,`
      + `volume=0.88,`
      + `aformat=sample_rates=44100:channel_layouts=stereo[aout]`
    )
    audioLabel = 'aout'
  }
  // No music → audioLabel stays null → cmd gets -an below

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
      // Log the exact command so it can be reproduced locally
      console.error('[FFMPEG CMD]', FFMPEG_BIN, args.join(' '))
      if (existsSync(outputPath) && statSync(outputPath).size >= 50_000) {
        console.warn('[reel] FFmpeg non-zero exit but valid output exists — proceeding')
        return true
      }
      return ffStderr || ffMsg || 'FFmpeg failed'
    }
  }

  // Log the full command before running — appears in Railway logs for local repro
  console.log('[FFMPEG CMD]', FFMPEG_BIN, cmd.join(' '))

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
