'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Upload {
  id: string
  original_url: string | null
  display_url: string | null
  type: string
  status: string
}

interface Reel {
  id: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  output_url: string | null
  draft_url: string | null
  music_track: string | null
  upload_ids: string[]
  type: string
  created_at: string
  published_to_gallery: boolean
  formats?: {
    remove_watermark?: boolean
    logo_url?: string | null
    theme?: string | null
    transition?: string
    text_overlays?: { title?: string; caption?: string; outro?: string } | null
    logo_position?: 'throughout' | 'outro'
  }
}

interface Props {
  event: { id: string; name: string; plan: string }
  photos: Upload[]
  videos?: Upload[]
  profile?: { plan_type: string; is_unlimited: boolean }
}

// ── Music tracks ──────────────────────────────────────────────────────────────
const MUSIC_TRACKS = [
  { id: 'afrobeats_upbeat', label: 'Afrobeats — Upbeat',    emoji: '🎵' },
  { id: 'afrobeats_chill',  label: 'Afrobeats — Chill',     emoji: '🎶' },
  { id: 'amapiano_dance',   label: 'Amapiano — Dance',      emoji: '🕺' },
  { id: 'highlife_classic', label: 'Highlife — Classic',    emoji: '🎷' },
  { id: 'pop_romantic',     label: 'Pop — Romantic',        emoji: '💕' },
  { id: 'pop_energetic',    label: 'Pop — Energetic',       emoji: '⚡' },
  { id: 'cinematic',        label: 'Cinematic — No Vocals', emoji: '🎬' },
] as const

// ── 10 Viral themes ───────────────────────────────────────────────────────────
const THEMES = [
  { id: 'viral_wedding',     emoji: '💍', label: 'Viral Wedding TikTok',   desc: 'Romantic fades, soft zooms',         music: 'pop_romantic',     transition: 'fade'  },
  { id: 'birthday_bangerz',  emoji: '🎂', label: 'Birthday Bangerz',       desc: 'High-energy cuts & zoom bursts',     music: 'afrobeats_upbeat', transition: 'zoom'  },
  { id: 'afrobeats_moments', emoji: '🎵', label: 'Afrobeats Moments',      desc: 'Carousel slides to the beat',        music: 'afrobeats_chill',  transition: 'swipe' },
  { id: 'amapiano_vibes',    emoji: '🕺', label: 'Amapiano Vibes',         desc: 'Smooth wipe transitions',            music: 'amapiano_dance',   transition: 'swipe' },
  { id: 'love_story',        emoji: '💕', label: 'Love Story',             desc: 'Gentle fades & slow zooms',          music: 'pop_romantic',     transition: 'fade'  },
  { id: 'corporate_flex',    emoji: '🏢', label: 'Corporate Flex',         desc: 'Clean wipes, cinematic score',       music: 'cinematic',        transition: 'swipe' },
  { id: 'party_highlights',  emoji: '🥳', label: 'Party Highlights',       desc: 'Glitch cuts & carousels',            music: 'afrobeats_upbeat', transition: 'glitch'},
  { id: 'glow_up_reel',      emoji: '✨', label: 'Glow Up Reel',           desc: 'Energetic zooms & fades',            music: 'pop_energetic',    transition: 'zoom'  },
  { id: 'highlife_classic',  emoji: '🎷', label: 'Highlife Classic',       desc: 'Classic slides, timeless feel',      music: 'highlife_classic', transition: 'swipe' },
  { id: 'cinema_mode',       emoji: '🎬', label: 'Cinema Mode',            desc: 'Dramatic slides & cinematic music',  music: 'cinematic',        transition: 'swipe' },
] as const

// ── Transition options ────────────────────────────────────────────────────────
const TRANSITIONS = [
  { id: 'fade',   label: 'Fade',   emoji: '🌅' },
  { id: 'zoom',   label: 'Zoom',   emoji: '🔍' },
  { id: 'swipe',  label: 'Swipe',  emoji: '👈' },
  { id: 'glitch', label: 'Glitch', emoji: '⚡' },
] as const

