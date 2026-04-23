'use client'

import { useState, useRef } from 'react'

interface Event {
  id: string
  name: string
  hashtag: string | null
  event_date: string | null
  plan: string
}

interface Props {
  event: Event
}

const THEMES = [
  {
    id: 'elegant',
    label: 'Elegant Gold',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #3d1f00 50%, #1a0a00 100%)',
    accent: '#D4A843',
    text: '#fff8f0',
    sub: '#c4956a',
    font: 'Georgia, serif',
    border: '2px solid #D4A843',
    emoji: '✨',
  },
  {
    id: 'tropical',
    label: 'Tropical Bliss',
    bg: 'linear-gradient(135deg, #0a4f2a 0%, #0d6b3a 50%, #0a4f2a 100%)',
    accent: '#4ade80',
    text: '#f0fff4',
    sub: '#86efac',
    font: '"Segoe UI", sans-serif',
    border: '2px solid #4ade80',
    emoji: '🌿',
  },
  {
    id: 'midnight',
    label: 'Midnight Navy',
    bg: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)',
    accent: '#14B8A6',
    text: '#ffffff',
    sub: '#94a3b8',
    font: '"Segoe UI", sans-serif',
    border: '2px solid #14B8A6',
    emoji: '🌙',
  },
  {
    id: 'blush',
    label: 'Blush Romance',
    bg: 'linear-gradient(135deg, #4a0020 0%, #7c0035 50%, #4a0020 100%)',
    accent: '#f9a8d4',
    text: '#fff1f5',
    sub: '#fda4af',
    font: 'Georgia, serif',
    border: '2px solid #f9a8d4',
    emoji: '💕',
  },
  {
    id: 'royal',
    label: 'Royal Purple',
    bg: 'linear-gradient(135deg, #1e0030 0%, #3b0060 50%, #1e0030 100%)',
    accent: '#c084fc',
    text: '#fdf4ff',
    sub: '#d8b4fe',
    font: 'Georgia, serif',
    border: '2px solid #c084fc',
    emoji: '👑',
  },
  {
    id: 'sunset',
    label: 'Sunset Lagos',
    bg: 'linear-gradient(135deg, #7c1d00 0%, #c2410c 50%, #ea580c 100%)',
    accent: '#fed7aa',
    text: '#fff7ed',
    sub: '#fdba74',
    font: '"Segoe UI", sans-serif',
    border: '2px solid #fed7aa',
    emoji: '🌅',
  },
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function InvitationBuilder({ event }: Props) {
  const [themeId, setThemeId] = useState('elegant')
  const [headline, setHeadline] = useState(`You're Invited!`)
  const [subline, setSubline] = useState(`Join us as we celebrate ${event.name}`)
  const [venue, setVenue] = useState('')
  const [time, setTime] = useState('')
  const [rsvpNote, setRsvpNote] = useState('Scan the QR code at the event to share your photos!')
  const [downloading, setDownloading] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://theguestvue.com'}/e/${event.id}`

  async function downloadCard() {
    setDownloading(true)
    try {
      // Use html2canvas via CDN loaded in head, or fallback to print
      if (typeof window !== 'undefined' && (window as any).html2canvas && cardRef.current) {
        const canvas = await (window as any).html2canvas(cardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        })
        const link = document.createElement('a')
        link.download = `${event.name.replace(/\s+/g, '_')}_invitation.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        window.print()
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {/* Load html2canvas */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Controls ─────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <h1 className="font-display font-black text-2xl text-slate-900">Invitation Designer</h1>
            <p className="text-sm text-slate-400 mt-1">Customise and download a printable invitation card for your event.</p>
          </div>

          {/* Theme selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-sm font-bold text-slate-700 mb-3">Choose a theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`relative rounded-xl p-3 text-left transition-all border-2 ${
                    themeId === t.id ? 'border-[#14B8A6] ring-2 ring-[#14B8A6]/30' : 'border-transparent'
                  }`}
                  style={{ background: t.bg }}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <p className="text-xs font-semibold mt-1 leading-tight" style={{ color: t.accent }}>{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Text fields */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <p className="text-sm font-bold text-slate-700">Card text</p>

            {[
              { label: 'Headline', value: headline, set: setHeadline, placeholder: "You're Invited!" },
              { label: 'Sub-headline', value: subline, set: setSubline, placeholder: 'Join us to celebrate...' },
              { label: 'Venue', value: venue, set: setVenue, placeholder: 'Victoria Island, Lagos' },
              { label: 'Time', value: time, set: setTime, placeholder: '4:00 PM WAT' },
              { label: 'Photo note', value: rsvpNote, set: setRsvpNote, placeholder: 'Scan the QR code to share photos!' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]"
                />
              </div>
            ))}
          </div>

          <button
            onClick={downloadCard}
            disabled={downloading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}
          >
            {downloading ? 'Preparing download…' : '⬇ Download Invitation Card (PNG)'}
          </button>

          <button
            onClick={() => window.print()}
            className="w-full py-3 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all"
          >
            🖨 Print
          </button>
        </div>

        {/* ── Preview card ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Preview</p>
          <div
            ref={cardRef}
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: theme.bg, border: theme.border, fontFamily: theme.font }}
          >
            {/* Top ornament */}
            <div className="pt-8 px-8 pb-4 text-center">
              <div className="text-4xl mb-3">{theme.emoji}</div>
              <div className="h-px mb-5" style={{ background: theme.accent, opacity: 0.4 }} />

              <h1
                className="text-3xl font-bold leading-tight mb-2"
                style={{ color: theme.accent, fontFamily: theme.font }}
              >
                {headline || "You're Invited!"}
              </h1>

              <div className="h-px my-4" style={{ background: theme.accent, opacity: 0.4 }} />

              <h2 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
                {subline || event.name}
              </h2>

              {event.event_date && (
                <p className="text-sm mt-2" style={{ color: theme.sub }}>
                  📅 {formatDate(event.event_date)}
                </p>
              )}
              {time && (
                <p className="text-sm mt-1" style={{ color: theme.sub }}>🕐 {time}</p>
              )}
              {venue && (
                <p className="text-sm mt-1" style={{ color: theme.sub }}>📍 {venue}</p>
              )}

              {event.hashtag && (
                <p className="text-sm mt-3 font-bold" style={{ color: theme.accent }}>
                  #{event.hashtag}
                </p>
              )}
            </div>

            {/* QR / photo section */}
            <div
              className="mx-6 mb-6 rounded-2xl p-5 text-center"
              style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${theme.accent}40` }}
            >
              {/* Simple QR placeholder */}
              <div
                className="w-24 h-24 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl"
                style={{ background: 'white' }}
              >
                📷
              </div>
              <p className="text-xs font-semibold" style={{ color: theme.text }}>
                {rsvpNote}
              </p>
              <p className="text-xs mt-2 font-mono break-all" style={{ color: theme.accent }}>
                {eventUrl}
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 text-center">
              <p className="text-xs" style={{ color: theme.sub }}>Powered by GuestVue</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(main) { display: none !important; }
          header { display: none !important; }
        }
      `}</style>
    </>
  )
}
