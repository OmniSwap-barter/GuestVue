'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type QRCodeLib from 'qrcode'

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

// ── Occasion themes (Wedding primary, then Corporate, Party, then extras) ─────
const THEMES = [
  {
    id: 'wedding',
    label: '💍 Wedding',
    bg: 'linear-gradient(160deg, #1a0a00 0%, #3d1800 40%, #5c2800 70%, #1a0a00 100%)',
    accent: '#D4A843',
    text: '#fff8f0',
    sub: '#c4956a',
    font: 'Georgia, "Times New Roman", serif',
    border: '1.5px solid #D4A843',
    ornament: '✦',
    tagline: 'Together in love',
  },
  {
    id: 'corporate',
    label: '🏢 Corporate',
    bg: 'linear-gradient(160deg, #030712 0%, #0f172a 50%, #1e3a5f 100%)',
    accent: '#38bdf8',
    text: '#f0f9ff',
    sub: '#94a3b8',
    font: '"Inter", "Segoe UI", sans-serif',
    border: '1.5px solid #38bdf8',
    ornament: '◆',
    tagline: 'Where great minds meet',
  },
  {
    id: 'party',
    label: '🎉 Party',
    bg: 'linear-gradient(160deg, #1a0010 0%, #4c0033 40%, #7c0050 70%, #ff2d78 100%)',
    accent: '#ff6b6b',
    text: '#fff0f6',
    sub: '#ffa8c5',
    font: '"Segoe UI", system-ui, sans-serif',
    border: '1.5px solid #ff6b6b',
    ornament: '★',
    tagline: 'Let the good times roll',
  },
  {
    id: 'midnight',
    label: '🌙 Midnight',
    bg: 'linear-gradient(160deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)',
    accent: '#14B8A6',
    text: '#ffffff',
    sub: '#94a3b8',
    font: '"Segoe UI", sans-serif',
    border: '1.5px solid #14B8A6',
    ornament: '◎',
    tagline: 'A night to remember',
  },
  {
    id: 'blush',
    label: '💕 Romance',
    bg: 'linear-gradient(160deg, #4a0020 0%, #7c0035 50%, #a10048 100%)',
    accent: '#f9a8d4',
    text: '#fff1f5',
    sub: '#fda4af',
    font: 'Georgia, serif',
    border: '1.5px solid #f9a8d4',
    ornament: '♡',
    tagline: 'Love is in the air',
  },
  {
    id: 'sunset',
    label: '🌅 Sunset',
    bg: 'linear-gradient(160deg, #7c1d00 0%, #c2410c 50%, #ea580c 100%)',
    accent: '#fed7aa',
    text: '#fff7ed',
    sub: '#fdba74',
    font: '"Segoe UI", sans-serif',
    border: '1.5px solid #fed7aa',
    ornament: '☀',
    tagline: 'Golden hour vibes',
  },
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const PRINT_CARD_ID = 'guestvue-invitation-print-card'

export default function InvitationBuilder({ event }: Props) {
  const [themeId, setThemeId]     = useState('wedding')
  const [headline, setHeadline]   = useState(`You're Invited!`)
  const [subline, setSubline]     = useState(`Join us as we celebrate ${event.name}`)
  const [venue, setVenue]         = useState('')
  const [time, setTime]           = useState('')
  const [rsvpNote, setRsvpNote]   = useState('Scan the QR code at the event to share your photos!')
  const [downloading, setDownloading] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const theme   = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.id}`
    : `https://theguestvue.com/e/${event.id}`

  // ── Generate QR code for invitation preview ──────────────────────────────
  const generateQR = useCallback(async () => {
    try {
      const QRCode = (await import('qrcode')) as typeof QRCodeLib
      const dataUrl = await QRCode.toDataURL(eventUrl, {
        width: 160,
        margin: 2,
        color: { dark: '#0a0a0a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(dataUrl)
    } catch { /* QR optional — card still renders */ }
  }, [eventUrl])

  useEffect(() => { generateQR() }, [generateQR])

  // ── Download card as PNG via html2canvas ─────────────────────────────────
  async function downloadCard() {
    setDownloading(true)
    try {
      if (typeof window !== 'undefined' && cardRef.current) {
        // Lazy-load html2canvas if not already present
        if (!(window as any).html2canvas) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
            s.onload = () => resolve()
            s.onerror = reject
            document.head.appendChild(s)
          })
        }
        const canvas = await (window as any).html2canvas(cardRef.current, {
          scale: 3,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })
        const link = document.createElement('a')
        link.download = `${event.name.replace(/\s+/g, '_')}_invitation.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    } finally {
      setDownloading(false)
    }
  }

  // ── Print: isolate just the card ─────────────────────────────────────────
  function printCard() {
    window.print()
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Controls ───────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <h1 className="font-display font-black text-2xl text-slate-900">Invitation Designer</h1>
            <p className="text-sm text-slate-400 mt-1">
              Choose an occasion theme, customise the text, then download or print.
            </p>
          </div>

          {/* Occasion theme selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-sm font-bold text-slate-700 mb-3">Occasion theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`relative rounded-xl p-3 text-left transition-all border-2 ${
                    themeId === t.id
                      ? 'ring-2 ring-[#14B8A6]/40'
                      : 'hover:scale-[1.02]'
                  }`}
                  style={{
                    background: t.bg,
                    borderColor: themeId === t.id ? t.accent : 'transparent',
                  }}
                >
                  <p className="text-xs font-bold leading-tight" style={{ color: t.accent }}>
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Text fields */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <p className="text-sm font-bold text-slate-700">Card text</p>
            {([
              { label: 'Headline', value: headline, set: setHeadline, placeholder: "You're Invited!" },
              { label: 'Sub-headline', value: subline, set: setSubline, placeholder: 'Join us to celebrate...' },
              { label: 'Venue', value: venue, set: setVenue, placeholder: 'Victoria Island, Lagos' },
              { label: 'Time', value: time, set: setTime, placeholder: '4:00 PM WAT' },
              { label: 'Photo note', value: rsvpNote, set: setRsvpNote, placeholder: 'Scan the QR code to share photos!' },
            ] as const).map(field => (
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

          {/* Action buttons */}
          <button
            onClick={downloadCard}
            disabled={downloading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}
          >
            {downloading ? 'Preparing download…' : '⬇ Download Invitation Card (PNG)'}
          </button>

          <button
            onClick={printCard}
            className="w-full py-3 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            🖨 Print
          </button>

          <p className="text-xs text-slate-400 text-center">
            Print at A5 size for table cards · Share digitally via WhatsApp or email
          </p>
        </div>

        {/* ── Preview card ────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Live Preview</p>

          <div
            ref={cardRef}
            id={PRINT_CARD_ID}
            className="w-full max-w-sm overflow-hidden shadow-2xl"
            style={{
              borderRadius: '24px',
              background: theme.bg,
              border: theme.border,
              fontFamily: theme.font,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            } as React.CSSProperties}
          >
            {/* Header ornament bar */}
            <div className="pt-8 px-8 text-center">
              <div className="text-3xl mb-4" style={{ color: theme.accent }}>{theme.ornament}</div>

              <div className="h-px mb-5" style={{ background: theme.accent, opacity: 0.5 }} />

              <h1
                className="text-3xl font-bold leading-tight mb-1"
                style={{ color: theme.accent }}
              >
                {headline || "You're Invited!"}
              </h1>

              <p className="text-xs font-semibold uppercase tracking-widest mt-1 mb-4"
                style={{ color: theme.sub, letterSpacing: '0.18em' }}>
                {theme.tagline}
              </p>

              <div className="h-px mb-5" style={{ background: theme.accent, opacity: 0.5 }} />

              <h2 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
                {subline || event.name}
              </h2>

              <div className="mt-3 space-y-1">
                {event.event_date && (
                  <p className="text-sm" style={{ color: theme.sub }}>
                    📅 {formatDate(event.event_date)}
                  </p>
                )}
                {time && <p className="text-sm" style={{ color: theme.sub }}>🕐 {time}</p>}
                {venue && <p className="text-sm" style={{ color: theme.sub }}>📍 {venue}</p>}
              </div>

              {event.hashtag && (
                <p className="text-sm mt-4 font-bold tracking-wide" style={{ color: theme.accent }}>
                  #{event.hashtag}
                </p>
              )}
            </div>

            {/* QR / photo section */}
            <div
              className="mx-6 my-6 rounded-2xl p-5 text-center"
              style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.accent}40` }}
            >
              {qrDataUrl ? (
                <div className="flex justify-center mb-3">
                  <div className="rounded-xl overflow-hidden shadow-lg bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="Event QR Code" width={120} height={120} />
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto mb-3 rounded-xl bg-white flex items-center justify-center text-2xl">
                  ⏳
                </div>
              )}
              <p className="text-xs font-semibold" style={{ color: theme.text }}>
                {rsvpNote}
              </p>
              <p className="text-xs mt-2 font-mono break-all opacity-60" style={{ color: theme.accent }}>
                theguestvue.com/e/{event.id.slice(0, 8)}…
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 text-center">
              <div className="text-xs opacity-40" style={{ color: theme.text }}>
                Powered by GuestVue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print CSS: isolate the invitation card, force background colors ───── */}
      <style>{`
        @media print {
          /* ── Step 1: hide everything, then reveal only the card ─────────── */
          /* Using visibility rather than display:none so layout isn't destroyed */
          body * { visibility: hidden !important; }

          #${PRINT_CARD_ID},
          #${PRINT_CARD_ID} * {
            visibility: visible !important;
          }

          /* ── Step 2: position card at top-left in normal flow ────────────── */
          /* CRITICAL: position:fixed removes element from document flow, causing */
          /* a blank first page. position:absolute keeps it in flow.              */
          #${PRINT_CARD_ID} {
            position: absolute !important;
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 420px !important;
            height: auto !important;
            border-radius: 20px !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* ── Step 3: force background colors & gradients ─────────────────── */
          /* Browsers suppress backgrounds by default in print. These overrides  */
          /* ensure the card gradient and colors actually print.                 */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* ── Step 4: page geometry ───────────────────────────────────────── */
          @page {
            size: A5 landscape;
            margin: 8mm;
          }

          /* ── Step 5: clean up html/body so nothing else bleeds through ───── */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  )
}
