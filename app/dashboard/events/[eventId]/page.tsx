import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createServerUserClient, createAdminClient } from '@/lib/supabase/server'
import EventDetailClient from './EventDetailClient'

interface Props {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ payment?: string }>
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { eventId } = await params
  const { payment } = await searchParams
  const paymentSuccess = payment === 'success'

  // Auth check via SSR client (needs cookies)
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = await createServerUserClient()

  // Verify ownership
  const { data: event } = await db
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) notFound()

  // Fetch recent uploads + user profile in parallel
  const admin = createAdminClient()
  const [{ data: uploads }, { data: profileData }] = await Promise.all([
    db
      .from('uploads')
      .select('*')
      .eq('event_id', eventId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('profiles')
      .select('plan_type, is_unlimited')
      .eq('id', user.id)
      .single(),
  ])

  const profile = profileData
    ? { plan_type: profileData.plan_type ?? 'free', is_unlimited: profileData.is_unlimited ?? false }
    : { plan_type: 'free', is_unlimited: false }

  return (
    <div className="min-h-screen bg-cloud overflow-x-hidden">
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
        {paymentSuccess && (
          <div className="mb-6 rounded-2xl p-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 60%, #0A4F6B 100%)' }}>
            <div className="flex items-start gap-4">
              <div className="text-3xl flex-shrink-0">🎉</div>
              <div>
                <p className="font-display font-bold text-lg">Payment confirmed — your event is live!</p>
                <p className="text-white/80 text-sm mt-1">
                  Share the QR code with your guests. Every photo and video they upload will appear here in real time.
                </p>
              </div>
            </div>
          </div>
        )}
        <EventDetailClient event={event} initialUploads={uploads ?? []} profile={profile} />
      </main>
    </div>
  )
}
