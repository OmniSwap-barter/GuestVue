import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

/**
 * PATCH /api/events/[eventId]/settings
 * Update mutable event settings (custom_color, hashtag, name, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Verify ownership
    const { data: event } = await admin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('host_id', user.id)
      .single() as any

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const body = await req.json()

    // Whitelist of updatable fields
    const allowed = ['custom_color', 'hashtag', 'name', 'event_date', 'custom_logo']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await admin
      .from('events')
      .update(updates)
      .eq('id', eventId) as any

    if (error) {
      console.error('[settings] DB update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[settings] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[eventId]
 * Delete an event and all its associated data.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Verify ownership before deleting
    const { data: event } = await admin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('host_id', user.id)
      .single() as any

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Delete child records first (reels, uploads), then the event itself
    await admin.from('reels').delete().eq('event_id', eventId)
    await admin.from('uploads').delete().eq('event_id', eventId)
    const { error } = await admin.from('events').delete().eq('id', eventId) as any

    if (error) {
      console.error('[delete-event] DB error:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-event] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
