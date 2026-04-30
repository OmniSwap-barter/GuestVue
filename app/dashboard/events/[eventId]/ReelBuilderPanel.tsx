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
  music_track: string | null
  upload_ids: string[]
  type: string
  created_at: string
  formats?: { remove_watermark?: boolean; logo_url?: string | null }
}

interface Props {
  event: {
    id: string
    name: string
    plan: string
  }
  photos: Upload[]
}

const MUSIC_TRACKS = [
  { id: 'afrobeats_upbeat', label: 'Afrobeats — Upbeat', emoji: '🎵' },
  { id: 'afrobeats_chill', label: 'Afrobeats — Chill', emoji: '🎶' },
  { id: 'amapiano_dance', label: 'Amapiano — Dance', emoji: '🕺' },
  { id: 'highlife_classic', label: 'Highlife — Classic', emoji: '🎷' },
  { id: 'pop_romantic', label: 'Pop — Romantic', emoji: '💕' },
  { id: 'pop_energetic', label: 'Pop — Energetic', emoji: '⚡' },
  { id: 'cinematic', label: 'Cinematic — No Vocals', emoji: '🎬' },
] as const

type BuilderStatus = 'idle' | 'uploading_logo' | 'submitting' | 'error'

// ─── Upgrade wall for free plan ───────────────────────────────────────────────
function UpgradeWall() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Hero */}
      <div className="relative p-8 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-4xl">🎬</span>
          </div>
          <h2 className="font-bold text-2xl text-white mb-2">AI Highlight Reel</h2>
          <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
            Our AI picks your best guest moments and assembles a cinematic short — share-ready for Instagram Reels and TikTok. No editing needed.
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="p-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: '✂️', title: 'Auto-edited', desc: 'AI picks the best frames automatically' },
            { icon: '🎵', title: 'Licensed music', desc: '7 tracks across Afrobeats, Amapiano & more' },
            { icon: '📱', title: 'Share-ready', desc: 'Exported in 9:16 for Reels & TikTok' },
          ].map(f => (
            <div key={f.title} className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pricing"
            className="flex-1 flex items-center justify-center gap-2 bg-[#0A4F6B] text-white font-bold px-5 py-3.5 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm shadow-md text-center">
            Upgrade to Flex — ₦24,999
          </Link>
          <Link href="/pricing"
            className="flex-1 flex items-center justify-center gap-2 text-white font-bold px-5 py-3.5 rounded-xl hover:opacity-90 transition-all text-sm shadow-md text-center"
            style={{ background: 'linear-gradient(135deg, #1E5AAF, #E8735C)' }}>
            Upgrade to Pro — ₦59,999
          </Link>
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">Pro includes unlimited uploads + priority reel processing</p>
      </div>
    </div>
  )
}

