import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { eventId: string } }) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: event } = await admin.from('events').select('*').eq('id', params.eventId).eq('host_id', user.id).single() as any
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: uploads } = await admin.from('uploads').select('original_url, display_url, type, created_at').eq('event_id', params.eventId).in('status', ['ready', 'processing']) as any

  // Return list of URLs for client-side individual download
  // (True ZIP generation requires server-side streaming — return URLs for now)
  return NextResponse.json({
    urls: (uploads ?? []).map((u: any) => ({ url: u.original_url || u.display_url, type: u.type })),
    eventName: event.name,
    count: (uploads ?? []).length
  })
}
