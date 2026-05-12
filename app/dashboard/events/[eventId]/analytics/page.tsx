import { redirect } from 'next/navigation'
import { createServerClient_server } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function AnalyticsPage({ params }: Props) {
  const { eventId } = await params

  const supabaseUser = await createServerClient_server()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, host_id, name, upload_count, upload_limit, created_at, status')
    .eq('id', eventId)
    .single()

  if (!event || event.host_id !== user.id) redirect('/dashboard')

  return (
    <main
      className="min-h-screen"
      style={{ background: '#060D1A' }}
    >
      {/* Top nav bar */}
      <div style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={`/dashboard/events/${eventId}`}
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              ← Back
            </a>
            <div className="w-px h-4 bg-white/20" />
            <div>
              <span className="font-black text-white">Guest</span>
              <span className="font-black" style={{ color: '#14B8A6' }}>Vue</span>
            </div>
          </div>
          <h1 className="text-sm font-bold text-white/70">Event Analytics</h1>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AnalyticsClient event={event} />
      </div>
    </main>
  )
}
