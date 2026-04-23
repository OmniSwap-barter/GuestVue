import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server } from '@/lib/supabase/server'
import EventDetailClient from './EventDetailClient'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createServerClient_server()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify ownership
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  // Fetch recent uploads
  const { data: uploads } = await supabase
    .from('uploads')
    .select('*')
    .eq('event_id', eventId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-cloud">
      {/* Nav */}
      <header className="bg-white border-b border-midnight-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-midnight-400 hover:text-midnight-700">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/e/${eventId}`} target="_blank"
              className="text-sm text-ocean font-semibold hover:text-cobalt">
              View Guest Page ↗
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <EventDetailClient event={event} initialUploads={uploads ?? []} />
      </main>
    </div>
  )
}
