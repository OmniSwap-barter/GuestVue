'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Photo {
  id: string
  original_url: string
  display_url: string | null
  type: string
  created_at: string
}

interface EventInfo {
  id: string
  name: string
  hashtag: string | null
  custom_color: string | null
  custom_logo: string | null
  status: string
}

interface Props {
  event: EventInfo
  initialUploads: Photo[]
}

export default function PhotoWallClient({ event, initialUploads }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialUploads)
  const [featured, setFeatured] = useState(0)
  const [newCount, setNewCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const brandColor = event.custom_color || '#0A4F6B'

  // ─── Supabase Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel(`wall-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'uploads',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          const row = payload.new as Photo
          if (row.type === 'photo') {
            setPhotos(prev => {
              const exists = prev.some(p => p.id === row.id)
              if (exists) return prev
              setNewCount(n => n + 1)
              return [row, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [event.id])

  // ─── Auto-cycle featured photo ────────────────────────────────────────────
  useEffect(() => {
    if (photos.length <= 1) return
    timerRef.current = setInterval(() => {
      setFeatured(prev => (prev + 1) % photos.length)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [photos.length])

  // When a new photo arrives, jump to it
  useEffect(() => {
    if (newCount > 0) setFeatured(0)
  }, [newCount])

  const featuredPhoto = photos[featured]
  const gridPhotos = photos.slice(0, 24) // show up to 24 in grid

  if (photos.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #1E5AAF 50%, #E8735C 100%)` }}
      >
        <div className="text-center">
          {event.custom_logo ? (
            <img src={event.custom_logo} alt={event.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-2xl" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
          )}
          <h1 className="text-4xl font-black mb-3">{event.name}</h1>
          {event.hashtag && <p className="text-white/60 text-xl mb-8">#{event.hashtag}</p>}
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-lg">Waiting for guests to share photos…</p>
        </div>
        <p className="absolute bottom-6 text-white/30 text-sm">Powered by GuestVue</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-3">
          {event.custom_logo ? (
            <img src={event.custom_logo} alt={event.name} className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: brandColor }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          <div>
            <p className="font-bold text-white text-sm leading-none">{event.name}</p>
            {event.hashtag && <p className="text-white/50 text-xs mt-0.5">#{event.hashtag}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="w-2 h-2 bg-[#14B8A6] rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold text-white/90">LIVE</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-xs font-semibold text-white/90">{photos.length} photos</span>
          </div>
        </div>
      </div>

      {/* Featured hero photo */}
      {featuredPhoto && (
        <div className="relative w-full h-screen">
          <img
            key={featuredPhoto.id}
            src={featuredPhoto.display_url || featuredPhoto.original_url}
            alt=""
            className="w-full h-full object-cover"
            style={{ animation: 'wallFadeIn 1.2s ease-in-out' }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)' }} />
        </div>
      )}

      {/* Bottom thumbnail strip */}
      {gridPhotos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 px-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>

          {/* Hashtag + count */}
          <div className="flex items-center justify-between mb-3 px-2">
            {event.hashtag && (
              <span className="font-black text-white text-xl tracking-tight">#{event.hashtag}</span>
            )}
            <span className="text-white/50 text-sm font-semibold ml-auto">{photos.length} memories shared</span>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {gridPhotos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setFeatured(i); if (timerRef.current) clearInterval(timerRef.current) }}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  i === featured ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'
                }`}
              >
                <img src={p.display_url || p.original_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slide progress bar */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-30">
          <div
            key={featured}
            className="h-full bg-white origin-left"
            style={{ animation: 'progressBar 5s linear forwards' }}
          />
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes wallFadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* GuestVue watermark */}
      <div className="absolute top-4 right-4 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
          <p className="text-white/60 text-xs">Powered by GuestVue</p>
        </div>
      </div>
    </div>
  )
}
