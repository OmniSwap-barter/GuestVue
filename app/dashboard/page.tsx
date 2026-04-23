import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/pricing'

export default async function DashboardPage() {
  const supabase = await createServerClient_server()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Get events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activeEvents = events?.filter(e => e.status === 'active') ?? []
  const totalUploads = events?.reduce((sum, e) => sum + e.upload_count, 0) ?? 0

  return (
    <div className="min-h-screen bg-cloud">
      {/* Top Nav */}
      <header className="bg-white border-b border-midnight-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">GV</span>
            </div>
            <span className="font-display font-bold text-midnight-900 hidden sm:block">GuestVue</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard/events/new"
              className="px-4 py-2 bg-ocean text-white text-sm font-bold rounded-xl hover:bg-ocean-600 transition-all shadow-brand">
              + New Event
            </Link>
            <Link href="/dashboard/settings"
              className="w-9 h-9 rounded-xl border border-midnight-100 flex items-center justify-center hover:bg-midnight-50 transition-all ml-1">
              <span className="text-sm">⚙️</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-midnight-900">
            Welcome back, {profile.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-midnight-500 text-sm mt-1">
            Here&apos;s what&apos;s happening across your events.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Events', value: activeEvents.length, icon: '🎉' },
            { label: 'Total Events', value: events?.length ?? 0, icon: '📅' },
            { label: 'Photos Collected', value: totalUploads.toLocaleString(), icon: '📸' },
            { label: 'Plan', value: profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1), icon: '⭐' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-midnight-100">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="font-display font-bold text-xl text-midnight-900">{stat.value}</p>
              <p className="text-xs text-midnight-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Events list */}
        <div className="bg-white rounded-2xl border border-midnight-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-midnight-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-midnight-900">Your Events</h2>
            <Link href="/dashboard/events/new"
              className="text-sm text-ocean font-semibold hover:text-cobalt">
              + New
            </Link>
          </div>

          {!events || events.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="text-5xl mb-4">🎊</div>
              <h3 className="font-display font-bold text-lg text-midnight-900 mb-2">
                Create your first event
              </h3>
              <p className="text-sm text-midnight-400 mb-6 max-w-xs mx-auto">
                Set up a QR code in under 2 minutes. Guests scan, upload, and you collect every memory.
              </p>
              <Link href="/dashboard/events/new"
                className="inline-flex px-6 py-3 bg-ocean text-white font-bold rounded-xl shadow-brand hover:bg-ocean-600 transition-all text-sm">
                Create Event
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-midnight-50">
              {events.map(event => {
                const pct = Math.round((event.upload_count / event.upload_limit) * 100)
                const isActive = event.status === 'active'
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-midnight-50 transition-all group"
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-teal animate-pulse' : 'bg-midnight-200'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-midnight-900 text-sm truncate group-hover:text-ocean transition-colors">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-midnight-400">
                          {event.upload_count}/{event.upload_limit} uploads
                        </p>
                        {event.event_date && (
                          <p className="text-xs text-midnight-300">
                            {new Date(event.event_date).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1 bg-midnight-100 rounded-full overflow-hidden w-32">
                        <div
                          className={`h-full rounded-full ${pct > 90 ? 'bg-coral' : 'bg-ocean'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Plan badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                      event.plan === 'pro' ? 'bg-ocean/10 text-ocean' :
                      event.plan === 'flex' ? 'bg-cobalt/10 text-cobalt' :
                      'bg-midnight-100 text-midnight-500'
                    }`}>
                      {event.plan.toUpperCase()}
                    </span>

                    <span className="text-midnight-300 group-hover:text-ocean transition-colors">→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Upgrade banner for free plan */}
        {profile.plan_type === 'individual' && (
          <div className="mt-6 rounded-2xl bg-gradient-brand p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display font-bold text-lg">Unlock the full experience</p>
                <p className="text-white/70 text-sm mt-1">
                  Get 500 uploads, a Basic AI Reel, and a live slideshow for just {formatNaira(24999)}/event.
                </p>
              </div>
              <Link href="/pricing"
                className="flex-shrink-0 bg-white text-ocean font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-all">
                Upgrade
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
