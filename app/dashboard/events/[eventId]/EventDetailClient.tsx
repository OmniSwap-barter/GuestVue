'use client'

import { useState, useEffect, useRef } from 'react'

// ── Locale-independent date formatter (avoids SSR/client hydration mismatch) ──
// toLocaleDateString('en-NG', {...}) formats differently in Node.js vs browsers
// (Node uses "24 Jul 2026 at 06:01", browsers use "24 Jul 2026, 06:01").
function fmtDate(dateStr: string, showTime = false): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const base = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  if (!showTime) return base
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${base}, ${h}:${m}`
}
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import ReelBuilderPanel from './ReelBuilderPanel'

type Event = Database['public']['Tables']['events']['Row']
type Upload = Database['public']['Tables']['uploads']['Row']

interface Props {
  event: Event
  initialUploads: Upload[]
}

type TabId = 'overview' | 'gallery' | 'slideshow' | 'reel' | 'embed' | 'addons' | 'settings'
type MediaFilter = 'all' | 'photos' | 'videos'

export default function EventDetailClient({ event, initialUploads }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
  const [uploads, setUploads] = useState<Upload[]>(initialUploads)
  // Seed from either the DB counter OR the actual length of loaded uploads —
  // whichever is larger — so the tab label is never stale on first render.
  const [uploadCount, setUploadCount] = useState(
    Math.max(event.upload_count ?? 0, initialUploads.length)
  )
  const [copied, setCopied] = useState(false)

  // Gallery selection & filter
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')

  // Slideshow
  const [slideIdx, setSlideIdx] = useState(0)
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // (Reel state lives in ReelBuilderPanel)

  // ─── Realtime sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('dashboard-event-' + event.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'uploads',
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        setUploads(prev => [payload.new as Upload, ...prev])
        setUploadCount(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [event.id])

  const guestUrl = event.gallery_url || `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${event.id}`
  const pct = Math.round((uploadCount / event.upload_limit) * 100)
  const photos = uploads.filter(u => u.type === 'photo')
  const videos = uploads.filter(u => u.type === 'video')

  const planSupportsSlideshow = event.plan === 'flex' || event.plan === 'pro'
  const planSupportsBulkDownload = event.plan === 'flex' || event.plan === 'pro'

  // Filtered uploads for gallery
  const filteredUploads =
    mediaFilter === 'photos' ? photos :
    mediaFilter === 'videos' ? videos :
    uploads

  // ─── Clipboard ───────────────────────────────────────────────────────────
  function copyLink() {
    navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Gallery selection ───────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filteredUploads.map(u => u.id)))
  }

  function deselectAll() {
    setSelected(new Set())
  }

  // ─── Download helpers ────────────────────────────────────────────────────
  function downloadFile(url: string, filename: string) {
    // Route through our proxy so cross-origin R2 files download instead of opening
    const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
    const a = document.createElement('a')
    a.href = proxyUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function downloadSelected() {
    const toDownload = uploads.filter(u => selected.has(u.id))
    toDownload.forEach((u, i) => {
      setTimeout(() => {
        const url = u.display_url || u.original_url
        if (url) downloadFile(url, `${event.name}-${i + 1}.${u.type === 'video' ? 'mp4' : 'jpg'}`)
      }, i * 300)
    })
  }

  async function downloadAll() {
    if (downloadingAll) return
    setDownloadingAll(true)
    setDownloadProgress(null)

    try {
      const res = await fetch(`/api/events/${event.id}/download-zip`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const items = data.urls as { url: string; filename: string; type: string }[]

      setDownloadProgress({ done: 0, total: items.length })

      // Stagger downloads to avoid browser tab/popup blocking
      items.forEach((item, i) => {
        setTimeout(() => {
          const a = document.createElement('a')
          a.href = item.url
          a.download = item.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          setDownloadProgress(prev => prev ? { ...prev, done: i + 1 } : null)
          if (i === items.length - 1) {
            setTimeout(() => {
              setDownloadingAll(false)
              setDownloadProgress(null)
            }, 1000)
          }
        }, i * 400)
      })
    } catch {
      // Fall back to proxy download
      setDownloadProgress({ done: 0, total: uploads.length })
      uploads.forEach((u, i) => {
        setTimeout(() => {
          const url = u.display_url || u.original_url
          const filename = `${event.name}-${String(i + 1).padStart(3, '0')}.${u.type === 'video' ? 'mp4' : 'jpg'}`
          if (url) downloadFile(url, filename)
          setDownloadProgress(prev => prev ? { ...prev, done: i + 1 } : null)
          if (i === uploads.length - 1) {
            setTimeout(() => { setDownloadingAll(false); setDownloadProgress(null) }, 1000)
          }
        }, i * 400)
      })
    }
  }

  // ─── Download All ────────────────────────────────────────────────────────
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ done: number; total: number } | null>(null)

  // ─── Copy states for slideshow + wall links ─────────────────────────────
  const [copiedSlideshow, setCopiedSlideshow] = useState(false)
  const [copiedWall, setCopiedWall] = useState(false)

  // ─── Settings: custom colour ─────────────────────────────────────────────
  const [customColor, setCustomColor] = useState(event.custom_color || '#0A4F6B')
  const [colorSaving, setColorSaving] = useState(false)
  const [colorSaved, setColorSaved] = useState(false)

  async function saveCustomColor() {
    setColorSaving(true)
    try {
      const supabase = createClient()
      await (supabase as any).from('events').update({ custom_color: customColor }).eq('id', event.id)
      setColorSaved(true)
      setTimeout(() => setColorSaved(false), 3000)
    } finally {
      setColorSaving(false)
    }
  }

  // ─── Settings: delete event ──────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteEvent() {
    setDeleting(true)
    try {
      const supabase = createClient()
      await (supabase as any).from('events').delete().eq('id', event.id)
      router.push('/dashboard')
    } catch {
      alert('Delete failed. Please try again.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // ─── Pay Now ─────────────────────────────────────────────────────────────
  const [payingNow, setPayingNow] = useState(false)

  async function handlePayNow() {
    setPayingNow(true)
    try {
      const res = await fetch(`/api/events/${event.id}/pay`, { method: 'POST' })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Could not initiate payment. Please try again.')
        setPayingNow(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setPayingNow(false)
    }
  }

  // ─── Slideshow ───────────────────────────────────────────────────────────
  const slideshowImages = photos.filter(u => u.display_url || u.original_url)

  useEffect(() => {
    if (tab === 'slideshow' && planSupportsSlideshow && slideshowImages.length > 1) {
      slideTimer.current = setInterval(() => {
        setSlideIdx(prev => (prev + 1) % slideshowImages.length)
      }, 3000)
    }
    return () => { if (slideTimer.current) clearInterval(slideTimer.current) }
  }, [tab, slideshowImages.length, planSupportsSlideshow])

  // AI Reel state is now handled by ReelBuilderPanel

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gallery', label: `Gallery (${uploadCount})` },
    { id: 'slideshow', label: 'Slideshow' },
    { id: 'reel', label: 'AI Reel' },
    { id: 'embed', label: 'Photo Wall' },
    { id: 'addons', label: '✦ Add-ons' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div>
      {/* Event header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-1">
          <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
            event.status === 'active' ? 'bg-[#14B8A6] animate-pulse' :
            event.status === 'paused' ? 'bg-[#E8735C]' : 'bg-slate-200'
          }`} />
          <div>
            <h1 className="font-bold text-2xl text-slate-900">{event.name}</h1>
            {event.hashtag && <p className="text-slate-400 text-sm mt-0.5">#{event.hashtag}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
            event.plan === 'pro' ? 'bg-[#0A4F6B]/10 text-[#0A4F6B]' :
            event.plan === 'flex' ? 'bg-[#1E5AAF]/10 text-[#1E5AAF]' :
            'bg-slate-100 text-slate-500'
          }`}>{event.plan}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${
            event.status === 'active' ? 'bg-[#14B8A6]/10 text-[#14B8A6]' :
            event.status === 'paused' ? 'bg-[#E8735C]/10 text-[#E8735C]' :
            'bg-slate-100 text-slate-400'
          }`}>{event.status}</span>
        </div>
      </div>

      {/* Paused warning */}
      {event.status === 'paused' && (
        <div className="bg-[#E8735C]/10 border border-[#E8735C]/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-[#E8735C] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-[#E8735C] text-sm">Payment required to activate</p>
            <p className="text-xs text-slate-500 mt-0.5">Guests can&apos;t upload yet. Complete payment to go live.</p>
          </div>
          <button
            onClick={handlePayNow}
            disabled={payingNow}
            className="bg-[#E8735C] text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex-shrink-0"
          >
            {payingNow ? 'Redirecting…' : 'Pay Now'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* QR card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Your QR Code</h2>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-40 h-40 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                {event.qr_url
                  ? <img src={event.qr_url} alt="QR Code" className="w-36 h-36 object-contain" />
                  : <span className="text-slate-300 text-sm text-center px-3">QR generating…</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-3">Share this link or print the QR. Guests scan to upload — no app needed.</p>
                <div className="flex gap-2 mb-4">
                  <input readOnly value={guestUrl} className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-mono truncate" />
                  <button onClick={copyLink} className="px-4 py-2 bg-[#0A4F6B] text-white text-sm font-bold rounded-xl hover:bg-[#1E5AAF] transition-all flex-shrink-0">
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.qr_url && (
                    <a href={event.qr_url} download={`${event.name}-QR.png`} className="text-sm text-slate-500 hover:text-slate-700 underline">
                      Download QR PNG
                    </a>
                  )}
                  <Link href={`/dashboard/events/${event.id}/qr`}
                    className="text-sm font-semibold text-[#14B8A6] hover:text-[#0d9488]">
                    🎨 Customize QR Card →
                  </Link>
                  <Link href={`/dashboard/events/${event.id}/invitations`}
                    className="text-sm font-semibold text-[#1E5AAF] hover:text-[#1d4ed8]">
                    💌 Design Invitation →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Photos', value: photos.length, icon: '📸' },
              { label: 'Videos', value: videos.length, icon: '🎬' },
              { label: 'Uploads used', value: `${uploadCount}/${event.upload_limit}`, icon: '📊' },
              { label: 'Capacity', value: `${pct}%`, icon: '💾' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="font-bold text-lg text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>Upload capacity</span>
              <span>{uploadCount.toLocaleString()} / {event.upload_limit === 999999 ? '∞' : event.upload_limit.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-[#E8735C]' : 'bg-[#0A4F6B]'}`}
                style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            {pct > 80 && <p className="text-xs text-[#E8735C] mt-2">Running low — consider upgrading to avoid missing memories.</p>}
          </div>

          {/* Expiry */}
          {(event.page_expires_at || event.storage_expires_at) && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">Expiry dates</h3>
              {event.page_expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Guest upload page closes</span>
                  <span className="font-medium text-slate-700">{fmtDate(event.page_expires_at!, true)}</span>
                </div>
              )}
              {event.storage_expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Files deleted after</span>
                  <span className="font-medium text-slate-700">{fmtDate(event.storage_expires_at!)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      {tab === 'gallery' && (
        <div>
          {uploads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="font-bold text-slate-900 mb-1">No uploads yet</h3>
              <p className="text-sm text-slate-400">Share your QR code to start collecting memories.</p>
            </div>
          ) : (
            <>
              {/* Filter + count row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {(['all', 'photos', 'videos'] as MediaFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setMediaFilter(f)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                        mediaFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {f === 'all' ? `All (${uploads.length})` : f === 'photos' ? `Photos (${photos.length})` : `Videos (${videos.length})`}
                    </button>
                  ))}
                </div>

                <div className="flex-1" />

                {/* Select All toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={selected.size === filteredUploads.length && filteredUploads.length > 0}
                    onChange={e => e.target.checked ? selectAll() : deselectAll()}
                    className="w-4 h-4 rounded accent-[#0A4F6B]"
                  />
                  Select all
                </label>

                {/* Download selected */}
                {selected.size > 0 && planSupportsBulkDownload && (
                  <button
                    onClick={downloadSelected}
                    className="text-xs font-bold text-white bg-[#0A4F6B] px-3 py-1.5 rounded-lg hover:bg-[#1E5AAF] transition-all"
                  >
                    Download selected ({selected.size})
                  </button>
                )}

                {/* Download all */}
                {planSupportsBulkDownload ? (
                  <button
                    onClick={downloadAll}
                    disabled={downloadingAll}
                    className="text-xs font-semibold text-[#0A4F6B] border border-[#0A4F6B]/30 px-3 py-1.5 rounded-lg hover:bg-[#0A4F6B]/5 transition-all disabled:opacity-60"
                  >
                    {downloadingAll && downloadProgress
                      ? `Downloading ${downloadProgress.done}/${downloadProgress.total}…`
                      : `Download all (${uploads.length})`}
                  </button>
                ) : (
                  <Link href="/pricing" className="text-xs font-semibold text-[#E8735C] hover:underline">
                    Upgrade for bulk download
                  </Link>
                )}
              </div>

              {/* Free plan upsell */}
              {event.plan === 'free' && (
                <div className="bg-[#0A4F6B]/5 border border-[#0A4F6B]/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-[#0A4F6B] text-sm">Unlock bulk download with Flex — ₦24,999</p>
                    <p className="text-xs text-slate-500 mt-0.5">Download all photos at once and display a live slideshow.</p>
                  </div>
                  <Link href="/pricing" className="bg-[#0A4F6B] text-white text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 flex-shrink-0">
                    Upgrade
                  </Link>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {filteredUploads.map(upload => {
                  const isSelected = selected.has(upload.id)
                  const url = upload.display_url || upload.original_url
                  return (
                    <div
                      key={upload.id}
                      className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group ${
                        isSelected ? 'ring-2 ring-[#0A4F6B] ring-offset-1' : ''
                      }`}
                      onClick={() => toggleSelect(upload.id)}
                    >
                      {upload.type === 'photo' ? (
                        <img src={url || ''} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                          <svg className="w-8 h-8 text-white/60 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white/40 text-xs">Video</span>
                        </div>
                      )}
                      {/* Only show "Processing" overlay when there's no displayable URL yet */}
                      {upload.status === 'processing' && !upload.display_url && !upload.original_url && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">Processing…</span>
                        </div>
                      )}
                      {/* Always show checkbox */}
                      <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#0A4F6B] border-[#0A4F6B]' : 'bg-white/80 border-white opacity-0 group-hover:opacity-100'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SLIDESHOW ────────────────────────────────────────────────────── */}
      {tab === 'slideshow' && (
        <div>
          {!planSupportsSlideshow ? (
            <div className="rounded-2xl p-8 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
              <div className="text-5xl mb-4">🎞</div>
              <h2 className="font-bold text-xl text-white mb-2">Live Slideshow</h2>
              <p className="text-sm text-white/60 mb-5 max-w-sm mx-auto">
                Display an auto-cycling slideshow of guest photos on a screen at your event. Available on Flex and Pro.
              </p>
              <Link href="/pricing" className="inline-block bg-[#14B8A6] text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all text-sm shadow-lg">
                Upgrade to Flex — ₦24,999 →
              </Link>
            </div>
          ) : slideshowImages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-slate-400 text-sm">No photos yet. Share your QR code to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Open projector mode button */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">Projector Mode</h3>
                  <p className="text-sm text-slate-500">Open this on the device connected to your projector or TV for a full-screen live slideshow. New uploads appear automatically in real time.</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => window.open(`/dashboard/events/${event.id}/slideshow`, '_blank', 'noopener noreferrer')}
                    className="inline-flex items-center gap-2 bg-[#0A4F6B] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                    Open Live Slideshow
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/dashboard/events/${event.id}/slideshow`
                      navigator.clipboard.writeText(url)
                      setCopiedSlideshow(true)
                      setTimeout(() => setCopiedSlideshow(false), 2000)
                    }}
                    className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-center"
                  >
                    {copiedSlideshow ? '✓ Copied!' : 'Copy slideshow link'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-black rounded-2xl overflow-hidden aspect-video relative">
                <img
                  key={slideIdx}
                  src={slideshowImages[slideIdx]?.display_url || slideshowImages[slideIdx]?.original_url || ''}
                  alt=""
                  className="w-full h-full object-contain animate-fade"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {slideshowImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {slideIdx + 1} / {slideshowImages.length}
                </div>
                {event.hashtag && (
                  <div className="absolute bottom-10 right-4 bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full">
                    #{event.hashtag}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 text-center">Preview — slides change every 3 seconds. The projector window auto-refreshes with new uploads.</p>
            </div>
          )}
        </div>
      )}

      {/* ── AI REEL ──────────────────────────────────────────────────────── */}
      {tab === 'reel' && (
        <ReelBuilderPanel
          event={{ id: event.id, name: event.name, plan: event.plan }}
          photos={photos}
        />
      )}

      {/* ── PHOTO WALL / EMBED ───────────────────────────────────────────── */}
      {tab === 'embed' && (
        <div className="space-y-4">
          {/* Live photo wall card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#14B8A6]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 mb-1">Live Photo Wall</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A real-time full-screen display of all guest photos — perfect for projecting at your venue or embedding on your website. New uploads appear automatically.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open(`/e/${event.id}/wall`, '_blank', 'noopener noreferrer')}
                className="flex items-center justify-center gap-2 bg-[#14B8A6] text-white font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-all text-sm shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Open Live Photo Wall
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/e/${event.id}/wall`
                  navigator.clipboard.writeText(url)
                  setCopiedWall(true)
                  setTimeout(() => setCopiedWall(false), 2000)
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiedWall ? '✓ Copied!' : 'Copy wall link'}
              </button>
            </div>
          </div>

          {/* Website embed code */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-1">Embed on your website</h3>
            <p className="text-sm text-slate-500 mb-4">
              Paste this code into your website to show a live photo wall that updates in real time as guests upload.
            </p>

            {/* Embed code */}
            <EmbedCodeBlock eventId={event.id} eventName={event.name} />
          </div>

          {/* QR code embed hint */}
          <div className="bg-[#0A4F6B]/5 border border-[#0A4F6B]/15 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-[#0A4F6B] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Tip:</strong> Display the photo wall on a TV or projector, then put the QR code next to it so guests can scan and see their photo appear in real time.
            </p>
          </div>
        </div>
      )}

      {/* ── ADD-ONS ──────────────────────────────────────────────────────── */}
      {tab === 'addons' && (
        <AddOnsPanel event={event} />
      )}

      {/* ── SETTINGS ─────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">Event settings</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Custom accent colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={e => setCustomColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <div>
                  <p className="text-sm text-slate-600 font-mono">{customColor}</p>
                  <p className="text-xs text-slate-400">Shown on the guest upload page</p>
                </div>
                <button
                  onClick={saveCustomColor}
                  disabled={colorSaving}
                  className="ml-auto bg-[#0A4F6B] disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#1E5AAF] transition-all"
                >
                  {colorSaving ? 'Saving…' : colorSaved ? '✓ Saved!' : 'Save colour'}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <h3 className="font-semibold text-red-700 mb-2">Danger zone</h3>
            <p className="text-xs text-red-500 mb-3">Deleting an event permanently removes all uploads, QR codes, and reels. This cannot be undone.</p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-600 font-semibold border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all"
              >
                Delete event
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <p className="text-sm font-semibold text-red-700">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteEvent}
                    disabled={deleting}
                    className="text-sm text-white bg-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-slate-600 border border-slate-200 font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Embed code block sub-component ──────────────────────────────────────────
function EmbedCodeBlock({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://guestvue.com'
  const wallUrl = `${origin}/e/${eventId}/wall`

  const embedCode = `<iframe
  src="${wallUrl}"
  title="${eventName} Live Photo Wall"
  width="100%"
  height="600"
  style="border:none;border-radius:16px;overflow:hidden;"
  allow="autoplay"
></iframe>`

  function copy() {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-300 rounded-xl px-4 py-4 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
        {embedCode}
      </pre>
      <button
        onClick={copy}
        className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          copied
            ? 'bg-[#14B8A6] text-white'
            : 'bg-white/10 text-slate-300 hover:bg-white/20'
        }`}
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ─── Add-ons panel ────────────────────────────────────────────────────────────
function AddOnsPanel({ event }: { event: Event }) {
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const isPro = event.plan === 'pro'
  const isFlex = event.plan === 'flex'
  const isFree = event.plan === 'free'

  const addons = [
    {
      id: 'uploads_100',
      icon: '📸',
      title: '+100 extra uploads',
      desc: 'Add 100 more upload slots to this event. Can be purchased multiple times.',
      price: '₦5,000',
      priceKobo: 500000,
      available: true,
      highlight: false,
      lockedOn: null as string | null,
    },
    {
      id: 'page_extension_7d',
      icon: '📅',
      title: '+7 days page access',
      desc: 'Extend the guest upload page by 7 more days so late-comers can still share.',
      price: '₦3,000',
      priceKobo: 300000,
      available: true,
      highlight: false,
      lockedOn: null as string | null,
    },
    {
      id: 'storage_extension_30d',
      icon: '💾',
      title: '+30 days storage',
      desc: 'Keep all media stored and accessible for an additional 30 days.',
      price: '₦2,000',
      priceKobo: 200000,
      available: true,
      highlight: false,
      lockedOn: null as string | null,
    },
    {
      id: 'ai_reel',
      icon: '🎬',
      title: 'AI Highlight Reel',
      desc: 'Our AI picks the best moments and creates a 60-second shareable video reel.',
      price: '₦10,000',
      priceKobo: 1000000,
      available: !isPro,
      highlight: true,
      lockedOn: isPro ? 'Included with Pro' : null,
    },
    {
      id: 'photo_wall',
      icon: '🖼️',
      title: 'Live Photo Wall',
      desc: 'Real-time full-screen display to project at your venue. Updates as guests upload.',
      price: '₦5,000',
      priceKobo: 500000,
      available: isFree,
      highlight: false,
      lockedOn: (!isFree) ? 'Included with your plan' : null,
    },
    {
      id: 'upgrade_flex',
      icon: '⚡',
      title: 'Upgrade to Flex',
      desc: '500 uploads, AI Basic Reel, Live Photo Wall, and 30-day page. Worth it for any mid-size event.',
      price: '₦24,999',
      priceKobo: 2499900,
      available: isFree,
      highlight: true,
      lockedOn: !isFree ? 'Already on a paid plan' : null,
    },
    {
      id: 'upgrade_pro',
      icon: '🚀',
      title: 'Upgrade to Pro',
      desc: 'Unlimited uploads, AI Pro Reel, 90-day page, and priority support.',
      price: '₦59,999',
      priceKobo: 5999900,
      available: !isPro,
      highlight: true,
      lockedOn: isPro ? 'Already on Pro' : null,
    },
  ]

  async function purchase(addonId: string, priceKobo: number) {
    setPurchasing(addonId)
    try {
      const res = await fetch(`/api/events/${event.id}/addon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonId, priceKobo }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        alert(data.error || 'Could not initiate payment.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-display font-bold text-slate-900 mb-1">Add-ons & Upgrades</h2>
        <p className="text-sm text-slate-500">
          Extend this event with extra capacity, features, or a full plan upgrade. All purchases apply to this event only.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {addons.map(addon => {
          const isLocked = !!addon.lockedOn
          const isBuying = purchasing === addon.id
          return (
            <div key={addon.id} className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all ${addon.highlight ? 'border-[#14B8A6]/40 shadow-md' : 'border-slate-100'} ${isLocked ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{addon.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-slate-900">{addon.title}</p>
                    {addon.highlight && !isLocked && (
                      <span className="text-xs bg-[#14B8A6]/10 text-[#14B8A6] font-bold px-2 py-0.5 rounded-full">Recommended</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{addon.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                <span className="font-display font-black text-base text-slate-900">
                  {isLocked ? addon.lockedOn : addon.price}
                </span>
                {isLocked ? (
                  <span className="text-xs text-[#14B8A6] font-semibold">✓ Active</span>
                ) : (
                  <button
                    onClick={() => purchase(addon.id, addon.priceKobo)}
                    disabled={isBuying || !addon.available}
                    className="text-sm font-bold px-4 py-2 rounded-xl text-white transition-all disabled:opacity-60"
                    style={{ background: addon.highlight ? 'linear-gradient(135deg,#14B8A6,#1E5AAF)' : '#0A4F6B' }}
                  >
                    {isBuying ? 'Loading…' : 'Buy'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">
        All payments processed securely via Paystack. You&apos;ll be redirected to complete payment.
      </p>
    </div>
  )
}
