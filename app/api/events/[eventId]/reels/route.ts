import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
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

  const { data: reels, error } = await admin
    .from('reels')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(10) as any

  if (error) return NextResponse.json({ error: 'Failed to load reels' }, { status: 500 })

  return NextResponse.json({ reels: reels ?? [] })
}
