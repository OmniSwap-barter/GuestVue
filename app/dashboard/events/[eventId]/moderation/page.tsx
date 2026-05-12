import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import ModerationClient from './ModerationClient'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function ModerationPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  // Verify ownership
  const { data: event } = await admin
    .from('events')
    .select('id, name, hashtag, upload_count')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  // Fetch all uploads for this event — host sees everything including rejected
  const { data: uploads } = await admin
    .from('uploads')
    .select('id, original_url, display_url, type, status, approved, guest_name, created_at, size_bytes')
    .eq('event_id', eventId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="min-h-screen" style={{ background: '#060D1A' }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/8"
        style={{ background: '#0A1628' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/dashboard/events/${eventId}`}
            className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to event
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm hidden sm:block">{event.name}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: '#14B8A6' }}>
              Moderation
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <ModerationClient
          eventId={eventId}
          eventName={event.name}
          initialUploads={(uploads ?? []) as any[]}
        />
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic'
