import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { enqueueGenerateReel, isQueueAvailable, type GenerateReelJobData } from '@/lib/queue'

// ── Music track URLs ──────────────────────────────────────────────────────────
// Use NEXT_PUBLIC_APP_URL-relative paths served from /public/music/ OR
// set MUSIC_BASE_URL env var to point to a CDN / Supabase storage bucket.
// Tracks must be publicly accessible MP3s reachable by Shotstack's renderer.
// Set any value to null to skip that track (renders will have no music).
const MUSIC_BASE = process.env.MUSIC_BASE_URL ?? ''

const MUSIC_URLS: Record<string, string | null> = {
  afrobeats_upbeat:  MUSIC_BASE ? `${MUSIC_BASE}/afrobeats-upbeat.mp3`         : null,
  afrobeats_chill:   MUSIC_BASE ? `${MUSIC_BASE}/afrobeats-chill.mp3`          : null,
  amapiano_dance:    MUSIC_BASE ? `${MUSIC_BASE}/amapiano-dance.mp3`            : null,
  highlife_classic:  MUSIC_BASE ? `${MUSIC_BASE}/highlife-classic.mp3`         : null,
  pop_romantic:      MUSIC_BASE ? `${MUSIC_BASE}/pop-romantic.mp3`             : null,
  pop_energetic:     MUSIC_BASE ? `${MUSIC_BASE}/pop-energetic.mp3`            : null,
  cinematic:         MUSIC_BASE ? `${MUSIC_BASE}/cinematic-instrumental.mp3`   : null,
}

// ── 10 Viral Themes ───────────────────────────────────────────────────────────
interface ThemeConfig {
  music: string
  transitions: string[]
}
const THEMES: Record<string, ThemeConfig> = {
  viral_wedding:     { music: 'pop_romantic',     transitions: ['fade','zoom','fade','zoom','fade'] },
  birthday_bangerz:  { music: 'afrobeats_upbeat', transitions: ['zoom','wobble','zoom','distortHorizontal','zoom'] },
  afrobeats_moments: { music: 'afrobeats_chill',  transitions: ['carouselLeft','slideLeft','carouselLeft','slideLeft'] },
  amapiano_vibes:    { music: 'amapiano_dance',   transitions: ['wipeLeft','wipeRight','wipeLeft','wipeRight'] },
  love_story:        { music: 'pop_romantic',     transitions: ['fade','zoom','fade','fade'] },
  corporate_flex:    { music: 'cinematic',        transitions: ['wipeLeft','slideLeft','wipeLeft','slideLeft'] },
  party_highlights:  { music: 'afrobeats_upbeat', transitions: ['wobble','carouselLeft','distortHorizontal','carouselLeft'] },
  glow_up_reel:      { music: 'pop_energetic',    transitions: ['zoom','fade','zoom','slideLeft'] },
  highlife_classic:  { music: 'highlife_classic', transitions: ['slideLeft','fade','slideLeft','fade'] },
  cinema_mode:       { music: 'cinematic',        transitions: ['slideLeft','zoom','slideLeft','zoom'] },
}

// ── Transition mapping (UI label → Shotstack ID) ─────────────────────────────
const TRANSITION_MAP: Record<string, string> = {
  fade:    'fade',
  zoom:    'zoom',
  swipe:   'wipeLeft',
  glitch:  'distortHorizontal',
  wipeLeft: 'wipeLeft',
  wipeRight: 'wipeRight',
  slideLeft: 'slideLeft',
  carouselLeft: 'carouselLeft',
  wobble: 'wobble',
  distortHorizontal: 'distortHorizontal',
}

// ── Tier limits ───────────────────────────────────────────────────────────────
const TIER_LIMITS: Record<string, number> = {
  free:      1,   // 1 reel/month (watermarked)
  flex:      5,
  pro:       5,
  planner:   999, // unlimited
  business:  999,
  corporate: 999,
}

