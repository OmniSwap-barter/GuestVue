'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

interface Upload {
  id: string
  original_url: string
  display_url: string | null
  type: string
  created_at: string
  guest_name?: string | null
}

interface EventInfo {
  id: string
  name: string
  hashtag: string | null
  custom_color: string | null
  custom_logo: string | null
  status: string
  upload_count: number
}

interface Props {
  event: EventInfo
  reelUrl: string | null
  initialUploads: Upload[]
}

// ── Fire-and-forget analytics tracker ────────────────────────────────────────
function trackMetric(eventId: string, metric: string) {
  fetch(`/api/events/${eventId}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric }),
  }).catch(() => { /* non-fatal */ })
}

// WhatsApp SVG icon — extracted to avoid repetition
function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function GalleryView({ event, reelUrl, initialUploads }: Props) {
  const brand = event.custom_color || '#14B8A6'

  const [search, setSearch]         = useState('')
  const [savedName, setSavedName]   = useState('')
  const [lightbox, setLightbox]     = useState<number | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError]     = useState('')
  const [reelError, setReelError]   = useState(false)
  // FIX: capture page URL client-side so WhatsApp href always has the real URL
  const [pageUrl, setPageUrl]       = useState('')

  const videoRef  = useRef<HTMLVideoElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Client-side name filter — case-insensitive substring match on guest_name
  const searchTerm = search.trim()
  const filtered = searchTerm
    ? initialUploads.filter(u =>
        u.guest_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : initialUploads
  const all = filtered

  // Unique contributor names for quick-tap chips (max 8, alphabetical)
  const contributors = Array.from(
    new Set(initialUploads.map(u => u.guest_name).filter(Boolean) as string[])
  ).sort().slice(0, 8)

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Capture real page URL now that we're on the client
    setPageUrl(window.location.href)

    trackMetric(event.id, 'gallery_view')

    // 1. URL param takes precedence (?name=Amaka)
    const urlName = new URLSearchParams(window.location.search).get('name') ?? ''
    // 2. Fall back to the name they typed when uploading this session
    let storedName = ''
    try { storedName = sessionStorage.getItem(`gv_name_${event.id}`) ?? '' } catch {}

    const resolved = urlName || storedName
    setSavedName(resolved)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close lightbox on Escape / arrow keys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight' && lightbox !== null)
        setLightbox(i => i === null ? null : Math.min(i + 1, all.length - 1))
      if (e.key === 'ArrowLeft' && lightbox !== null)
        setLightbox(i => i === null ? null : Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, all.length])

  // Individual file download — Supabase cross-origin requires ?download= param
  const downloadFile = useCallback((url: string, filename: string) => {
    const sep = url.includes('?') ? '&' : '?'
    const a = document.createElement('a')
    a.href = `${url}${sep}download=${encodeURIComponent(filename)}`
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // ZIP download all
  async function downloadZip() {
    setZipLoading(true)
    setZipError('')
    try {
      const res = await fetch(`/api/events/${event.id}/download-zip`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Download failed')
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_photos.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setZipError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setZipLoading(false)
    }
  }

  // FIX: WhatsApp share — use onClick so URL is always computed on the client
  function openWhatsAppShare(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const galleryShareText = `📸 Check out the photos from ${event.name}! View and download here: ${pageUrl || window.location.href}`
  const myPhotosShareText = (name: string) =>
    `📸 Here are my photos from ${event.name}: ${window.location.origin}/e/${event.id}?name=${encodeURIComponent(name)}`

  const isVideo = (u: Upload) =>
    u.type === 'video' || /\.(mp4|mov|webm)$/i.test(u.original_url ?? '')

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#060D1A' }}>

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30" style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {event.custom_logo ? (
              <img src={event.custom_logo} alt={event.name}
                className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${brand}30` }}>
                <svg className="w-4 h-4" fill="none" stroke={brand} strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-black text-white text-sm truncate leading-tight">{event.name}</p>
              {event.hashtag && (
                <p className="text-xs truncate" style={{ color: brand }}>#{event.hashtag}</p>
              )}
            </div>
          </div>

          <Link href={`/e/${event.id}/upload`}
            className="flex-shrink-0 flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
            style={{ backgroundColor: brand }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add photos
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Reel hero ───────────────────────────────────────────────────── */}
        {reelUrl && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: brand }}>
                ✦ Highlight Reel
              </span>
            </div>

            {/* FIX: reel video with proper onError fallback */}
            {!reelError ? (
              <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black"
                style={{ maxWidth: 320, aspectRatio: '9/16' }}>
                <video
                  ref={videoRef}
                  src={reelUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                  onPlay={() => trackMetric(event.id, 'reel_play')}
                  onError={() => setReelError(true)}
                />
                {/* Unmute toggle */}
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted }}
                  className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-all"
                  title="Toggle sound"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Reel failed to load inline — show open-in-tab fallback */
              <div className="mx-auto rounded-2xl flex flex-col items-center justify-center gap-4 p-8 text-center"
                style={{ maxWidth: 320, background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-5xl">🎬</span>
                <div>
                  <p className="text-white font-bold mb-1">Your highlight reel is ready!</p>
                  <p className="text-white/50 text-xs">Tap below to watch it.</p>
                </div>
                <a href={reelUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
                  ▶ Watch Reel
                </a>
              </div>
            )}
          </section>
        )}

        {/* ── Stats + controls ────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">{initialUploads.length}</span>
            <span className="text-sm text-white/50 font-medium">memories shared</span>
          </div>

          {/* Controls row — wraps cleanly on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Find my photos search */}
            <div className="relative flex-1 min-w-[160px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find my photos…"
                className="w-full pl-9 pr-8 py-2 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  '--tw-ring-color': `${brand}60`,
                } as React.CSSProperties}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-0.5 rounded"
                  title="Clear search">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* ZIP download */}
            <button
              onClick={downloadZip}
              disabled={zipLoading || initialUploads.length === 0}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {zipLoading ? (
                <svg className="w-4 h-4 animate-spin text-white/60" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span className="text-white/80">{zipLoading ? 'Preparing…' : 'Download all'}</span>
            </button>

            {/* FIX: WhatsApp share — uses onClick so URL is always client-evaluated */}
            <button
              onClick={() => openWhatsAppShare(galleryShareText)}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-xl text-white transition-all hover:opacity-90 active:scale-95 flex-shrink-0"
              style={{ background: '#25D366' }}
              title="Share gallery on WhatsApp"
            >
              <WhatsAppIcon size={16} />
              Share
            </button>
          </div>
        </section>

        {zipError && (
          <p className="text-sm text-red-400 rounded-xl px-4 py-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {zipError}
          </p>
        )}

        {/* ── Welcome-back banner ─────────────────────────────────────────── */}
        {savedName && !searchTerm && (() => {
          const myCount = initialUploads.filter(u =>
            u.guest_name?.toLowerCase() === savedName.toLowerCase()
          ).length
          return (
            <div
              className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: `${brand}15`, border: `1px solid ${brand}40` }}
            >
              <div className="flex-1 min-w-0">
                {/* FIX: was text-slate-800 (invisible on dark bg) */}
                <p className="font-bold text-white">👋 Welcome back, {savedName}!</p>
                <p className="text-sm text-white/60 mt-0.5">
                  {myCount > 0
                    ? `You have ${myCount} photo${myCount !== 1 ? 's' : ''} tagged to your name.`
                    : 'Your uploads may still be processing — check back in a moment.'}
                </p>
              </div>
              <button
                onClick={() => { setSearch(savedName); setTimeout(() => searchRef.current?.focus(), 50) }}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: brand }}
              >
                {myCount > 0 ? `View my ${myCount} photo${myCount !== 1 ? 's' : ''}` : 'Search my name'}
              </button>
            </div>
          )
        })()}

        {/* ── Contributor chips ───────────────────────────────────────────── */}
        {!searchTerm && contributors.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            {/* FIX: was text-slate-400 — now white/40 for dark bg */}
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">Filter by:</span>
            {contributors.map(name => (
              <button
                key={name}
                onClick={() => setSearch(name)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: `${brand}50`,
                  color: brand,
                  background: `${brand}12`,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* ── Active filter result banner ──────────────────────────────────── */}
        {searchTerm && (
          <div
            className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: `${brand}12`, border: `1px solid ${brand}35` }}
          >
            <div className="flex-1 min-w-0">
              {filtered.length > 0 ? (
                <>
                  {/* FIX: was text-slate-800 — now text-white for dark bg */}
                  <p className="font-bold text-white">
                    📸 {filtered.length} photo{filtered.length !== 1 ? 's' : ''} for &ldquo;{searchTerm}&rdquo;
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">Tap any photo to view full-size or download.</p>
                </>
              ) : (
                <>
                  {/* FIX: was text-slate-700 */}
                  <p className="font-bold text-white">
                    No photos found for &ldquo;{searchTerm}&rdquo;
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Try a different spelling, or check back soon if you just uploaded.
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {filtered.length > 0 && (
                /* FIX: WhatsApp uses onClick, not href, so URL is always set */
                <button
                  onClick={() => openWhatsAppShare(myPhotosShareText(searchTerm))}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white active:scale-95"
                  style={{ background: '#25D366' }}
                  title="Share your photos on WhatsApp"
                >
                  <WhatsAppIcon size={13} />
                  Share mine
                </button>
              )}
              {/* FIX: was bg-white text-slate-600 (light button on dark page) */}
              <button
                onClick={() => setSearch('')}
                className="text-xs font-semibold px-3 py-2 rounded-xl text-white/80 transition-all hover:text-white"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                View all photos
              </button>
            </div>
          </div>
        )}

        {/* ── Masonry grid ─────────────────────────────────────────────────── */}
        {all.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">{searchTerm ? '🔍' : '📷'}</div>
            <p className="font-bold text-white text-lg mb-1">
              {searchTerm ? `No photos for "${searchTerm}"` : 'No photos yet'}
            </p>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              {searchTerm
                ? 'Check the spelling, or your photos may still be processing — check back in a moment.'
                : 'Be the first to share a memory from this event!'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearch('')}
                className="inline-block mt-5 font-bold px-6 py-3 rounded-xl text-sm text-white/70 transition-all active:scale-95"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
              >
                ← Show all photos
              </button>
            ) : (
              <Link href={`/e/${event.id}/upload`}
                className="inline-block mt-6 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all active:scale-95"
                style={{ backgroundColor: brand }}>
                Share your photos →
              </Link>
            )}
          </div>
        ) : (
          <>
            <style>{`
              .masonry-grid { column-count: 2; column-gap: 0.75rem; }
              @media (min-width: 640px)  { .masonry-grid { column-count: 3; } }
              @media (min-width: 1024px) { .masonry-grid { column-count: 4; } }
            `}</style>
            <div className="masonry-grid">
              {all.map((item, idx) => (
                <MasonryCard
                  key={item.id}
                  item={item}
                  brand={brand}
                  index={idx}
                  onClick={() => setLightbox(idx)}
                  onDownload={() => downloadFile(
                    item.original_url,
                    `guestvue_${event.name.replace(/[^a-z0-9]/gi, '_')}_${item.id.slice(0, 8)}.${isVideo(item) ? 'mp4' : 'jpg'}`
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Upload CTA strip ─────────────────────────────────────────────── */}
        {all.length > 0 && (
          <div className="rounded-2xl p-6 text-center text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #E8735C 0%, #14B8A6 100%)' }}>
            <p className="font-black text-xl mb-1">Were you there?</p>
            <p className="text-white/80 text-sm mb-4">Add your photos and videos to the gallery.</p>
            <Link href={`/e/${event.id}/upload`}
              className="inline-block bg-white font-bold text-sm px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95"
              style={{ color: '#14B8A6' }}>
              Share your memories →
            </Link>
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-6 text-center mt-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs text-white/30">
          Powered by{' '}
          <a href="https://theguestvue.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-white/60 transition-colors">
            GuestVue
          </a>
        </p>
      </footer>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox !== null && all[lightbox] && (
        <Lightbox
          item={all[lightbox]}
          index={lightbox}
          total={all.length}
          brand={brand}
          eventName={event.name}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(i => i === null ? null : Math.max(i - 1, 0))}
          onNext={() => setLightbox(i => i === null ? null : Math.min(i + 1, all.length - 1))}
          onDownload={() => downloadFile(
            all[lightbox].original_url,
            `guestvue_${event.name.replace(/[^a-z0-9]/gi, '_')}_${all[lightbox].id.slice(0, 8)}.${isVideo(all[lightbox]) ? 'mp4' : 'jpg'}`
          )}
        />
      )}
    </div>
  )
}

// ─── Masonry card ─────────────────────────────────────────────────────────────

function MasonryCard({
  item, brand, index, onClick, onDownload,
}: {
  item: Upload
  brand: string
  index: number
  onClick: () => void
  onDownload: () => void
}) {
  const [touched, setTouched] = useState(false)
  const vid = item.type === 'video' || /\.(mp4|mov|webm)$/i.test(item.original_url ?? '')
  const src = item.display_url || item.original_url

  return (
    <div
      className="relative mb-3 rounded-xl overflow-hidden cursor-pointer"
      // FIX: was bg-slate-100 (white placeholder showing blank white cards on dark bg)
      style={{ breakInside: 'avoid', background: '#0A1628' }}
      onMouseEnter={() => setTouched(true)}
      onMouseLeave={() => setTouched(false)}
      onTouchStart={() => setTouched(true)}
      onTouchEnd={() => setTimeout(() => setTouched(false), 800)}
      onClick={onClick}
    >
      {vid ? (
        <div className="relative aspect-square overflow-hidden" style={{ background: '#0D1B2A' }}>
          <video
            src={src ?? ''}
            playsInline
            muted
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(4px)' }}>
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            VIDEO
          </span>
        </div>
      ) : (
        <img
          src={src ?? ''}
          alt={item.guest_name ? `Photo by ${item.guest_name}` : 'Event photo'}
          className="w-full h-auto block"
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Overlay — visible on hover (desktop) or touch (mobile) */}
      <div
        className={`absolute inset-0 flex flex-col justify-end p-2 transition-opacity duration-200 ${touched ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }}
      >
        {item.guest_name && (
          <p className="text-white text-[11px] font-semibold mb-1 truncate">{item.guest_name}</p>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDownload() }}
          className="self-end bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-lg p-1.5 transition-all"
          title="Download"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  item, index, total, brand, eventName, onClose, onPrev, onNext, onDownload,
}: {
  item: Upload
  index: number
  total: number
  brand: string
  eventName: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onDownload: () => void
}) {
  const vid = item.type === 'video' || /\.(mp4|mov|webm)$/i.test(item.original_url ?? '')
  const src = item.original_url

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {index > 0 && (
        <button onClick={e => { e.stopPropagation(); onPrev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next */}
      {index < total - 1 && (
        <button onClick={e => { e.stopPropagation(); onNext() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Media — constrained so it never bleeds off screen on mobile */}
      <div
        className="w-full max-w-2xl px-14 flex items-center justify-center"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {vid ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="max-h-[80vh] max-w-full w-full rounded-xl"
          />
        ) : (
          <img
            src={src}
            alt={item.guest_name ? `Photo by ${item.guest_name}` : 'Event photo'}
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-gradient-to-t from-black/70 to-transparent">
        <div>
          {item.guest_name && (
            <p className="text-white text-sm font-semibold">{item.guest_name}</p>
          )}
          <p className="text-white/40 text-xs">{index + 1} / {total}</p>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
          style={{ backgroundColor: brand }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}
