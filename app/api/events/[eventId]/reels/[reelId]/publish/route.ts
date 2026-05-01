import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; reelId: string }> }
) {
  try {
    const { eventId, reelId } = await params

    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    // Verify the event belongs to this user
    const { data: event } = await admin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('host_id', user.id)
      .single() as any

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Verify the reel belongs to this event and is complete
    const { data: reel } = await admin
      .from('reels')
      .select('id, status, output_url')
      .eq('id', reelId)
      .eq('event_id', eventId)
      .single() as any

    if (!reel) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
    if (reel.status !== 'complete') {
      return NextResponse.json({ error: 'Reel is not complete yet' }, { status: 400 })
    }

    // Publish — mark as published to gallery
    const { error } = await admin
      .from('reels')
      .update({ published_to_gallery: true })
      .eq('id', reelId) as any

    if (error) {
      console.error('[publish-reel] DB error:', error)
      return NextResponse.json({ error: 'Failed to publish reel' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[publish-reel] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
