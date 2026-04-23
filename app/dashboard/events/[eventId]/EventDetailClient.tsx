'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']
type Upload = Database['public']['Tables']['uploads']['Row']

interface Props {
  event: Event
  initialUploads: Upload[]
}

export default function EventDetailClient({ event, initialUploads }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'gallery' | 'reel' | 'settings'>('overview')
  const [uploads] = useState<Upload[]>(initialUploads)
  const [copied, setCopied] = useState(false)

  const guestUrl = event.gallery_url || `${window?.location?.origin}/e/${event.id}`
  const pct = Math.round((event.upload_count / event.upload_limit) * 100)

  function copyLink() {
    navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const photos = uploads.filter(u => u.type === 'photo')
  const videos = uploads.filter(u => u.type === 'video')

  return (
    <div>
      {/* Event header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-1">
          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
            event.status === 'active' ? 'bg-teal animate-pulse' :
            event.status === 'paused' ? 'bg-coral' : 'bg-midnight-200'
          }`} />
          <div>
            <h1 className="font-display font-bold text-2xl text-midnight-900">{event.name}</h1>
            {event.hashtag && (
              <p className="text-midnight-400 text-sm mt-0.5">#{event.hashtag}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
            event.plan === 'pro' ? 'bg-ocean/10 text-ocean' :
            event.plan === 'flex' ? 'bg-cobalt/10 text-cobalt' :
            'bg-midnight-100 text-midnight-500'
          }`}>
            {event.plan.toUpperCase()}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${
            event.status === 'active' ? 'bg-teal/10 text-teal' :
            event.status === 'paused' ? 'bg-coral/10 text-coral' :
            'bg-midnight-100 text-midnight-500'
          }`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Paused warning */}
      {event.status === 'paused' && (
        <div className="bg-coral/10 border border-coral/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-coral text-sm">Payment required to activate</p>
            <p className="text-xs text-midnight-500 mt-0.5">
              Guests can&apos;t upload yet. Complete payment to activate this event.
            </p>
          </div>
          <button className="ml-auto bg-coral text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all">
            Pay Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-midnight-100 rounded-xl p-1 mb-6">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'gallery', label: `Gallery (${uploads.length})` },
          { id: 'reel', label: 'AI Reel' },
          { id: 'settings', label: 'Settings' },
        ] as { id: typeof tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-white text-midnight-900 shadow-sm' : 'text-midnight-500 hover:text-midnight-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* QR Code card */}
          <div className="bg-white rounded-2xl border border-midnight-100 p-6">
            <h2 className="font-display font-bold text-midnight-900 mb-4">Your QR Code</h2>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-40 h-40 bg-midnight-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-midnight-100">
                {event.qr_url ? (
                  <img src={event.qr_url} alt="QR Code" className="w-36 h-36 object-contain" />
                ) : (
                  <span className="text-midnight-300 text-sm text-center px-3">QR generating…</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-midnight-500 mb-3">
                  Share this link or print the QR code. Guests scan it to upload their photos — no app needed.
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    readOnly
                    value={guestUrl}
                    className="flex-1 px-3 py-2 text-sm bg-midnight-50 border border-midnight-100 rounded-xl text-midnight-700 font-mono truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-ocean text-white text-sm font-bold rounded-xl hover:bg-ocean-600 transition-all flex-shrink-0"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex gap-2">
                  {event.qr_url && (
                    <a
                      href={event.qr_url}
                      download={`${event.name}-QR.png`}
                      className="text-sm text-midnight-500 hover:text-midnight-700 underline"
                    >
                      Download QR PNG
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Photos', value: photos.length, icon: '📸' },
              { label: 'Videos', value: videos.length, icon: '🎬' },
              { label: 'Uploads Used', value: `${event.upload_count}/${event.upload_limit}`, icon: '📊' },
              { label: 'Capacity', value: `${pct}%`, icon: '💾' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-midnight-100 p-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="font-display font-bold text-lg text-midnight-900">{s.value}</p>
                <p className="text-xs text-midnight-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div className="bg-white rounded-2xl border border-midnight-100 p-5">
            <div className="flex justify-between text-sm text-midnight-500 mb-2">
              <span>Upload capacity</span>
              <span>{event.upload_count.toLocaleString()} / {event.upload_limit === 999999 ? '∞' : event.upload_limit.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-midnight-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-coral' : 'bg-ocean'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {pct > 80 && (
              <p className="text-xs text-coral mt-2">Running low — consider upgrading to avoid missing memories.</p>
            )}
          </div>

          {/* Expiry info */}
          {(event.page_expires_at || event.storage_expires_at) && (
            <div className="bg-white rounded-2xl border border-midnight-100 p-5 space-y-2">
              <h3 className="font-semibold text-midnight-900 text-sm">Expiry dates</h3>
              {event.page_expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">Guest upload page closes</span>
                  <span className="font-medium text-midnight-700">
                    {new Date(event.page_expires_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {event.storage_expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">Files deleted</span>
                  <span className="font-medium text-midnight-700">
                    {new Date(event.storage_expires_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── GALLERY TAB ──────────────────────────────────────────────────────── */}
      {tab === 'gallery' && (
        <div>
          {uploads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-midnight-100 py-16 text-center">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="font-display font-bold text-midnight-900 mb-1">No uploads yet</h3>
              <p className="text-sm text-midnight-400">Share your QR code to start collecting memories.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-midnight-500">{uploads.length} files collected</p>
                <button className="text-sm text-ocean font-semibold hover:text-cobalt">
                  ↓ Download All
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {uploads.map(upload => (
                  <div key={upload.id} className="relative aspect-square rounded-xl overflow-hidden bg-midnight-100 group cursor-pointer">
                    {upload.type === 'photo' ? (
                      <img
                        src={upload.display_url || upload.original_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-midnight-800">
                        <span className="text-3xl">🎬</span>
                      </div>
                    )}
                    {upload.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Processing…</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── REEL TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'reel' && (
        <div className="bg-white rounded-2xl border border-midnight-100 p-6 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="font-display font-bold text-xl text-midnight-900 mb-2">AI Reel Generator</h2>
          <p className="text-sm text-midnight-500 mb-6 max-w-md mx-auto">
            Turn your event photos into a TikTok-ready reel with music, transitions, and your event hashtag.
          </p>
          {event.plan === 'free' ? (
            <div>
              <p className="text-sm text-midnight-400 mb-4">Upgrade to Flex or Pro to generate AI reels.</p>
              <button className="px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl shadow-brand">
                Upgrade Plan
              </button>
            </div>
          ) : (
            <button className="px-6 py-3 bg-ocean text-white font-bold rounded-xl shadow-brand hover:bg-ocean-600 transition-all">
              Generate Basic Reel
            </button>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-midnight-100 p-5">
            <h3 className="font-display font-bold text-midnight-900 mb-4">Event settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">Custom accent color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={event.custom_color || '#0A4F6B'}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-midnight-200"
                  />
                  <span className="text-sm text-midnight-500">Shown on the guest upload page</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <h3 className="font-semibold text-red-700 mb-2">Danger Zone</h3>
            <p className="text-xs text-red-500 mb-3">This cannot be undone.</p>
            <button className="text-sm text-red-600 font-semibold border border-red-200 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">
              Delete Event
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
