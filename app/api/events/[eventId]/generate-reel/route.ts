import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: event } = await admin.from('events').select('*').eq('id', params.eventId).eq('host_id', user.id).single() as any
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Insert reel job — 'type' is NOT NULL so must be provided
  const { data: reel, error } = await admin.from('reels').insert({ event_id: params.eventId, type: 'highlight', status: 'queued' }).select().single() as any
  if (error) return NextResponse.json({ error: 'Failed to queue reel' }, { status: 500 })

  // Dispatch to Railway worker
  if (process.env.RAILWAY_WORKER_URL && process.env.WORKER_SECRET) {
    fetch(`${process.env.RAILWAY_WORKER_URL}/jobs/generate-reel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-worker-secret': process.env.WORKER_SECRET },
      body: JSON.stringify({ reelId: reel.id, eventId: params.eventId, plan: event.plan }),
    }).catch(err => console.warn('Worker reel dispatch failed:', err.message))
  }

  return NextResponse.json({ reel }, { status: 201 })
}
