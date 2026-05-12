import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ eventId: string; uploadId: string }>
}

// PATCH /api/events/[eventId]/uploads/[uploadId]/approve
// Body: { approved: boolean }
// Auth: host only — verifies event ownership before mutating
export async function PATCH(req: NextRequest, { params }: Params) {
  const { eventId, uploadId } = await params

  // Auth — must be logged in
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership — host must own this event
  const admin = createAdminClient()
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found or access denied' }, { status: 403 })
  }

  // Parse body
  const body = await req.json().catch(() => null)
  if (body === null || typeof body.approved !== 'boolean') {
    return NextResponse.json({ error: 'Body must be { approved: boolean }' }, { status: 400 })
  }

  // Apply the moderation decision
  const { error } = await admin
    .from('uploads')
    .update({ approved: body.approved })
    .eq('id', uploadId)
    .eq('event_id', eventId) // safety: only touch uploads belonging to this event

  if (error) {
    console.error('[moderation] update error:', error)
    return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 })
  }

  return NextResponse.json({ success: true, approved: body.approved })
}