// ── Render progress stages ────────────────────────────────────────────────────
const RENDER_STAGES = [
  { key: 'queued',    label: 'Queued',               pct: 8  },
  { key: 'fetching',  label: 'Optimizing Assets',    pct: 25 },
  { key: 'rendering', label: 'Rendering Transitions',pct: 60 },
  { key: 'saving',    label: 'Finalizing',           pct: 90 },
  { key: 'complete',  label: 'Ready',                pct: 100},
]

function stageFromStatus(status: string) {
  return RENDER_STAGES.find(s => s.key === status) ?? RENDER_STAGES[0]
}

type BuilderStatus = 'idle' | 'uploading_logo' | 'submitting' | 'error'
type EditorTab = 'themes' | 'timeline' | 'music' | 'text' | 'branding'

// ── Tier limits ───────────────────────────────────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  flex: 'Flex',
  pro: 'Pro',
  planner: 'Event Planner',
  business: 'Business',
  corporate: 'Corporate',
}

// ─── Upgrade Modal ──────────────────────────────────────────────────────────
function UpgradeModal({ planType, limit, onClose }: { planType: string; limit: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🎬</span>
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-1">Monthly limit reached</h3>
          <p className="text-slate-500 text-sm">
            Your {TIER_LABEL[planType] ?? planType} plan allows {limit} reel{limit !== 1 ? 's' : ''} per month.
            Upgrade for unlimited cloud-rendered reels.
          </p>
        </div>
        <div className="space-y-2 mb-5">
          {[
            { tier: 'Flex / Pro', limit: '5 reels/month', features: 'All transitions, custom text, no watermark' },
            { tier: 'Planner / Business', limit: 'Unlimited', features: 'Full editor suite, white-label, 4K export' },
          ].map(t => (
            <div key={t.tier} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-[#0A4F6B] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-900">{t.tier} — {t.limit}</p>
                <p className="text-xs text-slate-500">{t.features}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Maybe later
          </button>
          <Link href="/pricing"
            className="flex-1 py-2.5 text-sm font-bold text-white bg-[#0A4F6B] rounded-xl hover:bg-[#1E5AAF] transition-all text-center">
            View plans →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Upgrade wall (plan doesn't support reels at all) ──────────────────────
function UpgradeWall() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="relative p-8 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-4xl">🎬</span>
          </div>
          <h2 className="font-bold text-2xl text-white mb-2">AI Highlight Reel</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
            Transform your event photos into a cinematic 9:16 TikTok-ready reel — CapCut-quality, cloud-rendered in minutes.
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: '✂️', title: '10 Viral Themes',  desc: 'Wedding, Afrobeats, Amapiano & more' },
            { icon: '🎵', title: 'Licensed Tracks',  desc: '7 curated genres across African music' },
            { icon: '📱', title: '1080×1920 Export', desc: 'Share-ready for Reels, TikTok & Shorts' },
          ].map(f => (
            <div key={f.title} className="bg-slate-50 rounded-xl p-4 text-center">
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <p className="font-bold text-slate-800 text-sm">{f.title}</p>
              <p className="text-xs text-slate-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing"
          className="block w-full bg-[#0A4F6B] text-white font-bold py-3 rounded-xl text-center hover:bg-[#1E5AAF] transition-all">
          Upgrade to unlock AI Reels →
        </Link>
      </div>
    </div>
  )
}

// ─── Progress Banner ────────────────────────────────────────────────────────
function ProgressBanner({ reel }: { reel: Reel }) {
  const rawStatus = (reel.status as string)
  const stage = stageFromStatus(rawStatus)
  const isPulsing = rawStatus !== 'complete'
  const themeName = reel.formats?.theme
    ? THEMES.find(t => t.id === reel.formats?.theme)?.label
    : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 60%, #0A4F6B 100%)' }}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          {isPulsing ? (
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#14B8A6]"
                  style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          ) : (
            <span className="text-xl">✅</span>
          )}
          <div>
            <p className="font-bold text-white text-base">
              {stage.label === 'Ready' ? 'Your reel is ready!' : `Your reel is ${stage.label.toLowerCase()}`}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              {reel.upload_ids?.length ?? 0} photos{reel.music_track ? ` · ${MUSIC_TRACKS.find(t => t.id === reel.music_track)?.label ?? reel.music_track}` : ''}
              {themeName ? ` · ${themeName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {RENDER_STAGES.filter(s => s.key !== 'complete').map(s => {
            const isActive = s.key === rawStatus
            const isPast = RENDER_STAGES.findIndex(x => x.key === rawStatus) >
                          RENDER_STAGES.findIndex(x => x.key === s.key)
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold
                  ${isPast ? 'bg-[#14B8A6] border-[#14B8A6] text-white'
                  : isActive ? 'border-[#14B8A6] bg-transparent'
                  : 'border-white/20 bg-transparent'}`}>
                  {isPast ? '✓' : ''}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? 'text-[#14B8A6]' : isPast ? 'text-white/60' : 'text-white/30'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stage.pct}%`,
              background: 'linear-gradient(90deg, #0A4F6B, #14B8A6)',
            }} />
        </div>

        <p className="text-white/40 text-xs mt-3">
          {rawStatus === 'queued'
            ? 'Your reel is next in queue. Processing starts shortly.'
            : 'Rendering in the cloud at 1080×1920 (9:16). This page updates automatically.'}
        </p>
        <p className="text-white/30 text-xs mt-1">
          Queued {new Date(reel.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ─── Draft Workspace ────────────────────────────────────────────────────────
function DraftWorkspace({
  reel, eventName, onPublish, onRegenerate, publishing,
}: {
  reel: Reel
  eventName: string
  onPublish: () => void
  onRegenerate: () => void
  publishing: boolean
}) {
  const videoUrl = reel.draft_url || reel.output_url
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-bold text-amber-700">Draft — not published</span>
        </div>
        <span className="text-xs text-amber-600">Preview before sharing</span>
      </div>

      <div className="p-5">
        {videoUrl ? (
          <div className="relative mx-auto rounded-xl overflow-hidden bg-black mb-4"
            style={{ maxWidth: 240, aspectRatio: '9/16' }}>
            <video src={videoUrl} controls playsInline
              className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-4"
            style={{ maxWidth: 240, aspectRatio: '9/16' }}>
            <span className="text-4xl">🎬</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 mb-4">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Private draft</strong> — only you can see this. Click "Publish to Gallery" to share with guests.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onPublish} disabled={publishing}
            className="w-full py-3 bg-[#14B8A6] text-white font-bold rounded-xl hover:bg-[#0E9488] transition-all disabled:opacity-60 text-sm">
            {publishing ? 'Publishing…' : '🚀 Publish to Event Gallery'}
          </button>
          <div className="flex gap-2">
            {videoUrl && (
              <a href={videoUrl} download={`${eventName}-reel.mp4`}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-center">
                ⬇ Download
              </a>
            )}
            <button onClick={onRegenerate}
              className="flex-1 py-2.5 text-sm font-semibold text-[#0A4F6B] border border-[#0A4F6B]/30 rounded-xl hover:bg-[#0A4F6B]/5 transition-all">
              🔄 Re-generate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Published Reel Card ────────────────────────────────────────────────────
function PublishedReelCard({
  reel, eventName, onNewReel,
}: {
  reel: Reel
  eventName: string
  onNewReel: () => void
}) {
  const videoUrl = reel.output_url || reel.draft_url
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 bg-[#14B8A6]/10 border-b border-[#14B8A6]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6]" />
          <span className="text-xs font-bold text-[#0E9488]">Published to gallery</span>
        </div>
      </div>
      <div className="p-5">
        {videoUrl && (
          <div className="relative mx-auto rounded-xl overflow-hidden bg-black mb-4"
            style={{ maxWidth: 240, aspectRatio: '9/16' }}>
            <video src={videoUrl} controls playsInline className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          {videoUrl && (
            <a href={videoUrl} download={`${eventName}-reel.mp4`}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-center">
              ⬇ Download
            </a>
          )}
          <button onClick={onNewReel}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-[#0A4F6B] rounded-xl hover:bg-[#1E5AAF] transition-all">
            + New reel
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function ReelBuilderPanel({ event, photos, videos = [], profile }: Props) {
  const allMedia = [...photos, ...videos]
  const planType = profile?.plan_type ?? 'free'
  const isUnlimited = profile?.is_unlimited ?? false

  // Only flex/pro/planner/business/corporate can generate reels
  const planSupportsReel = event.plan !== 'free' || ['planner','business','corporate'].includes(planType) || isUnlimited

  // ── Reel state ──
  const [reels, setReels] = useState<Reel[] | null>(null)
  const [loadingReels, setLoadingReels] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // ── Builder state ──
  const [activeTab, setActiveTab] = useState<EditorTab>('themes')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState('fade')
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [musicTrack, setMusicTrack] = useState<string>('afrobeats_upbeat')
  const [textTitle, setTextTitle] = useState('')
  const [textCaption, setTextCaption] = useState('')
  const [textOutro, setTextOutro] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPosition, setLogoPosition] = useState<'throughout' | 'outro'>('outro')
  const [removeWatermark, setRemoveWatermark] = useState(false)
  const [builderStatus, setBuilderStatus] = useState<BuilderStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeLimit, setUpgradeLimit] = useState(1)

  // ── Drag state (timeline) ──
  const dragIndex = useRef<number | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load reels ──
  const loadReels = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/reels`)
      if (!res.ok) return
      const data = await res.json()
      setReels(data.reels ?? [])
    } catch { /* ignore */ }
    finally { setLoadingReels(false) }
  }, [event.id])

  useEffect(() => { loadReels() }, [loadReels])

  const latestReel = reels?.[0] ?? null
  const shouldPoll = latestReel?.status === 'queued' || latestReel?.status === 'processing'

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (shouldPoll) pollRef.current = setInterval(loadReels, 6000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [shouldPoll, loadReels])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('watermark_removed') === '1') setRemoveWatermark(true)
  }, [])

  // Initialise orderedIds when media changes
  useEffect(() => {
    if (orderedIds.length === 0 && allMedia.length > 0) {
      setOrderedIds(allMedia.map(m => m.id))
    }
  }, [allMedia])

  if (!planSupportsReel) return <UpgradeWall />

  // ── Helpers ──
  function applyTheme(themeId: string) {
    const t = THEMES.find(x => x.id === themeId)
    if (!t) return
    setSelectedTheme(themeId)
    setMusicTrack(t.music)
    setSelectedTransition(t.transition)
  }

  function toggleMedia(id: string) {
    setOrderedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ── Drag-and-drop timeline ──
  function onDragStart(i: number) { dragIndex.current = i }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const next = [...orderedIds]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(i, 0, moved)
    dragIndex.current = i
    setOrderedIds(next)
  }
  function onDragEnd() { dragIndex.current = null }

  async function handleWatermarkPurchase() {
    const res = await fetch(`/api/events/${event.id}/addon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonId: 'remove_watermark', priceKobo: 500000 }),
    })
    const data = await res.json()
    if (data.paymentUrl) window.location.href = data.paymentUrl
    else alert(data.error || 'Could not initiate payment.')
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { alert('Logo must be under 3 MB'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null
    const formData = new FormData()
    formData.append('file', logoFile)
    const res = await fetch(`/api/events/${event.id}/upload-logo`, { method: 'POST', body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  }

  async function handleGenerate() {
    const validIds = orderedIds.filter(id => {
      const m = allMedia.find(x => x.id === id)
      return m && (m.original_url || m.display_url)
    })
    if (validIds.length < 3) { alert('Select at least 3 photos or videos.'); return }
    setBuilderStatus('submitting')
    setErrorMsg('')
    try {
      let resolvedLogoUrl = logoUrl
      if (logoFile && !logoUrl) {
        setBuilderStatus('uploading_logo')
        resolvedLogoUrl = await uploadLogo()
        if (resolvedLogoUrl) setLogoUrl(resolvedLogoUrl)
        setBuilderStatus('submitting')
      }

      const textOverlays = (textTitle || textCaption || textOutro)
        ? { title: textTitle || undefined, caption: textCaption || undefined, outro: textOutro || undefined }
        : null

      const res = await fetch(`/api/events/${event.id}/generate-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadIds: validIds,
          musicTrack,
          removeWatermark,
          logoUrl: resolvedLogoUrl,
          theme: selectedTheme,
          transition: selectedTransition,
          textOverlays,
          logoPosition,
        }),
      })

      const data = await res.json()

      if (res.status === 403 && data.error === 'monthly_limit_reached') {
        setBuilderStatus('idle')
        setUpgradeLimit(data.limit ?? 1)
        setShowUpgradeModal(true)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed')
      await loadReels()
      setBuilderStatus('idle')
      setShowBuilder(false)
    } catch (err: any) {
      setBuilderStatus('error')
      setErrorMsg(err?.message || 'Reel generation failed. Please try again.')
    }
  }

  async function handlePublish(reelId: string) {
    setPublishing(true)
    try {
      const res = await fetch(`/api/events/${event.id}/reels/${reelId}/publish`, { method: 'POST' })
      if (res.ok) await loadReels()
      else alert('Could not publish reel. Please try again.')
    } catch { alert('Something went wrong.') }
    finally { setPublishing(false) }
  }

  // ── Loading ──
  if (loadingReels) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-[#0A4F6B]/20 border-t-[#0A4F6B] rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading reels…</span>
      </div>
    )
  }

  // ── Show latest reel (not in builder mode) ──
  if (latestReel && !showBuilder) {
    const isInProgress = latestReel.status === 'queued' || latestReel.status === 'processing'
    const isDraft = latestReel.status === 'complete' && !latestReel.published_to_gallery
    const isPublished = latestReel.status === 'complete' && latestReel.published_to_gallery
    const isFailed = latestReel.status === 'failed'

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h2 className="font-bold text-slate-900">AI Highlight Reel</h2>
          </div>
          <button onClick={() => setShowBuilder(true)}
            className="text-xs font-semibold text-[#0A4F6B] border border-[#0A4F6B]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A4F6B]/5 transition-all">
            + New reel
          </button>
        </div>

        {isInProgress && <ProgressBanner reel={latestReel} />}

        {isDraft && (
          <DraftWorkspace
            reel={latestReel}
            eventName={event.name}
            onPublish={() => handlePublish(latestReel.id)}
            onRegenerate={() => setShowBuilder(true)}
            publishing={publishing}
          />
        )}

        {isPublished && (
          <PublishedReelCard
            reel={latestReel}
            eventName={event.name}
            onNewReel={() => setShowBuilder(true)}
          />
        )}

        {isFailed && (
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <p className="font-semibold text-slate-900 text-sm mb-1">Reel generation failed</p>
            <p className="text-xs text-slate-500 mb-4">An error occurred during cloud rendering.</p>
            <button onClick={() => setShowBuilder(true)}
              className="bg-[#0A4F6B] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm">
              Try again
            </button>
          </div>
        )}

        {reels && reels.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-3">Previous reels</p>
            <div className="space-y-2">
              {reels.slice(1).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 text-sm">
                  <span className="text-slate-600">
                    {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {' · '}{r.upload_ids?.length ?? 0} clips
                    {r.formats?.theme ? ` · ${THEMES.find(t => t.id === r.formats?.theme)?.emoji ?? ''} ${THEMES.find(t => t.id === r.formats?.theme)?.label ?? ''}` : ''}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    r.status === 'complete' && r.published_to_gallery ? 'bg-[#14B8A6]/10 text-[#14B8A6]' :
                    r.status === 'complete' ? 'bg-amber-50 text-amber-600' :
                    r.status === 'failed' ? 'bg-red-50 text-red-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status === 'complete' && r.published_to_gallery ? 'Published' :
                     r.status === 'complete' ? 'Draft' : r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Builder (full editor) ──────────────────────────────────────────────────
  const selectedMedia = orderedIds.map(id => allMedia.find(m => m.id === id)).filter(Boolean) as Upload[]

  return (
    <>
      {showUpgradeModal && (
        <UpgradeModal
          planType={planType}
          limit={upgradeLimit}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <div>
              <h2 className="font-bold text-slate-900">AI Reel Editor</h2>
              <p className="text-xs text-slate-400 mt-0.5">Cloud-rendered · 1080×1920 · TikTok-ready</p>
            </div>
          </div>
          {showBuilder && reels && reels.length > 0 && (
            <button onClick={() => setShowBuilder(false)}
              className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
              ← Back
            </button>
          )}
        </div>

        {/* Editor tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {([
              { id: 'themes',   label: '🎨 Themes'   },
              { id: 'timeline', label: '📋 Timeline'  },
              { id: 'music',    label: '🎵 Music'     },
              { id: 'text',     label: '✏️ Text'      },
              { id: 'branding', label: '🏷 Branding'  },
            ] as { id: EditorTab; label: string }[]).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#0A4F6B] text-[#0A4F6B] bg-[#0A4F6B]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ── THEMES TAB ── */}
            {activeTab === 'themes' && (
              <div>
                <p className="text-xs text-slate-500 mb-4">One-click templates — automatically apply music, transitions, and style presets.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} type="button" onClick={() => applyTheme(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedTheme === t.id
                          ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 ring-1 ring-[#0A4F6B]/20'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${selectedTheme === t.id ? 'text-[#0A4F6B]' : 'text-slate-800'}`}>{t.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400">🎵 {MUSIC_TRACKS.find(m => m.id === t.music)?.label}</span>
                        </div>
                      </div>
                      {selectedTheme === t.id && (
                        <div className="w-5 h-5 rounded-full bg-[#0A4F6B] flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom transition override */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Override transition style</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TRANSITIONS.map(tr => (
                      <button key={tr.id} type="button" onClick={() => setSelectedTransition(tr.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                          selectedTransition === tr.id
                            ? 'border-[#0A4F6B] bg-[#0A4F6B]/5'
                            : 'border-slate-100 hover:border-slate-300'
                        }`}>
                        <span className="text-xl">{tr.emoji}</span>
                        <span className={`text-[11px] font-bold ${selectedTransition === tr.id ? 'text-[#0A4F6B]' : 'text-slate-600'}`}>{tr.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TIMELINE TAB ── */}
            {activeTab === 'timeline' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Media Timeline</p>
                    <p className="text-xs text-slate-400 mt-0.5">Drag to reorder. {selectedMedia.length} clip{selectedMedia.length !== 1 ? 's' : ''} selected · min. 3</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setOrderedIds(allMedia.map(m => m.id))}
                      className="text-xs font-semibold text-[#0A4F6B] px-2.5 py-1 rounded-lg border border-[#0A4F6B]/30 hover:bg-[#0A4F6B]/5 transition-all">All</button>
                    <button onClick={() => setOrderedIds([])}
                      className="text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">None</button>
                  </div>
                </div>

                {allMedia.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 text-sm">No photos or videos yet. Share your QR code to collect media.</p>
                  </div>
                ) : (
                  <>
                    {/* Media picker grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
                      {allMedia.map(m => {
                        const url = m.display_url || m.original_url
                        const isSelected = orderedIds.includes(m.id)
                        const isVideo = m.type === 'video'
                        return (
                          <button key={m.id} type="button" onClick={() => toggleMedia(m.id)}
                            className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                              isSelected ? 'ring-2 ring-[#0A4F6B] ring-offset-1' : 'opacity-50 hover:opacity-80'
                            }`}>
                            {isVideo ? (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                <span className="text-2xl">🎬</span>
                              </div>
                            ) : (
                              <img src={url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
                            )}
                            {isVideo && (
                              <div className="absolute bottom-0.5 right-0.5 bg-black/60 rounded px-1 py-0.5">
                                <span className="text-[9px] text-white font-bold">VID</span>
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#0A4F6B]/20 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-[#0A4F6B] border-2 border-white flex items-center justify-center">
                                  <span className="text-[9px] text-white font-bold">
                                    {orderedIds.indexOf(m.id) + 1}
                                  </span>
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Drag-and-drop ordering strip */}
                    {selectedMedia.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Clip order — drag to rearrange</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedMedia.map((m, i) => {
                            const url = m.display_url || m.original_url
                            const isVideo = m.type === 'video'
                            return (
                              <div key={m.id}
                                draggable
                                onDragStart={() => onDragStart(i)}
                                onDragOver={e => onDragOver(e, i)}
                                onDragEnd={onDragEnd}
                                className="flex-shrink-0 w-14 cursor-grab active:cursor-grabbing relative">
                                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-slate-200 ring-2 ring-[#0A4F6B]/40">
                                  {isVideo ? (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                      <span className="text-base">🎬</span>
                                    </div>
                                  ) : (
                                    <img src={url || ''} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <p className="text-[10px] text-center text-slate-500 mt-1 font-semibold">{i + 1}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {orderedIds.length > 0 && orderedIds.length < 3 && (
                  <p className="text-xs text-[#E8735C] mt-2 font-semibold">Select at least 3 clips.</p>
                )}
              </div>
            )}

            {/* ── MUSIC TAB ── */}
            {activeTab === 'music' && (
              <div>
                <p className="text-xs text-slate-500 mb-4">Choose a soundtrack. Themes auto-select a track — you can override here.</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {MUSIC_TRACKS.map(track => (
                    <button key={track.id} type="button" onClick={() => setMusicTrack(track.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        musicTrack === track.id
                          ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 ring-1 ring-[#0A4F6B]/30'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      <span className="text-lg">{track.emoji}</span>
                      <span className={`text-sm font-semibold ${musicTrack === track.id ? 'text-[#0A4F6B]' : 'text-slate-700'}`}>
                        {track.label}
                      </span>
                      {musicTrack === track.id && (
                        <svg className="w-4 h-4 text-[#0A4F6B] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── TEXT TAB ── */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Add text overlays to your reel. All fields are optional.</p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    🎬 Title Card <span className="text-slate-400 font-normal">(appears at the start)</span>
                  </label>
                  <input
                    type="text"
                    value={textTitle}
                    onChange={e => setTextTitle(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Tunde & Amaka's Wedding Day 💍"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B]/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Large bold text — centred, top half of frame</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    📝 Mid-Reel Caption <span className="text-slate-400 font-normal">(appears in the middle)</span>
                  </label>
                  <input
                    type="text"
                    value={textCaption}
                    onChange={e => setTextCaption(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Captured by GuestVue ✨"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B]/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Semi-transparent background pill — centred</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    🎉 Outro / Call to Action <span className="text-slate-400 font-normal">(appears at the end)</span>
                  </label>
                  <input
                    type="text"
                    value={textOutro}
                    onChange={e => setTextOutro(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Follow us @yourpage for more 🙌"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B]/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Bold outro text — centred, lower portion of frame</p>
                </div>

                {(textTitle || textCaption || textOutro) && (
                  <div className="p-3 rounded-xl bg-[#0A4F6B]/5 border border-[#0A4F6B]/10">
                    <p className="text-xs font-semibold text-[#0A4F6B] mb-1">Text overlay preview</p>
                    {textTitle && <p className="text-xs text-slate-600">Start: <strong>{textTitle}</strong></p>}
                    {textCaption && <p className="text-xs text-slate-600">Middle: <strong>{textCaption}</strong></p>}
                    {textOutro && <p className="text-xs text-slate-600">End: <strong>{textOutro}</strong></p>}
                  </div>
                )}
              </div>
            )}

            {/* ── BRANDING TAB ── */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                {/* Logo upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Your logo (max 3 MB)</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-800/80 text-white text-xs flex items-center justify-center">✕</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => logoInputRef.current?.click()}
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:border-[#0A4F6B] hover:bg-[#0A4F6B]/5 transition-all flex-shrink-0">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                    <div>
                      <p className="text-sm text-slate-600">Brand logo overlay</p>
                      <p className="text-xs text-slate-400">PNG or JPG · max 3 MB</p>
                      {!logoPreview && (
                        <button type="button" onClick={() => logoInputRef.current?.click()}
                          className="mt-1 text-xs font-semibold text-[#0A4F6B] underline">Choose file</button>
                      )}
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} />
                  </div>
                </div>

                {/* Logo position */}
                {logoPreview && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Logo placement</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'outro' as const,      label: 'Outro only',   desc: 'Last 2 seconds, large & centered', emoji: '🎬' },
                        { id: 'throughout' as const,  label: 'Throughout',   desc: 'Small watermark, top-right corner', emoji: '📌' },
                      ].map(opt => (
                        <button key={opt.id} type="button" onClick={() => setLogoPosition(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            logoPosition === opt.id ? 'border-[#0A4F6B] bg-[#0A4F6B]/5' : 'border-slate-100 hover:border-slate-300'
                          }`}>
                          <span className="text-lg mb-1 block">{opt.emoji}</span>
                          <p className={`text-xs font-bold ${logoPosition === opt.id ? 'text-[#0A4F6B]' : 'text-slate-700'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Watermark */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${removeWatermark ? 'bg-[#14B8A6]/5 border-[#14B8A6]/30' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">"Powered by GuestVue" watermark</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {removeWatermark
                        ? 'Watermark removed — reel is clean and unbranded.'
                        : 'Remove for ₦5,000. Free and flex plans always show watermark.'}
                    </p>
                  </div>
                  {removeWatermark ? (
                    <span className="text-xs font-bold text-[#14B8A6] flex items-center gap-1 mt-0.5 flex-shrink-0">✓ Removed</span>
                  ) : (
                    <button type="button" onClick={handleWatermarkPurchase}
                      className="text-xs font-bold text-[#E8735C] border border-[#E8735C]/30 px-3 py-1.5 rounded-lg hover:bg-[#E8735C]/5 transition-all flex-shrink-0">
                      Remove — ₦5,000
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Generate bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">
                {selectedTheme
                  ? `${THEMES.find(t => t.id === selectedTheme)?.emoji ?? ''} ${THEMES.find(t => t.id === selectedTheme)?.label ?? ''}`
                  : 'Custom reel'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {selectedMedia.length} clip{selectedMedia.length !== 1 ? 's' : ''}
                {' · '}{MUSIC_TRACKS.find(t => t.id === musicTrack)?.label ?? 'No music'}
                {textTitle ? ' · Title card' : ''}
                {logoPreview ? ` · Logo (${logoPosition})` : ''}
                {removeWatermark ? ' · No watermark' : ''}
              </p>
            </div>
            <button onClick={handleGenerate}
              disabled={builderStatus === 'submitting' || builderStatus === 'uploading_logo' || selectedMedia.length < 3}
              className="flex-shrink-0 bg-[#0A4F6B] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm flex items-center gap-2 shadow-md">
              {builderStatus === 'uploading_logo' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</>
              ) : builderStatus === 'submitting' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
              ) : (
                <>🎬 Generate Reel</>
              )}
            </button>
          </div>

          {builderStatus === 'error' && (
            <p className="text-xs text-[#E8735C] font-semibold mb-3">{errorMsg}</p>
          )}

          <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cloud-rendered at <strong className="text-slate-700">1080×1920 (9:16)</strong> with Shotstack.
              Takes 5–15 minutes. Your draft appears here — preview before publishing to the gallery.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
