import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// ── GET /api/events/[eventId]/analytics ──────────────────────────────────────
// Returns aggregated metrics for an event.
// Only the event host can access this.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabaseUser = await createServerClient_server()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Ownership check
  const { data: event } = await supabase
    .from('events')
    .select('id, host_id, name, upload_count, upload_limit, created_at')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [analyticsRes, uploadsRes, reelsRes] = await Promise.all([
    // event_analytics rows (scans, gallery_view, reel_play)
    supabase
      .from('event_analytics')
      .select('metric, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }),

    // Upload breakdown: photo vs video, approved vs rejected, unique guests
    supabase
      .from('uploads')
      .select('type, approved, guest_name, guest_session_id, created_at, size_bytes')
      .eq('event_id', eventId)
      .neq('status', 'deleted'),

    // Reel info
    supabase
      .from('reels')
      .select('id, status, created_at, completed_at')
      .eq('event_id', eventId),
  ])

  const analyticsRows = analyticsRes.data ?? []
  const uploadRows    = uploadsRes.data ?? []
  const reelRows      = reelsRes.data ?? []

  // ── Aggregate metrics ─────────────────────────────────────────────────────
  const counts: Record<string, number> = {}
  for (const row of analyticsRows) {
    counts[row.metric] = (counts[row.metric] ?? 0) + 1
  }

  const totalPhotos   = uploadRows.filter(u => u.type === 'photo').length
  const totalVideos   = uploadRows.filter(u => u.type === 'video').length
  const approved      = uploadRows.filter(u => u.approved !== false).length
  const rejected      = uploadRows.filter(u => u.approved === false).length
  const totalSizeBytes = uploadRows.reduce((acc, u) => acc + (u.size_bytes ?? 0), 0)

  // Unique guests by session ID (fallback: name)
  const sessionIds = new Set(uploadRows.map(u => u.guest_session_id).filter(Boolean))
  const guestNames = new Set(uploadRows.map(u => u.guest_name).filter(Boolean))
  const uniqueGuests = Math.max(sessionIds.size, guestNames.size)

  // Uploads over time — bucket by day for sparkline (last 14 days)
  const now = Date.now()
  const dayMs = 86_400_000
  const daily: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now - i * dayMs).toISOString().slice(0, 10)
    daily[day] = 0
  }
  for (const u of uploadRows) {
    const day = u.created_at?.slice(0, 10)
    if (day && day in daily) daily[day]++
  }
  const uploadTimeline = Object.entries(daily).map(([date, count]) => ({ date, count }))

  // Top uploaders (by guest_name)
  const nameCount: Record<string, number> = {}
  for (const u of uploadRows) {
    if (u.guest_name) nameCount[u.guest_name] = (nameCount[u.guest_name] ?? 0) + 1
  }
  const topUploaders = Object.entries(nameCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      uploadCount: event.upload_count,
      uploadLimit: event.upload_limit,
      createdAt: event.created_at,
    },
    metrics: {
      scans:        counts['scan']         ?? 0,
      galleryViews: counts['gallery_view'] ?? 0,
      reelPlays:    counts['reel_play']    ?? 0,
      totalUploads: uploadRows.length,
      photos:       totalPhotos,
      videos:       totalVideos,
      approved,
      rejected,
      uniqueGuests,
      totalSizeBytes,
      reels: reelRows.length,
      reelsComplete: reelRows.filter(r => r.status === 'complete').length,
    },
    uploadTimeline,
    topUploaders,
  })
}

// ── POST /api/events/[eventId]/analytics ─────────────────────────────────────
// Records a single metric event. Called from guest pages (scan, gallery_view)
// and from the reel player (reel_play). No auth required — public endpoint.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  let metric: string
  try {
    const body = await req.json()
    metric = body.metric
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ALLOWED_METRICS = ['scan', 'gallery_view', 'reel_play', 'upload'] as const
  if (!ALLOWED_METRICS.includes(metric as typeof ALLOWED_METRICS[number])) {
    return NextResponse.json({ error: 'Invalid metric' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify event exists (don't leak event IDs)
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { error } = await supabase
    .from('event_analytics')
    .insert({ event_id: eventId, metric })

  if (error) {
    console.error('[analytics] Insert failed:', error.message)
    // Non-fatal — don't break the guest experience over analytics
    return NextResponse.json({ ok: false })
  }

  return NextResponse.json({ ok: true })
}
