'use client'

import { useEffect, useState, useCallback } from 'react'

interface Event {
  id: string
  name: string
  upload_count: number | null
  upload_limit: number | null
  created_at: string | null
  status: string | null
}

interface AnalyticsData {
  event: {
    id: string
    name: string
    uploadCount: number
    uploadLimit: number
    createdAt: string
  }
  metrics: {
    scans: number
    galleryViews: number
    reelPlays: number
    totalUploads: number
    photos: number
    videos: number
    approved: number
    rejected: number
    uniqueGuests: number
    totalSizeBytes: number
    reels: number
    reelsComplete: number
  }
  uploadTimeline: { date: string; count: number }[]
  topUploaders: { name: string; count: number }[]
}

interface Props {
  event: Event
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#14B8A6' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 200
  const h = 40
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        opacity="0.12"
      />
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  emoji,
  accentColor = '#14B8A6',
  sparkData,
}: {
  label: string
  value: string | number
  sub?: string
  emoji: string
  accentColor?: string
  sparkData?: number[]
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        {sparkData && <Sparkline data={sparkData} color={accentColor} />}
      </div>
      <div>
        <p className="text-3xl font-black text-white">{value}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color: accentColor }}>{label}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AnalyticsClient({ event }: Props) {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/analytics`)
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [event.id])

  useEffect(() => {
    load()
    // Auto-refresh every 30 seconds
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/50">Could not load analytics. {error}</p>
        <button onClick={load} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#14B8A6' }}>
          Try again
        </button>
      </div>
    )
  }

  const { metrics, uploadTimeline, topUploaders } = data
  const timelineCounts = uploadTimeline.map(t => t.count)
  const uploadLimitPct = metrics.totalUploads / Math.max(metrics.totalUploads + (data.event.uploadLimit - metrics.totalUploads), 1) * 100

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-white font-black text-3xl">{event.name}</h1>
        <p className="text-white/50 text-sm mt-1">
          Live analytics · refreshes every 30 seconds
        </p>
      </div>

      {/* ── Primary stats grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          emoji="📱"
          label="QR Scans"
          value={metrics.scans.toLocaleString()}
          sub="times guests scanned"
          accentColor="#14B8A6"
          sparkData={timelineCounts}
        />
        <StatCard
          emoji="📸"
          label="Total Uploads"
          value={metrics.totalUploads.toLocaleString()}
          sub={`${metrics.photos} photos · ${metrics.videos} videos`}
          accentColor="#E8735C"
          sparkData={timelineCounts}
        />
        <StatCard
          emoji="👥"
          label="Unique Guests"
          value={metrics.uniqueGuests.toLocaleString()}
          sub="based on session ID"
          accentColor="#14B8A6"
        />
        <StatCard
          emoji="🖼"
          label="Gallery Views"
          value={metrics.galleryViews.toLocaleString()}
          sub="times guests viewed"
          accentColor="#E8735C"
        />
      </div>

      {/* ── Secondary row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          emoji="✅"
          label="Approved"
          value={metrics.approved.toLocaleString()}
          accentColor="#10b981"
        />
        <StatCard
          emoji="❌"
          label="Rejected"
          value={metrics.rejected.toLocaleString()}
          accentColor="#ef4444"
        />
        <StatCard
          emoji="🎬"
          label="Reel Plays"
          value={metrics.reelPlays.toLocaleString()}
          sub={`${metrics.reelsComplete} reel${metrics.reelsComplete !== 1 ? 's' : ''} generated`}
          accentColor="#14B8A6"
        />
        <StatCard
          emoji="💾"
          label="Storage Used"
          value={formatBytes(metrics.totalSizeBytes)}
          accentColor="#94a3b8"
        />
      </div>

      {/* ── Upload capacity bar ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">Upload capacity</p>
          <span className="text-sm font-black" style={{ color: uploadLimitPct > 80 ? '#E8735C' : '#14B8A6' }}>
            {metrics.totalUploads} / {data.event.uploadLimit}
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(uploadLimitPct, 100)}%`,
              background: uploadLimitPct > 80
                ? 'linear-gradient(90deg,#E8735C,#ef4444)'
                : 'linear-gradient(90deg,#14B8A6,#0A4F6B)',
            }}
          />
        </div>
        {uploadLimitPct > 80 && (
          <p className="text-xs mt-2" style={{ color: '#E8735C' }}>
            ⚠ Approaching limit — consider upgrading the event plan.
          </p>
        )}
      </div>

      {/* ── Upload timeline + top uploaders ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload timeline */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm font-bold text-white mb-4">Uploads over time (14 days)</p>

          {uploadTimeline.every(t => t.count === 0) ? (
            <div className="flex items-center justify-center h-24 text-white/30 text-sm">
              No uploads yet
            </div>
          ) : (
            <>
              {/* Bar chart */}
              <div className="flex items-end gap-1 h-24">
                {uploadTimeline.map(({ date, count }) => {
                  const maxCount = Math.max(...uploadTimeline.map(t => t.count), 1)
                  const pct = (count / maxCount) * 100
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(pct, 2)}%`,
                          background: count > 0 ? '#14B8A6' : 'rgba(255,255,255,0.08)',
                        }}
                        title={`${formatDate(date)}: ${count} upload${count !== 1 ? 's' : ''}`}
                      />
                    </div>
                  )
                })}
              </div>
              {/* Date labels — first and last */}
              <div className="flex justify-between mt-2">
                <span className="text-xs text-white/30">{formatDate(uploadTimeline[0].date)}</span>
                <span className="text-xs text-white/30">{formatDate(uploadTimeline[uploadTimeline.length - 1].date)}</span>
              </div>
            </>
          )}
        </div>

        {/* Top uploaders */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm font-bold text-white mb-4">Top contributors</p>

          {topUploaders.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-white/30 text-sm">
              No named uploads yet
            </div>
          ) : (
            <div className="space-y-3">
              {topUploaders.map(({ name, count }, i) => {
                const maxCount = topUploaders[0].count
                const pct = (count / maxCount) * 100
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={{ background: i === 0 ? '#E8735C' : 'rgba(255,255,255,0.1)', color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white truncate">{name}</span>
                        <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: '#14B8A6' }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: i === 0 ? '#E8735C' : '#14B8A6',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Media breakdown ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-sm font-bold text-white mb-4">Media breakdown</p>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#14B8A6' }} />
            <span className="text-sm text-white/70">Photos</span>
            <span className="text-sm font-black text-white">{metrics.photos}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#E8735C' }} />
            <span className="text-sm text-white/70">Videos</span>
            <span className="text-sm font-black text-white">{metrics.videos}</span>
          </div>
          {metrics.totalUploads > 0 && (
            <div className="ml-auto text-xs text-white/40">
              {Math.round((metrics.photos / metrics.totalUploads) * 100)}% photos ·{' '}
              {Math.round((metrics.videos / metrics.totalUploads) * 100)}% videos
            </div>
          )}
        </div>
        {metrics.totalUploads > 0 && (
          <div className="h-3 rounded-full overflow-hidden mt-3 flex">
            <div
              className="h-full transition-all"
              style={{
                width: `${(metrics.photos / metrics.totalUploads) * 100}%`,
                background: '#14B8A6',
              }}
            />
            <div
              className="h-full transition-all"
              style={{
                width: `${(metrics.videos / metrics.totalUploads) * 100}%`,
                background: '#E8735C',
              }}
            />
          </div>
        )}
      </div>

    </div>
  )
}
