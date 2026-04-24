import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient_server, createServerUserClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/pricing'
import SignOutButton from './SignOutButton'

export default async function DashboardPage() {
  // Auth check via SSR client (needs cookies)
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = await createServerUserClient()
  const admin = db

  // Get profile — never redirect to login for a missing profile row
  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile missing — create it on the fly so the user reaches the dashboard
    const { data: created } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) ?? '',
        plan_type: 'individual',
      }, { onConflict: 'id' })
      .select()
      .single()
    profile = created
  }

  // Fallback object if DB is entirely unreachable — user still lands on dashboard
  const safeProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: '',
    plan_type: 'individual' as const,
    referral_code: null,
    is_admin: false,
    created_at: new Date().toISOString(),
  }

  // Get events
  const { data: events } = await admin
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activeEvents = events?.filter(e => e.status === 'active') ?? []
  const totalUploads = events?.reduce((sum, e) => sum + e.upload_count, 0) ?? 0
  const firstName = safeProfile.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const isFree = safeProfile.plan_type === 'individual'

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="GuestVue" width={30} height={30} />
            <span className="font-display font-black text-slate-900 hidden sm:block">GuestVue</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard/affiliate"
              className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-[#14B8A6] rounded-lg hover:bg-[#14B8A6]/5 transition-all hidden sm:block">
              Affiliate
            </Link>
            <Link href="/dashboard/settings"
              className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-[#14B8A6] rounded-lg hover:bg-[#14B8A6]/5 transition-all hidden sm:block">
              Settings
            </Link>
            <SignOutButton />
            <Link href="/dashboard/events/new"
              className="ml-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all shadow-md"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
              + New Event
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Gradient hero strip ─────────────────────────────────────────── */}
      <div className="text-white px-4 py-10" style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-white/50 text-sm font-medium mb-1">Dashboard</p>
          <h1 className="font-display font-black text-3xl text-white mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-white/60 text-sm">
            Here&apos;s what&apos;s happening across your events.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 -mt-2">

        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Events', value: activeEvents.length, color: '#14B8A6' },
            { label: 'Total Events', value: events?.length ?? 0, color: '#1E5AAF' },
            { label: 'Photos Collected', value: totalUploads.toLocaleString(), color: '#E8735C' },
            { label: 'Plan', value: safeProfile.plan_type.charAt(0).toUpperCase() + safeProfile.plan_type.slice(1), color: '#0A4F6B' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className="font-display font-black text-2xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/dashboard/events/new"
            className="bg-white border border-slate-100 rounded-2xl p-4 text-center hover:border-[#14B8A6]/40 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#14B8A6] transition-colors">Create Event</p>
          </Link>
          <Link href="/dashboard/affiliate"
            className="bg-white border border-slate-100 rounded-2xl p-4 text-center hover:border-[#1E5AAF]/40 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1E5AAF] transition-colors">Affiliate</p>
          </Link>
          <Link href="/dashboard/settings"
            className="bg-white border border-slate-100 rounded-2xl p-4 text-center hover:border-[#E8735C]/40 hover:shadow-md transition-all group">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#E8735C] transition-colors">Settings</p>
          </Link>
        </div>

        {/* ── Upgrade banner for free users ───────────────────────────────── */}
        {isFree && (
          <div className="mb-8 rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display font-bold text-lg">Unlock the full experience</p>
                <p className="text-white/80 text-sm mt-1">
                  Get 500 uploads, a Basic AI Reel, and a live slideshow for just {formatNaira(24999)}/event.
                </p>
              </div>
              <Link href="/pricing"
                className="flex-shrink-0 bg-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-all"
                style={{ color: '#0A4F6B' }}>
                Upgrade
              </Link>
            </div>
          </div>
        )}

        {/* ── Events list ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-900">Your Events</h2>
            <Link href="/dashboard/events/new"
              className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ color: '#14B8A6' }}>
              + New
            </Link>
          </div>

          {!events || events.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="text-5xl mb-4">🎊</div>
              <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                Create your first event
              </h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                Set up a QR code in under 2 minutes. Guests scan, upload, and you collect every memory.
              </p>
              <Link href="/dashboard/events/new"
                className="inline-flex px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
                Create Event
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {events.map(event => {
                const pct = Math.round((event.upload_count / event.upload_limit) * 100)
                const isActive = event.status === 'active'
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all group"
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-[#14B8A6] animate-pulse' : 'bg-slate-200'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-[#0A4F6B] transition-colors">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-slate-400">
                          {event.upload_count}/{event.upload_limit} uploads
                        </p>
                        {event.event_date && (
                          <p className="text-xs text-slate-300">
                            {new Date(event.event_date).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden w-36">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: pct > 90
                              ? '#E8735C'
                              : 'linear-gradient(90deg, #14B8A6, #1E5AAF)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Plan badge */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                      event.plan === 'pro' ? 'bg-[#0A4F6B]/10 text-[#0A4F6B]' :
                      event.plan === 'flex' ? 'bg-[#1E5AAF]/10 text-[#1E5AAF]' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {event.plan.toUpperCase()}
                    </span>

                    <span className="text-slate-300 group-hover:text-[#14B8A6] transition-colors text-lg">→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
