'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Event {
  id: string
  name: string
  hashtag: string | null
  event_date: string | null
}

interface Props {
  event: Event
}

const COLOR_PRESETS = [
  { label: 'Ocean', fg: '#0A4F6B', bg: '#FFFFFF' },
  { label: 'Teal',  fg: '#14B8A6', bg: '#FFFFFF' },
  { label: 'Gold',  fg: '#92400E', bg: '#FEF3C7' },
  { label: 'Night', fg: '#FFFFFF', bg: '#060D1A' },
  { label: 'Blush', fg: '#9D174D', bg: '#FFF1F5' },
  { label: 'Forest', fg: '#14532D', bg: '#F0FFF4' },
]

const CARD_STYLES = [
  { id: 'minimal', label: 'Minimal', desc: 'Clean white card' },
  { id: 'branded', label: 'Branded', desc: 'GuestVue gradient' },
  { id: 'dark',    label: 'Dark',    desc: 'Midnight luxury' },
  { id: 'festive', label: 'Festive', desc: 'Gold celebration' },
]

const CARD_THEMES: Record<string, { bg: string; text: string; sub: string; border: string }> = {
  minimal: { bg: '#FFFFFF', text: '#0f172a', sub: '#64748b', border: '#e2e8f0' },
  branded: { bg: 'linear-gradient(135deg,#060d1a,#0a1628,#0A4F6B)', text: '#fff', sub: '#94a3b8', border: 'transparent' },
  dark:    { bg: 'linear-gradient(135deg,#0f0f1a,#1e1b4b)', text: '#e0e7ff', sub: '#818cf8', border: '#4f46e5' },
  festive: { bg: 'linear-gradient(135deg,#1a0800,#3d1000)', text: '#FEF3C7', sub: '#D4A843', border: '#D4A843' },
}

export default function QRCustomizer({ event }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.id}`
    : `https://theguestvue.com/e/${event.id}`

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [fgColor, setFgColor] = useState('#0A4F6B')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [cardStyle, setCardStyle] = useState('minimal')
  const [cardLabel, setCardLabel] = useState(event.name)
  const [subLabel, setSubLabel] = useState(event.hashtag ? `#${event.hashtag}` : 'Scan to share your photos')
  const [showLogo, setShowLogo] = useState(true)
  const [size] = useState(220)
  const [downloading, setDownloading] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)

  const generateQR = useCallback(async () => {
    if (typeof window === 'undefined') return
    const QRCode = (window as any).QRCode
    if (!QRCode) return
    try {
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, eventUrl, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: showLogo ? 'H' : 'M',
      })
      setQrDataUrl(canvas.toDataURL('image/png'))
    } catch (e) {
      console.error('QR error', e)
    }
  }, [eventUrl, fgColor, bgColor, size, showLogo])

  // Load qrcode.js then generate
  useEffect(() => {
    if (qrLoaded) { generateQR(); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => { setQrLoaded(true) }
    document.head.appendChild(script)
  }, [qrLoaded, generateQR])

  useEffect(() => { if (qrLoaded) generateQR() }, [qrLoaded, generateQR])

  async function downloadCard() {
    setDownloading(true)
    try {
      const html2canvas = (window as any).html2canvas
      if (html2canvas && cardRef.current) {
        const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null })
        const link = document.createElement('a')
        link.download = `${event.name.replace(/\s+/g, '_')}_QR_Card.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        window.print()
      }
    } finally {
      setDownloading(false)
    }
  }

  const ct = CARD_THEMES[cardStyle]

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Controls ─────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <h1 className="font-display font-black text-2xl text-slate-900">QR Code Customizer</h1>
            <p className="text-sm text-slate-400 mt-1">Generate a branded QR card guests scan to upload their photos.</p>
          </div>

          {/* QR colors */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-sm font-bold text-slate-700 mb-3">QR code colors</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setFgColor(p.fg); setBgColor(p.bg) }}
                  className="rounded-xl p-2.5 text-center text-xs font-semibold border-2 transition-all"
                  style={{
                    background: p.bg,
                    color: p.fg,
                    borderColor: fgColor === p.fg ? '#14B8A6' : '#e2e8f0',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1 font-semibold">QR Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200" />
                  <span className="text-xs font-mono text-slate-600">{fgColor}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1 font-semibold">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200" />
                  <span className="text-xs font-mono text-slate-600">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card style */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-sm font-bold text-slate-700 mb-3">Card style</p>
            <div className="grid grid-cols-2 gap-2">
              {CARD_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCardStyle(s.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    cardStyle === s.id ? 'border-[#14B8A6] bg-[#14B8A6]/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <p className="text-sm font-bold text-slate-700">Card text</p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Headline</label>
              <input type="text" value={cardLabel} onChange={e => setCardLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sub-line</label>
              <input type="text" value={subLabel} onChange={e => setSubLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showLogo} onChange={e => setShowLogo(e.target.checked)}
                className="rounded accent-[#14B8A6]" />
              <span className="text-sm text-slate-700">Show "Powered by GuestVue" on card</span>
            </label>
          </div>

          <button onClick={downloadCard} disabled={downloading || !qrDataUrl}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
            {downloading ? 'Preparing…' : '⬇ Download QR Card (PNG)'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            Print and display at your event · Guests scan to upload instantly
          </p>
        </div>

        {/* ── Preview card ──────────────────────────────────── */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Preview</p>

          <div
            ref={cardRef}
            className="w-72 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: ct.bg,
              border: ct.border !== 'transparent' ? `2px solid ${ct.border}` : undefined,
            }}
          >
            <div className="px-7 pt-7 pb-4 text-center">
              <h2 className="font-bold text-xl leading-tight" style={{ color: ct.text }}>
                {cardLabel || event.name}
              </h2>
              <p className="text-sm mt-1 font-medium" style={{ color: ct.sub }}>
                {subLabel}
              </p>
            </div>

            {/* QR code */}
            <div className="flex justify-center px-7 pb-4">
              {qrDataUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
                </div>
              ) : (
                <div
                  className="w-[220px] h-[220px] rounded-2xl flex items-center justify-center text-4xl"
                  style={{ background: bgColor }}
                >
                  ⏳
                </div>
              )}
            </div>

            <div className="px-7 pb-3 text-center">
              <p className="text-xs font-semibold" style={{ color: ct.sub }}>📸 Scan to share your photos</p>
              <p className="text-xs font-mono mt-1 break-all opacity-60" style={{ color: ct.text }}>
                theguestvue.com/e/{event.id.slice(0, 8)}…
              </p>
            </div>

            {showLogo && (
              <div className="pb-5 text-center">
                <p className="text-xs opacity-40" style={{ color: ct.text }}>Powered by GuestVue</p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center max-w-xs">
            Print this card at A5 or A6 size for table displays, or share the QR image digitally.
          </p>
        </div>
      </div>
    </>
  )
}
