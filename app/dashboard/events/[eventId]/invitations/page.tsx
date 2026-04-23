import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server } from '@/lib/supabase/server'
import InvitationBuilder from './InvitationBuilder'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function InvitationsPage({ params }: Props) {
  const { eventId } = await params
  const supabase = await createServerClient_server()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/dashboard/events/${eventId}`} className="text-sm text-slate-400 hover:text-slate-700">
            ← Back to Event
          </Link>
          <span className="text-slate-200">/</span>
          <span className="text-sm font-semibold text-slate-700">Invitation Designer</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <InvitationBuilder event={event} />
      </main>
    </div>
  )
}