// ─── Reel status card (existing reel) ────────────────────────────────────────
function ReelCard({
  reel,
  eventName,
  onNewReel,
}: {
  reel: Reel
  eventName: string
  onNewReel: () => void
}) {
  const trackLabel = MUSIC_TRACKS.find(t => t.id === reel.music_track)?.label ?? reel.music_track ?? 'No music'

  if (reel.status === 'complete' && reel.output_url) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Video player */}
        <div className="bg-black aspect-video relative">
          <video
            src={reel.output_url}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster=""
          />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#14B8A6]/10 text-[#14B8A6] px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ready to share
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(reel.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {reel.upload_ids?.length ?? 0} photos · {trackLabel}
                {reel.type === 'advanced' && ' · Pro quality'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={reel.output_url}
              download={`${eventName}-highlight-reel.mp4`}
              className="flex items-center gap-2 bg-[#0A4F6B] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Reel
            </a>
            <button
              onClick={() => {
                if (reel.output_url) navigator.clipboard.writeText(reel.output_url)
              }}
              className="flex items-center gap-2 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Copy link
            </button>
            <button
              onClick={onNewReel}
              className="flex items-center gap-2 border border-slate-200 text-slate-500 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              Generate new reel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (reel.status === 'queued' || reel.status === 'processing') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Animated banner */}
        <div className="relative overflow-hidden px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
          {/* Animated dots in background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/5 animate-pulse"
                style={{
                  width: `${60 + i * 40}px`,
                  height: `${60 + i * 40}px`,
                  top: `${10 + i * 12}%`,
                  left: `${5 + i * 15}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: '3s',
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <h3 className="font-bold text-white text-lg mb-1">
              {reel.status === 'processing' ? 'Generating your reel…' : 'Your reel is queued'}
            </h3>
            <p className="text-white/70 text-sm">
              {reel.status === 'processing'
                ? 'Our AI is editing your highlight reel right now. This takes 5–15 minutes.'
                : 'Your reel is next in queue. Processing starts shortly.'}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-slate-500">{reel.upload_ids?.length ?? 0} photos · {trackLabel}</span>
            <span className="text-xs text-slate-400">
              Queued {new Date(reel.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Progress bar animation */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{
                width: reel.status === 'processing' ? '65%' : '15%',
                background: 'linear-gradient(90deg, #14B8A6, #1E5AAF)',
                transition: 'width 1s ease',
              }}
            />
          </div>
          <p className="text-xs text-slate-400">
            This page will update automatically when your reel is ready. Come back in 5–15 minutes.
          </p>
        </div>
      </div>
    )
  }

  if (reel.status === 'failed') {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Reel generation failed</p>
            <p className="text-xs text-slate-500 mt-0.5">Something went wrong processing your reel. Please try again.</p>
          </div>
        </div>
        <button
          onClick={onNewReel}
          className="bg-[#0A4F6B] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  return null
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReelBuilderPanel({ event, photos }: Props) {
  const planSupportsReel = event.plan === 'flex' || event.plan === 'pro'

  // Existing reels
  const [reels, setReels] = useState<Reel[] | null>(null)
  const [loadingReels, setLoadingReels] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)

  // Builder state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(photos.map(p => p.id)))
  const [musicTrack, setMusicTrack] = useState<string>('afrobeats_upbeat')
  const [removeWatermark, setRemoveWatermark] = useState(false)
  const [watermarkPurchasing, setWatermarkPurchasing] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [builderStatus, setBuilderStatus] = useState<BuilderStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load reels on mount
  const loadReels = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/reels`)
      if (!res.ok) return
      const data = await res.json()
      setReels(data.reels ?? [])
    } catch {
      setReels([])
    } finally {
      setLoadingReels(false)
    }
  }, [event.id])

  useEffect(() => {
    loadReels()
  }, [loadReels])

  // Poll while latest reel is in-progress
  const latestReel = reels?.[0] ?? null
  const shouldPoll = latestReel && (latestReel.status === 'queued' || latestReel.status === 'processing')

  useEffect(() => {
    if (shouldPoll) {
      pollRef.current = setInterval(loadReels, 8000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [shouldPoll, loadReels])

  // Check URL params (e.g. ?watermark_removed=1 on return from Paystack)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('watermark_removed') === '1') setRemoveWatermark(true)
  }, [])

  // ── Free plan wall ──
  if (!planSupportsReel) return <UpgradeWall />

  // ── Helpers ──
  function togglePhoto(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleWatermarkPurchase() {
    setWatermarkPurchasing(true)
    try {
      const res = await fetch(`/api/events/${event.id}/addon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonId: 'remove_watermark', priceKobo: 500000 }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Could not initiate payment.')
        setWatermarkPurchasing(false)
      }
    } catch {
      alert('Something went wrong.')
      setWatermarkPurchasing(false)
    }
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
    formData.append('type', 'logo')
    const res = await fetch(`/api/events/${event.id}/upload-logo`, { method: 'POST', body: formData })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  }

  async function handleGenerate() {
    if (selectedIds.size < 3) { alert('Select at least 3 photos.'); return }
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
      const res = await fetch(`/api/events/${event.id}/generate-reel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadIds: Array.from(selectedIds),
          musicTrack,
          removeWatermark,
          logoUrl: resolvedLogoUrl,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      await loadReels()
      setBuilderStatus('idle')
      setShowBuilder(false)
    } catch {
      setBuilderStatus('error')
      setErrorMsg('Reel generation failed. Please try again.')
    }
  }

  // ── Loading state ──
  if (loadingReels) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-[#0A4F6B]/20 border-t-[#0A4F6B] rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading reels…</span>
      </div>
    )
  }

  // ── Show existing reel (not in builder mode) ──
  if (latestReel && !showBuilder) {
    return (
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h2 className="font-bold text-slate-900">AI Highlight Reel</h2>
          </div>
          {latestReel.status === 'complete' && (
            <button
              onClick={() => setShowBuilder(true)}
              className="text-xs font-semibold text-[#0A4F6B] border border-[#0A4F6B]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A4F6B]/5 transition-all"
            >
              + New reel
            </button>
          )}
        </div>
        <ReelCard
          reel={latestReel}
          eventName={event.name}
          onNewReel={() => setShowBuilder(true)}
        />
        {/* Past reels (collapsed) */}
        {reels && reels.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-3">Previous reels</p>
            <div className="space-y-2">
              {reels.slice(1).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 text-sm">
                  <span className="text-slate-600">
                    {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {r.upload_ids?.length ?? 0} photos
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    r.status === 'complete' ? 'bg-[#14B8A6]/10 text-[#14B8A6]' :
                    r.status === 'failed' ? 'bg-red-50 text-red-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── No reels yet + builder ──
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <div>
            <h2 className="font-bold text-slate-900">AI Highlight Reel Builder</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pick your photos, music, and branding — then generate.</p>
          </div>
        </div>
        {showBuilder && reels && reels.length > 0 && (
          <button
            onClick={() => setShowBuilder(false)}
            className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
          >
            ← Back
          </button>
        )}
      </div>

      {/* ── Step 1: Photo selection ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Step 1 — Select photos</h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedIds.size} of {photos.length} selected · min. 3</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set(photos.map(p => p.id)))}
              className="text-xs font-semibold text-[#0A4F6B] px-2.5 py-1 rounded-lg border border-[#0A4F6B]/30 hover:bg-[#0A4F6B]/5 transition-all">
              All
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">
              None
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">No photos yet. Share your QR code to collect memories first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {photos.map(photo => {
              const url = photo.display_url || photo.original_url
              const isSelected = selectedIds.has(photo.id)
              return (
                <button key={photo.id} type="button" onClick={() => togglePhoto(photo.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden group transition-all ${
                    isSelected ? 'ring-2 ring-[#0A4F6B] ring-offset-1' : 'opacity-50 hover:opacity-80'
                  }`}>
                  <img src={url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#0A4F6B]/20 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#0A4F6B] border-2 border-white flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {selectedIds.size > 0 && selectedIds.size < 3 && (
          <p className="text-xs text-[#E8735C] mt-3 font-semibold">Select at least 3 photos to generate a reel.</p>
        )}
      </div>

      {/* ── Step 2: Music ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Step 2 — Choose music</h3>
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

      {/* ── Step 3: Branding ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Step 3 — Branding (optional)</h3>
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Your logo or watermark</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-800/80 text-white text-xs flex items-center justify-center hover:bg-slate-900 transition-all">
                    ✕
                  </button>
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
                <p className="text-sm text-slate-600">Upload your brand logo</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG or JPG, max 3 MB. Appears in the corner of your reel.</p>
                {!logoPreview && (
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-[#0A4F6B] underline">Choose file</button>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} />
            </div>
          </div>

          {/* GuestVue watermark */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${removeWatermark ? 'bg-[#14B8A6]/5 border-[#14B8A6]/30' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">&ldquo;Powered by GuestVue&rdquo; watermark</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {removeWatermark
                  ? 'Watermark removal is active. Your reel will be clean and unbranded.'
                  : 'A small GuestVue credit appears on the reel. Remove it for ₦5,000.'}
              </p>
            </div>
            {removeWatermark ? (
              <span className="flex-shrink-0 text-xs font-bold text-[#14B8A6] flex items-center gap-1 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Removed
              </span>
            ) : (
              <button type="button" onClick={handleWatermarkPurchase} disabled={watermarkPurchasing}
                className="flex-shrink-0 text-xs font-bold text-[#E8735C] border border-[#E8735C]/30 px-3 py-1.5 rounded-lg hover:bg-[#E8735C]/5 transition-all disabled:opacity-60 disabled:cursor-wait">
                {watermarkPurchasing ? 'Redirecting…' : 'Remove — ₦5,000'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Generate ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-bold text-slate-900 text-sm">Ready to generate</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} ·{' '}
              {MUSIC_TRACKS.find(t => t.id === musicTrack)?.label ?? 'No music'}
              {logoPreview ? ' · Custom logo' : ''}
              {removeWatermark ? ' · No watermark' : ''}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={builderStatus === 'submitting' || builderStatus === 'uploading_logo' || selectedIds.size < 3}
            className="flex-shrink-0 bg-[#0A4F6B] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm flex items-center gap-2 shadow-md"
          >
            {builderStatus === 'uploading_logo' ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading logo…</>
            ) : builderStatus === 'submitting' ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
            ) : (
              <>🎬 Generate AI Reel</>
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
            Processing takes <strong className="text-slate-700">5–15 minutes</strong>. Your reel will appear here when ready — no need to stay on this page.
            Formatted for <strong className="text-slate-700">Instagram Reels (9:16)</strong> and TikTok.
          </p>
        </div>
      </div>
    </div>
  )
}