const CLIP_DURATION = 3.0
const TRANSITION_OVERLAP = 0.5

interface TextOverlays {
  title?: string
  caption?: string
  outro?: string
}

interface MediaItem {
  id: string
  url: string
  mediaType: 'image' | 'video'
  trimStart?: number  // video only
  trimEnd?: number    // video only
}

function getTransitionForIndex(
  transitions: string[],
  index: number,
  fallback: string
): string {
  const t = transitions[index % transitions.length] ?? fallback
  return TRANSITION_MAP[t] ?? t
}

function buildShotstackManifest(
  media: MediaItem[],
  musicTrackId: string | null,     // track key (not a URL)
  logoUrl: string | null,
  removeWatermark: boolean,
  logoPosition: 'throughout' | 'outro',
  textOverlays: TextOverlays | null,
  themeTransitions: string[],
  globalTransition: string,
) {
  const clipDuration = CLIP_DURATION
  const overlap = TRANSITION_OVERLAP
  const effectiveDuration = clipDuration - overlap
  const totalDuration = effectiveDuration * media.length + overlap

  // ── Media track (photos + videos) ─────────────────────────────────────────
  const mediaClips = media.map((item, i) => {
    const transitionIn = getTransitionForIndex(themeTransitions.length > 0 ? themeTransitions : [globalTransition], i, 'fade')
    const transitionOut = i < media.length - 1 ? 'fade' : undefined

    if (item.mediaType === 'video') {
      return {
        asset: {
          type: 'video',
          src: item.url,
          volume: 0,   // mute — use music track instead
          ...(item.trimStart != null ? { trim: item.trimStart } : {}),
        },
        start: i * effectiveDuration,
        length: clipDuration,
        fit: 'cover',
        transition: { in: transitionIn, ...(transitionOut ? { out: transitionOut } : {}) },
      }
    }

    return {
      asset: { type: 'image', src: item.url },
      start: i * effectiveDuration,
      length: clipDuration,
      effect: i % 2 === 0 ? 'zoomIn' : 'zoomOut',
      fit: 'cover',
      transition: { in: transitionIn, ...(transitionOut ? { out: transitionOut } : {}) },
    }
  })

  const tracks: Record<string, unknown>[] = [{ clips: mediaClips }]

  // ── Text overlays (HTML clips) ─────────────────────────────────────────────
  if (textOverlays?.title) {
    tracks.push({
      clips: [{
        asset: {
          type: 'html',
          html: `<p style="font-family:Montserrat,Arial,sans-serif;font-size:68px;font-weight:900;color:#FFFFFF;text-align:center;text-shadow:0 3px 24px rgba(0,0,0,0.85);padding:16px 24px;line-height:1.15;">${escapeHtml(textOverlays.title)}</p>`,
          width: 1040,
          height: 280,
        },
        start: 0,
        length: Math.min(3.5, totalDuration),
        position: 'center',
        offset: { x: 0, y: 0.28 },
        transition: { in: 'fade', out: 'fade' },
      }],
    })
  }

  if (textOverlays?.caption) {
    const captionStart = totalDuration / 2 - 2
    tracks.push({
      clips: [{
        asset: {
          type: 'html',
          html: `<p style="font-family:Montserrat,Arial,sans-serif;font-size:52px;font-weight:700;color:#FFFFFF;text-align:center;background:rgba(0,0,0,0.55);padding:14px 28px;border-radius:16px;line-height:1.25;">${escapeHtml(textOverlays.caption)}</p>`,
          width: 960,
          height: 200,
        },
        start: Math.max(0, captionStart),
        length: 4,
        position: 'center',
        offset: { x: 0, y: 0 },
        transition: { in: 'fade', out: 'fade' },
      }],
    })
  }

  if (textOverlays?.outro) {
    tracks.push({
      clips: [{
        asset: {
          type: 'html',
          html: `<p style="font-family:Montserrat,Arial,sans-serif;font-size:60px;font-weight:900;color:#FFFFFF;text-align:center;text-shadow:0 3px 24px rgba(0,0,0,0.85);padding:16px 24px;line-height:1.2;">${escapeHtml(textOverlays.outro)}</p>`,
          width: 1040,
          height: 260,
        },
        start: Math.max(0, totalDuration - 4),
        length: 4,
        position: 'center',
        offset: { x: 0, y: -0.15 },
        transition: { in: 'fade', out: 'fade' },
      }],
    })
  }

  // ── Logo overlay ───────────────────────────────────────────────────────────
  // NOTE: Shotstack V1 does NOT accept width/height on image assets.
  // Sizing is controlled via `scale` (fraction of output width) at the clip level.
  if (logoUrl) {
    if (logoPosition === 'outro') {
      // Logo only in final 2 seconds — large, centered (outro card)
      // scale: 0.37 ≈ 400px wide on 1080px output
      const outroStart = Math.max(0, totalDuration - 2)
      tracks.push({
        clips: [{
          asset: { type: 'image', src: logoUrl },
          start: outroStart,
          length: 2,
          position: 'center',
          offset: { x: 0, y: 0.25 },
          opacity: 1,
          scale: 0.37,
        }],
      })
    } else {
      // Throughout — small, top-right corner
      // scale: 0.15 ≈ 160px wide on 1080px output
      tracks.push({
        clips: [{
          asset: { type: 'image', src: logoUrl },
          start: 0,
          length: totalDuration,
          position: 'topRight',
          opacity: 0.85,
          offset: { x: -0.03, y: 0.03 },
          scale: 0.15,
        }],
      })
    }
  }

  // ── GuestVue watermark (unless removed) ───────────────────────────────────
  if (!removeWatermark) {
    tracks.push({
      clips: [{
        asset: {
          type: 'html',
          html: '<p style="font-family:sans-serif;font-size:22px;color:rgba(255,255,255,0.65);font-weight:600;letter-spacing:0.5px;">Powered by GuestVue</p>',
          width: 520,
          height: 60,
        },
        start: 0,
        length: totalDuration,
        position: 'bottomLeft',
        offset: { x: 0.02, y: 0.02 },
      }],
    })
  }

  // ── Music track ───────────────────────────────────────────────────────────
  const musicUrl: string | null = musicTrackId ? (MUSIC_URLS[musicTrackId] ?? null) : null
  if (musicUrl) {
    tracks.push({
      clips: [{
        asset: { type: 'audio', src: musicUrl, volume: 1, effect: 'fadeOut' },
        start: 0,
        length: totalDuration,
      }],
    })
  }

  return {
    timeline: { background: '#000000', tracks },
    output: {
      format: 'mp4',
      resolution: 'mobile',
      size: { width: 1080, height: 1920 },
      fps: 30,
      quality: 'high',
    },
    // Prefer explicit server-side URL → then Vercel deployment URL → then skip callback
    callback: (() => {
      const base =
        process.env.APP_BASE_URL ||                              // set this in Vercel env vars
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ? process.env.NEXT_PUBLIC_APP_URL : null)
      return base ? `${base}/api/webhooks/shotstack` : undefined
    })(),
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ── Normalize SHOTSTACK_ENV ───────────────────────────────────────────────────
// Valid Shotstack URL segments are exactly "stage" (sandbox) or "v1" (production).
// Users may set SHOTSTACK_ENV to "PRODUCTION", "prod", "live", etc. — normalise here.
function normalizeShotstackEnv(raw: string | undefined): string {
  const s = (raw ?? '').toLowerCase().trim()
  if (s === 'v1' || s === 'production' || s === 'prod' || s === 'live') return 'v1'
  return 'stage'
}

// ── Dispatch to Railway worker via HTTP ───────────────────────────────────────
async function dispatchToWorkerHTTP(reelId: string, eventId: string, type: string) {
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
      body: JSON.stringify({ reelId, eventId, type }),
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

  // Verify ownership + plan
  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single() as any

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // ── Tier gate: check monthly reel count ───────────────────────────────────
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

    // Get all events for this user
    const { data: userEvents } = await admin
      .from('events')
      .select('id')
      .eq('host_id', user.id) as any

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

  // For free plan, reel generation is allowed but will have watermark
  if (event.plan === 'free') {
    // Free plan can generate 1 watermarked reel — allow through but force watermark
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let uploadIds: string[] = []
  let musicTrack: string | null = null
  let removeWatermark = false
  let logoUrl: string | null = null
  let theme: string | null = null
  let transition: string = 'fade'
  let textOverlays: TextOverlays | null = null
  let logoPosition: 'throughout' | 'outro' = 'outro'

  try {
    const body = await req.json()
    uploadIds = Array.isArray(body.uploadIds) ? body.uploadIds : []
    musicTrack = typeof body.musicTrack === 'string' ? body.musicTrack : null
    removeWatermark = body.removeWatermark === true
    logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : null
    theme = typeof body.theme === 'string' ? body.theme : null
    transition = typeof body.transition === 'string' ? body.transition : 'fade'
    textOverlays = body.textOverlays && typeof body.textOverlays === 'object' ? body.textOverlays : null
    logoPosition = body.logoPosition === 'throughout' ? 'throughout' : 'outro'

    // Theme overrides music + transitions
    if (theme && THEMES[theme]) {
      if (!musicTrack) musicTrack = THEMES[theme].music
    }
  } catch { /* optional body */ }

  // Force watermark on free plan
  if (event.plan === 'free' || planType === 'free') {
    removeWatermark = false
  }

  const reelType = (event.plan === 'pro' || isUnlimited) ? 'advanced' : 'basic'

  // ── Fetch ordered media (photos + videos) ─────────────────────────────────
  let mediaItems: MediaItem[] = []

  if (uploadIds.length > 0) {
    const { data: uploads } = await admin
      .from('uploads')
      .select('id, original_url, display_url, type')
      .in('id', uploadIds)
      .eq('event_id', eventId) as any

    if (uploads && uploads.length > 0) {
      // Preserve the user's ordering from uploadIds array
      const uploadMap = new Map(uploads.map((u: any) => [u.id, u]))
      mediaItems = uploadIds
        .map((id: string) => {
          const u = uploadMap.get(id) as any
          if (!u) return null
          const url = u.original_url || u.display_url
          if (!url) return null
          return {
            id: u.id,
            url,
            mediaType: u.type === 'video' ? 'video' : 'image',
          } as MediaItem
        })
        .filter(Boolean) as MediaItem[]
    }
  }

  if (mediaItems.length < 3) {
    return NextResponse.json({ error: 'Select at least 3 photos or videos with valid URLs.' }, { status: 400 })
  }

  // ── Create reel record ────────────────────────────────────────────────────
  const { data: reel, error: reelErr } = await admin
    .from('reels')
    .insert({
      event_id: eventId,
      type: reelType,
      status: 'queued',
      upload_ids: uploadIds.length > 0 ? uploadIds : [],
      music_track: musicTrack,
      published_to_gallery: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (reelErr) return NextResponse.json({ error: 'Failed to queue reel' }, { status: 500 })

  // ── Dispatch chain: BullMQ → Railway HTTP → Shotstack ────────────────────
  //
  // Priority 1: Redis is configured → enqueue to BullMQ (Railway worker consumes)
  // Priority 2: RAILWAY_WORKER_URL is set → direct HTTP dispatch to worker
  // Priority 3: SHOTSTACK_API_KEY is set → Shotstack cloud renderer
  // Fallback: mark failed with helpful message
  //
  // ─────────────────────────────────────────────────────────────────────────

  // ── Path 1: BullMQ via Redis ───────────────────────────────────────────────
  if (isQueueAvailable()) {
    try {
      const jobData: GenerateReelJobData = {
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

      const jobId = await enqueueGenerateReel(jobData)

      if (jobId) {
        await admin.from('reels').update({ status: 'processing' }).eq('id', reel.id)
        reel.status = 'processing'
        console.log(`[generate-reel] Enqueued BullMQ job ${jobId} for reel ${reel.id}`)
        return NextResponse.json({ reel, workerOnline: true, engine: 'bullmq' }, { status: 201 })
      }
    } catch (err) {
      console.error('[generate-reel] BullMQ enqueue failed, falling through:', err)
    }
  }

  // ── Path 2: Railway worker HTTP ────────────────────────────────────────────
  if (process.env.RAILWAY_WORKER_URL && process.env.WORKER_SECRET) {
    const dispatched = await dispatchToWorkerHTTP(reel.id, eventId, reelType)
    if (dispatched) {
      await admin.from('reels').update({ status: 'processing' }).eq('id', reel.id)
      reel.status = 'processing'
      console.log(`[generate-reel] Dispatched to Railway worker (HTTP) for reel ${reel.id}`)
      return NextResponse.json({ reel, workerOnline: true, engine: 'railway-http' }, { status: 201 })
    }
  }

  // ── Path 3: Shotstack fallback ─────────────────────────────────────────────
  const apiKey = process.env.SHOTSTACK_API_KEY
  const apiEnv = normalizeShotstackEnv(process.env.SHOTSTACK_ENV)

  if (!apiKey) {
    await admin.from('reels').update({
      status: 'failed',
      error_msg: 'No rendering engine configured. Set REDIS_URL, RAILWAY_WORKER_URL, or SHOTSTACK_API_KEY.',
    }).eq('id', reel.id)
    reel.status = 'failed'
    return NextResponse.json({
      reel,
      workerOnline: false,
      message: 'No rendering engine is configured. Contact support.',
    }, { status: 201 })
  }

  try {
    const themeConfig = theme ? THEMES[theme] : null
    const themeTransitions = themeConfig?.transitions ?? []

    const manifest = buildShotstackManifest(
      mediaItems,
      musicTrack,
      logoUrl,
      removeWatermark,
      logoPosition,
      textOverlays,
      themeTransitions,
      TRANSITION_MAP[transition] ?? 'fade',
    )

    const shotstackRes = await fetch(`https://api.shotstack.io/edit/${apiEnv}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(manifest),
    })

    if (!shotstackRes.ok) {
      const errBody = await shotstackRes.text()
      console.error('[generate-reel] Shotstack rejected:', shotstackRes.status, errBody)

      await admin.from('reels').update({
        status: 'failed',
        error_msg: `Shotstack HTTP ${shotstackRes.status}: ${errBody.slice(0, 300)}`,
      }).eq('id', reel.id)
      reel.status = 'failed'
      return NextResponse.json({ reel, workerOnline: false, engine: 'shotstack' }, { status: 201 })
    }

    const shotstackBody = await shotstackRes.json()
    const renderId: string = shotstackBody?.response?.id

    if (renderId) {
      await admin.from('reels')
        .update({ shotstack_render_id: renderId, status: 'processing' })
        .eq('id', reel.id)
      reel.shotstack_render_id = renderId
      reel.status = 'processing'
    } else {
      await admin.from('reels').update({
        status: 'failed',
        error_msg: 'Shotstack accepted the request but returned no render ID.',
      }).eq('id', reel.id)
      reel.status = 'failed'
    }

    return NextResponse.json({ reel, workerOnline: true, engine: 'shotstack' }, { status: 201 })
  } catch (err) {
    console.error('[generate-reel] Shotstack submission failed:', err)
    await admin.from('reels').update({
      status: 'failed',
      error_msg: 'Network error while submitting to renderer. Try again.',
    }).eq('id', reel.id)
    reel.status = 'failed'
    return NextResponse.json({ reel, workerOnline: false, engine: 'shotstack' }, { status: 201 })
  }
}
