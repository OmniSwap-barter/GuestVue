'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Upload {
  id: string
  original_url: string | null
  display_url: string | null
  type: string
  status: string
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

type ReelStatus = 'idle' | 'uploading_logo' | 'generating' | 'queued' | 'error'

export default function ReelBuilderPanel({ event, photos }: Props) {
  const planSupportsReel = event.plan === 'pro'

  // Media selection (default: all photos selected)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(photos.map(p => p.id)))
  const [musicTrack, setMusicTrack] = useState<string>('afrobeats_upbeat')
  const [removeWatermark] = useState(false)  // paid toggle — disabled until payment
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<ReelStatus>('idle')
  const [reelId, setReelId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const logoInputRef = useRef<HTMLInputElement>(null)

  if (!planSupportsReel) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="font-bold text-xl text-slate-900 mb-2">AI Highlight Reel</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
          Automatically generate a cinematic short video from your event photos — ready for Instagram Reels or TikTok.
        </p>
        <div className="rounded-2xl p-6 mb-5 max-w-sm mx-auto text-white" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
          <p className="text-lg font-bold mb-2">Upgrade to Pro</p>
          <p className="text-sm text-white/80 mb-1">Get an AI-generated highlight reel from your guest photos.</p>
          <p className="text-xs text-white/60">Share-ready for Instagram Reels and TikTok.</p>
        </div>
        <Link href="/pricing" className="inline-block bg-[#0A4F6B] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm">
          Upgrade to Pro — ₦49,999 →
        </Link>
      </div>
    )
  }

  function togglePhoto(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() { setSelectedIds(new Set(photos.map(p => p.id))) }
  function deselectAll() { setSelectedIds(new Set()) }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2 MB')
      return
    }
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
    const res = await fetch(`/api/events/${event.id}/upload-logo`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  }

  async function handleGenerate() {
    if (selectedIds.size < 3) {
      alert('Select at least 3 photos to generate a reel.')
      return
    }

    setStatus('generating')
    setErrorMsg('')

    try {
      // Upload logo first if provided
      let resolvedLogoUrl = logoUrl
      if (logoFile && !logoUrl) {
        setStatus('uploading_logo')
        resolvedLogoUrl = await uploadLogo()
        if (resolvedLogoUrl) setLogoUrl(resolvedLogoUrl)
      }

      setStatus('generating')

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

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setReelId(data.reel?.id ?? null)
      setStatus('queued')
    } catch {
      setStatus('error')
      setErrorMsg('Reel generation failed. Please try again.')
    }
  }

  if (status === 'queued') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <div className="text-5xl mb-4">🎬✅</div>
        <h3 className="font-bold text-slate-900 text-xl mb-2">Your reel is in the queue!</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-2">
          We&apos;re assembling your highlight reel with {selectedIds.size} photos and your chosen music.
          This usually takes 5–15 minutes.
        </p>
        <p className="text-xs text-slate-400 mb-6">Come back to this tab to download once it&apos;s ready.</p>
        <button
          onClick={() => setStatus('idle')}
          className="text-sm text-[#0A4F6B] underline"
        >
          Generate another reel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🎬</span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900">AI Highlight Reel Builder</h2>
            <p className="text-xs text-slate-400">Pick your photos, music, and branding — then generate.</p>
          </div>
        </div>
      </div>

      {/* ── Step 1: Photo selection ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Step 1 — Select photos</h3>
            <p className="text-xs text-slate-400 mt-0.5">{selectedIds.size} of {photos.length} selected</p>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs font-semibold text-[#0A4F6B] px-2.5 py-1 rounded-lg border border-[#0A4F6B]/30 hover:bg-[#0A4F6B]/5 transition-all">
              All
            </button>
            <button onClick={deselectAll} className="text-xs font-semibold text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">
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
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => togglePhoto(photo.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden group transition-all ${
                    isSelected ? 'ring-2 ring-[#0A4F6B] ring-offset-1' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[#0A4F6B]/20' : 'bg-transparent'
                  }`}>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#0A4F6B] border-2 border-white flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedIds.size > 0 && selectedIds.size < 3 && (
          <p className="text-xs text-[#E8735C] mt-3 font-semibold">Select at least 3 photos to generate a reel.</p>
        )}
      </div>

      {/* ── Step 2: Music ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Step 2 — Choose music</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {MUSIC_TRACKS.map(track => (
            <button
              key={track.id}
              type="button"
              onClick={() => setMusicTrack(track.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                musicTrack === track.id
                  ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 ring-1 ring-[#0A4F6B]/30'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
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

      {/* ── Step 3: Branding ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Step 3 — Branding (optional)</h3>

        <div className="space-y-4">
          {/* Logo upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Your logo or watermark</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(null); if (logoInputRef.current) logoInputRef.current.value = '' }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-slate-800/80 text-white text-xs flex items-center justify-center hover:bg-slate-900 transition-all"
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 hover:border-[#0A4F6B] hover:bg-[#0A4F6B]/5 transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <div>
                <p className="text-sm text-slate-600">Upload your brand logo</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG or JPG, max 2 MB. Will appear in the corner of your reel.</p>
                {!logoPreview && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-[#0A4F6B] underline"
                  >
                    Choose file
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* GuestVue watermark toggle */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">
                &ldquo;Powered by GuestVue&rdquo; watermark
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                A small GuestVue credit appears on the reel. Remove it by purchasing the watermark removal add-on.
              </p>
            </div>
            <Link
              href={`/dashboard/events/${event.id}?tab=addons`}
              className="flex-shrink-0 text-xs font-bold text-[#E8735C] border border-[#E8735C]/30 px-3 py-1.5 rounded-lg hover:bg-[#E8735C]/5 transition-all"
            >
              Remove — ₦5,000
            </Link>
          </div>
        </div>
      </div>

      {/* ── Generate ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900 text-sm">Ready to generate</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} · {MUSIC_TRACKS.find(t => t.id === musicTrack)?.label ?? 'No music'}
              {logoPreview ? ' · Custom logo' : ''}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={status === 'generating' || status === 'uploading_logo' || selectedIds.size < 3}
            className="flex-shrink-0 bg-[#0A4F6B] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm flex items-center gap-2"
          >
            {status === 'uploading_logo' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading logo…
              </>
            ) : status === 'generating' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating reel…
              </>
            ) : (
              <>🎬 Generate AI Reel</>
            )}
          </button>
        </div>

        {status === 'error' && (
          <p className="text-xs text-[#E8735C] font-semibold mt-3">{errorMsg}</p>
        )}

        <p className="text-xs text-slate-400 mt-3">
          Processing takes 5–15 minutes. You&apos;ll be able to download your reel from this page once it&apos;s ready.
          The reel is formatted for Instagram Reels (9:16) and TikTok.
        </p>
      </div>
    </div>
  )
}
