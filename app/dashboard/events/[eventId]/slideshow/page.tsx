'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

export default function SlideshowPage() {
  const { eventId } = useParams() as { eventId: string }
  const router = useRouter()
  const [uploads, setUploads] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [event, setEvent] = useState<any>(null)
  const [paused, setPaused] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Load event + uploads
    async function load() {
      const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single()
      setEvent(ev)
      const { data: ups } = await supabase.from('uploads').select('*').eq('event_id', eventId).in('status', ['ready', 'processing']).order('created_at', { ascending: false })
      setUploads(ups ?? [])
    }
    load()

    // Realtime subscription
    const channel = supabase.channel('slideshow-' + eventId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'uploads', filter: `event_id=eq.${eventId}` },
        (payload) => { setUploads(prev => [payload.new as any, ...prev]) }
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  useEffect(() => {
    if (paused || uploads.length === 0) return
    const t = setInterval(() => setCurrent(c => (c + 1) % uploads.length), 4000)
    return () => clearInterval(t)
  }, [paused, uploads.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') router.back()
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % uploads.length)
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + uploads.length) % uploads.length)
      if (e.key === ' ') setPaused(p => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [uploads.length])

  const url = uploads[current]?.display_url || uploads[current]?.original_url

  return (
    <div className="fixed inset-0 bg-[#060d1a] flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-8 py-5" style={{ background: 'linear-gradient(to bottom, rgba(6,13,26,0.9), transparent)' }}>
        <div>
          <p className="text-white font-display font-black text-xl">{event?.name}</p>
          {event?.hashtag && <p className="text-[#14B8A6] text-sm">#{event.hashtag}</p>}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm">{uploads.length} memories</span>
          <button onClick={() => setPaused(p => !p)} className="text-white/60 hover:text-white text-sm px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all">
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={() => router.back()} className="text-white/40 hover:text-white text-sm transition-colors">✕ Exit</button>
        </div>
      </div>

      {/* Main image */}
      {url ? (
        <img key={current} src={url} alt="" className="w-full h-full object-contain transition-opacity duration-700" style={{ opacity: 1 }} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="text-6xl animate-pulse">📸</div>
          <p className="text-white/40 text-lg">Waiting for guests to upload...</p>
          <div className="flex gap-1 mt-2">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#14B8A6] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      )}

      {/* Bottom: thumbnail strip */}
      {uploads.length > 1 && (
        <div className="absolute bottom-0 inset-x-0 flex items-center gap-2 px-6 py-4 overflow-x-auto" style={{ background: 'linear-gradient(to top, rgba(6,13,26,0.95), transparent)' }}>
          {uploads.slice(0, 12).map((u, i) => (
            <button key={u.id} onClick={() => setCurrent(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${current === i ? 'border-[#14B8A6] scale-110' : 'border-white/10 opacity-50 hover:opacity-80'}`}>
              <img src={u.display_url || u.original_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
