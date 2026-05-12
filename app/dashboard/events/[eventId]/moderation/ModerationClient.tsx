'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Upload {
  id: string
  original_url: string | null
  display_url: string | null
  type: string
  status: string
  approved: boolean | null
  guest_name: string | null
  created_at: string
  size_bytes: number | null
}

type FilterState = 'all' | 'pending' | 'approved' | 'rejected'

interface Props {
  eventId: string
  eventName: string
  initialUploads: Upload[]
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${months[d.getMonth()]}, ${h}:${m}`
}

function approvalState(u: Upload): FilterState {
  if (u.approved === false) return 'rejected'
  if (u.approved === true) return 'approved'
  return 'pending'
}

export default function ModerationClient({ eventId, eventName, initialUploads }: Props) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads)
  const [filter, setFilter] = useState<FilterState>('all')
  const [loading, set] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [lightbox, setLightbox] = useState<Upload | null>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)

  // ── Realtime — new uploads arrive live ───────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`moderation-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'uploads',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        setUploads(prev => [payload.new as Upload, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'uploads',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        setUploads(prev =>
          prev.map(u => u.id === payload.new.id ? { ...u, ...(payload.new as Upload) } : u)
        )
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  // ── Keyboard: Escape to close lightbox ───────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Approve / reject single upload ───────────────────────────────────────
  const moderate = useCallback(async (uploadId: string, approved: boolean) => {
    set(prev => ({ ...prev, [uploadId]: true }))
    // Optimistic update
    setUploads(prev =>
      prev.map(u => u.id === uploadId ? { ...u, approved } : u)
    )
    try {
      const res = await fetch(
        `/api/events/${eventId}/uploads/${uploadId}/approve`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved }) }
      )
      if (!res.ok) {
        // Revert on failure
        setUploads(prev =>
          prev.map(u => u.id === uploadId ? { ...u, approved: initialUploads.find(i => i.id === uploadId)?.approved ?? null } : u)
        )
      }
    } catch {
      setUploads(prev =>
        prev.map(u => u.id === uploadId ? { ...u, approved: initialUploads.find(i => i.id === uploadId)?.approved ?? null } : u)
      )
    } finally {
      set(prev => ({ ...prev, [uploadId]: false }))
    }
  }, [eventId, initialUploads])

  // ── Bulk moderate ────────────────────────────────────────────────────────
  async function bulkModerate(approved: boolean) {
    if (selected.size === 0) return
    setBulkLoading(true)
    // Optimistic update
    setUploads(prev =>
      prev.map(u => selected.has(u.id) ? { ...u, approved } : u)
    )
    try {
      await Promise.all(
        [...selected].map(id =>
          fetch(`/api/events/${eventId}/uploads/${id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved }),
          })
        )
      )
    } finally {
      setSelected(new Set())
      setBulkLoading(false)
    }
  }

  // ── Derived counts ───────────────────────────────────────────────────────
  const counts = uploads.reduce(
    (acc, u) => {
      const s = approvalState(u)
      acc[s]++
      return acc
    },
    { pending: 0, approved: 0, rejected: 0 } as Record<string, number>
  )

  const filtered = filter === 'all' ? uploads : uploads.filter(u => approvalState(u) === filter)

  // ── Selection helpers ────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function selectAll() { setSelected(new Set(filtered.map(u => u.id))) }
  function clearSelect() { setSelected(new Set()) }

  // ── Filter pills config ──────────────────────────────────────────────────
  const filters: { id: FilterState; label: string; count: number }[] = [
    { id: 'all',      label: 'All',      count: uploads.length },
    { id: 'pending',  label: 'Pending',  count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ]

  return (
    <>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-white font-black text-2xl sm:text-3xl mb-1">
          Photo Moderation
        </h1>
        <p className="text-white/50 text-sm">
          Approve or reject uploads for <span className="text-white/70 font-semibold">{eventName}</span>.
          Only approved photos appear in the guest gallery.
        </p>
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending',  value: counts.pending,  color: '#E8735C' },
          { label: 'Approved', value: counts.approved, color: '#14B8A6' },
          { label: 'Rejected', value: counts.rejected, color: 'rgba(255,255,255,0.2)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border"
            style={{ background: '#0A1628', borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-white font-black text-2xl sm:text-3xl"
              style={{ color: value > 0 ? color : 'rgba(255,255,255,0.3)' }}>
              {value}
            </p>
            <p className="text-white/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter + bulk actions bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filter pills */}
        <div className="flex gap-1.5 bg-white/5 rounded-xl p-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); clearSelect() }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={filter === f.id
                ? { background: '#14B8A6', color: '#fff' }
                : { color: 'rgba(255,255,255,0.5)' }}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">{f.count}</span>
            </button>
          ))}
        </div>

        {/* Bulk controls — appear when items are selected */}
        {selected.size > 0 ? (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/50 text-sm">{selected.size} selected</span>
            <button
              onClick={() => bulkModerate(true)}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: '#14B8A6' }}
            >
              ✓ Approve all
            </button>
            <button
              onClick={() => bulkModerate(false)}
              disabled={bulkLoading}
              className="px-3 py-1.5 rounded-xl text-sm font-bold text-white/80 border border-white/20 hover:border-white/40 transition-all disabled:opacity-60"
            >
              ✗ Reject all
            </button>
            <button onClick={clearSelect} className="text-white/40 hover:text-white/70 transition-colors text-sm">
              Cancel
            </button>
          </div>
        ) : filtered.length > 0 && (
          <button
            onClick={selectAll}
            className="ml-auto text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Select all
          </button>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">
            {filter === 'rejected' ? '🚫' : filter === 'approved' ? '✅' : '📭'}
          </div>
          <p className="text-white/40 text-lg font-semibold">
            {filter === 'all' ? 'No uploads yet' :
             filter === 'pending' ? 'Nothing waiting for review' :
             filter === 'approved' ? 'No approved uploads' :
             'No rejected uploads'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="mt-3 text-sm" style={{ color: '#14B8A6' }}>
              View all uploads
            </button>
          )}
        </div>
      ) : (
        <>
          <style>{`
            @media (min-width: 640px) { .mod-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (min-width: 1024px) { .mod-grid { grid-template-columns: repeat(4, 1fr); } }
          `}</style>
          <div className="mod-grid grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {filtered.map(upload => (
              <ModerationCard
                key={upload.id}
                upload={upload}
                isSelected={selected.has(upload.id)}
                isLoading={!!loading[upload.id]}
                onToggleSelect={() => toggleSelect(upload.id)}
                onApprove={() => moderate(upload.id, true)}
                onReject={() => moderate(upload.id, false)}
                onOpenLightbox={() => setLightbox(upload)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(6,13,26,0.95)' }}
          onClick={(e) => { if (e.target === lightboxRef.current) setLightbox(null) }}
        >
          {/* Close + meta */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <div>
              {lightbox.guest_name && (
                <p className="text-white font-semibold text-sm">{lightbox.guest_name}</p>
              )}
              <p className="text-white/40 text-xs">{fmtTime(lightbox.created_at)}</p>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="text-white/50 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Media */}
          <div className="flex-1 flex items-center justify-center min-h-0 px-4">
            {lightbox.type === 'video' ? (
              <video
                src={lightbox.original_url ?? ''}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl"
                style={{ maxHeight: 'calc(100vh - 180px)' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox.display_url ?? lightbox.original_url ?? ''}
                alt={lightbox.guest_name ?? 'Upload'}
                className="max-h-full max-w-full rounded-xl object-contain"
                style={{ maxHeight: 'calc(100vh - 180px)' }}
              />
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-center gap-4 px-4 py-4 flex-shrink-0">
            <ApprovalState state={approvalState(lightbox)} />
            <button
              onClick={() => { moderate(lightbox.id, true); setLightbox(null) }}
              disabled={!!loading[lightbox.id] || lightbox.approved === true}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40"
              style={{ background: '#14B8A6' }}
            >
              <span>✓</span> Approve
            </button>
            <button
              onClick={() => { moderate(lightbox.id, false); setLightbox(null) }}
              disabled={!!loading[lightbox.id] || lightbox.approved === false}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 border border-white/20 text-white/80"
            >
              <span>✗</span> Reject
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ApprovalState({ state }: { state: FilterState }) {
  if (state === 'approved') return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#14B8A6' }}>
      ✓ Approved
    </span>
  )
  if (state === 'rejected') return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-white/20">
      ✗ Rejected
    </span>
  )
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color: '#E8735C', background: 'rgba(232,115,92,0.15)' }}>
      ● Pending
    </span>
  )
}

interface CardProps {
  upload: Upload
  isSelected: boolean
  isLoading: boolean
  onToggleSelect: () => void
  onApprove: () => void
  onReject: () => void
  onOpenLightbox: () => void
}

function ModerationCard({ upload, isSelected, isLoading, onToggleSelect, onApprove, onReject, onOpenLightbox }: CardProps) {
  const state = approvalState(upload)
  const thumb = upload.display_url ?? upload.original_url

  const borderColor =
    state === 'approved' ? 'rgba(20,184,166,0.5)' :
    state === 'rejected' ? 'rgba(255,255,255,0.1)' :
    'rgba(255,255,255,0.08)'

  return (
    <div
      className="rounded-2xl overflow-hidden border relative group"
      style={{ background: '#0A1628', borderColor }}
    >
      {/* Selection checkbox */}
      <button
        onClick={onToggleSelect}
        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? 'border-transparent text-white'
            : 'border-white/40 bg-black/30 text-transparent group-hover:border-white/70'
        }`}
        style={isSelected ? { background: '#14B8A6' } : {}}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Approval state badge */}
      <div className="absolute top-2 right-2 z-10">
        {state === 'approved' && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#14B8A6' }}>✓</span>
        )}
        {state === 'rejected' && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white bg-white/20">✗</span>
        )}
        {state === 'pending' && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ color: '#E8735C', background: 'rgba(232,115,92,0.2)' }}>●</span>
        )}
      </div>

      {/* Video badge */}
      {upload.type === 'video' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-black/60">▶ Video</span>
        </div>
      )}

      {/* Thumbnail — clickable to open lightbox */}
      <button
        onClick={onOpenLightbox}
        className="w-full aspect-square block overflow-hidden bg-white/5 relative"
        disabled={isLoading}
      >
        {thumb ? (
          upload.type === 'video' ? (
            <video
              src={thumb}
              muted
              preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={upload.guest_name ?? 'Upload'}
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(6,13,26,0.6)' }}>
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Card footer */}
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1">
            {upload.guest_name ? (
              <p className="text-white text-xs font-semibold truncate">{upload.guest_name}</p>
            ) : (
              <p className="text-white/30 text-xs italic">Anonymous</p>
            )}
            <p className="text-white/30 text-xs">{fmtTime(upload.created_at)}</p>
          </div>
        </div>

        {/* Approve / Reject buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={onApprove}
            disabled={isLoading || state === 'approved'}
            title="Approve — visible in gallery"
            className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            style={state === 'approved'
              ? { background: '#14B8A6', color: '#fff' }
              : { background: 'rgba(20,184,166,0.15)', color: '#14B8A6' }}
          >
            {isLoading ? '…' : '✓ Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={isLoading || state === 'rejected'}
            title="Reject — hidden from gallery"
            className="flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
            style={state === 'rejected'
              ? { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)' }
              : { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
          >
            {isLoading ? '…' : '✗ Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}
