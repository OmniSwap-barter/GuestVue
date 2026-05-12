import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient_server, createServerUserClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/pricing'
import SignOutButton from './SignOutButton'

interface Props {
  searchParams: Promise<{ onboarded?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { onboarded } = await searchParams

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
        onboarding_complete: true,
      }, { onConflict: 'id' })
      .select()
      .single()
    profile = created
  }

  // Gate: incomplete onboarding → redirect (skip for admin-created profiles)
  if (profile && profile.onboarding_complete === false) {
    redirect('/onboarding')
  }

  // Fallback object if DB is entirely unreachable — user still lands on dashboard
  const safeProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: '',
    plan_type: 'individual' as const,
    referral_code: null,
    is_admin: false,
    onboarding_complete: true,
    country: null,
    created_at: new Date().toISOString(),
  }

  // Get events
  const { data: events } = await admin
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const activeEvents = events?.filter(e => e.status === 'active') ?? []
  const totalUploads = events?.reduce((sum, e) => sum + e.upload_count, 0) ?? 0
  const firstName = safeProfile.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  const planType = safeProfile.plan_type ?? 'individual'
  const isFree = planType === 'individual'
  const isPlanner = planType === 'planner'
  const isBusiness = planType === 'business'
  const isCorporate = planType === 'corporate'

  // Full display name for the account category
  const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    individual: 'Individual Host',
    planner:    'Event Planner',
    business:   'Business / Brand',
    corporate:  'Corporate',
  }
  const planLabel = ACCOUNT_TYPE_LABELS[planType] ?? (planType.charAt(0).toUpperCase() + planType.slice(1))

  return (
    <div className="min-h-screen" style={{ background: '#060D1A' }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="GuestVue" width={30} height={30} />
            <span className="font-display font-black text-white hidden sm:block">GuestVue</span>
          </Link>
          <nav className="flex items-center gap-1">
            {(isPlanner || isBusiness || isCorporate) && (
              <Link href="/dashboard/analytics"
                className="px-3 py-2 text-sm font-medium text-white/60 hover:text-[#14B8A6] rounded-lg hover:bg-[#14B8A6]/5 transition-all hidden sm:block">
                Analytics
              </Link>
            )}
            <Link href="/dashboard/affiliate"
              className="px-3 py-2 text-sm font-medium text-white/60 hover:text-[#14B8A6] rounded-lg hover:bg-[#14B8A6]/5 transition-all hidden sm:block">
              Affiliate
            </Link>
            <Link href="/dashboard/settings"
              className="px-3 py-2 text-sm font-medium text-white/60 hover:text-[#14B8A6] rounded-lg hover:bg-[#14B8A6]/5 transition-all hidden sm:block">
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

      {/* ── Welcome banner (post-onboarding) ────────────────────────────── */}
      {onboarded === '1' && (
        <div className="bg-gradient-to-r from-[#14B8A6] to-[#1E5AAF] text-white px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-sm">Welcome to GuestVue, {firstName}!</p>
                <p className="text-white/80 text-xs">Your account is ready. Create your first event and start collecting memories.</p>
              </div>
            </div>
            <Link href="/dashboard/events/new"
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 border border-white/30 font-bold text-xs px-3 py-1.5 rounded-lg transition-all">
              Create event →
            </Link>
          </div>
        </div>
      )}

      {/* ── Gradient hero strip ─────────────────────────────────────────── */}
      <div className="text-white px-4 py-10" style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-white/50 text-sm font-medium">Dashboard</p>
            <span className="text-white/20">·</span>
            {/* Account type identity chip — always visible */}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border" style={{
              background: isFree     ? 'rgba(255,255,255,0.08)' :
                          isPlanner  ? 'rgba(20,184,166,0.2)'   :
                          isBusiness ? 'rgba(232,115,92,0.2)'   :
                                       'rgba(30,90,175,0.2)',
              borderColor: isFree    ? 'rgba(255,255,255,0.15)' :
                          isPlanner  ? 'rgba(20,184,166,0.4)'   :
                          isBusiness ? 'rgba(232,115,92,0.4)'   :
                                       'rgba(30,90,175,0.4)',
              color: isFree     ? 'rgba(255,255,255,0.55)' :
                     isPlanner  ? '#14B8A6' :
                     isBusiness ? '#E8735C' :
                                  '#60A5FA',
            }}>
              <span>{isFree ? '🎟' : isPlanner ? '📋' : isBusiness ? '🏢' : '🌐'}</span>
              {planLabel}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl text-white mb-1">
            Welcome back, {firstName}
          </h1>
          <p className="text-white/60 text-sm">
            {isPlanner && 'Manage your events and deliver unforgettable client experiences.'}
            {isBusiness && 'Your brand\'s content engine is running.'}
            {isCorporate && 'Enterprise overview — all events and accounts.'}
            {isFree && 'Here\'s what\'s happening across your events.'}
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 -mt-2">

        {/* ── Stats cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Events', value: activeEvents.length, color: '#14B8A6' },
            { label: 'Total Events', value: events?.length ?? 0, color: '#14B8A6' },
            { label: 'Photos Collected', value: totalUploads.toLocaleString(), color: '#E8735C' },
            { label: 'Plan', value: planLabel, color: '#E8735C' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4"
              style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="font-display font-black text-2xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-white/50 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className={`grid gap-3 mb-8 ${isBusiness || isCorporate ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <Link href="/dashboard/events/new"
            className="rounded-2xl p-4 text-center transition-all group"
            style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-white/70 group-hover:text-[#14B8A6] transition-colors">Create Event</p>
          </Link>
          {(isBusiness || isCorporate) && (
            <Link href="/dashboard/analytics"
              className="rounded-2xl p-4 text-center transition-all group"
              style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(232,115,92,0.4)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-semibold text-white/70 group-hover:text-[#E8735C] transition-colors">Analytics</p>
            </Link>
          )}
          <Link href="/dashboard/affiliate"
            className="rounded-2xl p-4 text-center transition-all group"
            style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(30,90,175,0.4)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
            <div className="text-2xl mb-2">🔗</div>
            <p className="text-sm font-semibold text-white/70 group-hover:text-[#14B8A6] transition-colors">Affiliate</p>
          </Link>
          <Link href="/dashboard/settings"
            className="rounded-2xl p-4 text-center transition-all group"
            style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(232,115,92,0.4)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
            <div className="text-2xl mb-2">⚙️</div>
            <p className="text-sm font-semibold text-white/70 group-hover:text-[#E8735C] transition-colors">Settings</p>
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

        {/* ── Active plan strip — shown to all paid tiers so it's clear the upgrade worked ── */}
        {!isFree && (
          <div className="mb-8 rounded-2xl p-4 flex items-center gap-4" style={{ background: '#0A1628', border: '1px solid rgba(20,184,166,0.25)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(20,184,166,0.15)' }}>
              <span className="text-xl">{isPlanner ? '📋' : isBusiness ? '🏢' : isCorporate ? '🌐' : '✨'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{planLabel} plan — active</p>
              <p className="text-xs text-white/50 mt-0.5">
                {isPlanner  && 'Unlimited events · AI Reels · Client galleries'}
                {isBusiness && 'Unlimited events · Bulk download · Priority rendering · White-label ready'}
                {isCorporate && 'Enterprise access · Sub-accounts · API-ready · Dedicated support'}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.3)' }}>
              ✓ Active
            </span>
          </div>
        )}

        {/* ── PLANNER: Multi-event panel ───────────────────────────────────── */}
        {isPlanner && (
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {/* Event pipeline summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Event Pipeline</h3>
                <Link href="/dashboard/events/new" className="text-xs font-bold text-[#14B8A6] hover:underline">+ New</Link>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Active', count: activeEvents.length, color: '#14B8A6', bg: '#14B8A6/10' },
                  { label: 'Total Managed', count: events?.length ?? 0, color: '#1E5AAF', bg: '#1E5AAF/10' },
                  { label: 'Total Uploads', count: totalUploads.toLocaleString(), color: '#E8735C', bg: '#E8735C/10' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="font-black text-sm" style={{ color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Client sub-accounts teaser */}
            <div className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-8xl opacity-10 leading-none">👥</div>
              <div className="relative">
                <span className="inline-block bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-3">Coming Soon</span>
                <h3 className="font-bold text-lg mb-1">Client Sub-Accounts</h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Give each client their own login to view their event gallery and downloads — without access to your full account.
                </p>
                <button disabled className="bg-white/20 border border-white/30 text-white/70 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed">
                  Notify me when live
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BUSINESS: Analytics + capabilities panel ─────────────────────── */}
        {isBusiness && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {/* Monthly metrics */}
            <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Content Overview</h3>
                <span className="text-xs text-slate-400">All time</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Events Created', value: events?.length ?? 0, icon: '📅', color: '#0A4F6B' },
                  { label: 'Active Campaigns', value: activeEvents.length, icon: '🔴', color: '#14B8A6' },
                  { label: 'UGC Collected', value: totalUploads.toLocaleString(), icon: '📸', color: '#E8735C' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <p className="font-black text-xl" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400">Full analytics dashboard coming soon</p>
                <Link href="/dashboard/analytics" className="text-xs font-bold text-[#14B8A6] hover:underline">View →</Link>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🏷️</span>
                  <p className="font-bold text-sm text-slate-900">White-Label</p>
                  <span className="ml-auto text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">Soon</span>
                </div>
                <p className="text-xs text-slate-400">Your brand, your QR codes.</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔌</span>
                  <p className="font-bold text-sm text-slate-900">API Access</p>
                  <span className="ml-auto text-xs bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">Soon</span>
                </div>
                <p className="text-xs text-slate-400">Webhooks &amp; CRM sync.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CORPORATE: Enterprise overview ───────────────────────────────── */}
        {isCorporate && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #060d1a, #0A4F6B)' }}>
              <div>
                <h3 className="font-bold text-white">Enterprise Dashboard</h3>
                <p className="text-white/50 text-xs">Corporate account — full platform access</p>
              </div>
              <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                Corporate
              </span>
            </div>
            <div className="grid sm:grid-cols-4 divide-x divide-slate-50">
              {[
                { icon: '📅', label: 'Total Events', value: events?.length ?? 0 },
                { icon: '🔴', label: 'Active', value: activeEvents.length },
                { icon: '📸', label: 'Total UGC', value: totalUploads.toLocaleString() },
                { icon: '👥', label: 'Sub-accounts', value: '—' },
              ].map(m => (
                <div key={m.label} className="px-5 py-5 text-center">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <p className="font-black text-xl text-[#0A4F6B]">{m.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Need custom integrations or a dedicated account manager?</p>
              <Link href="/contact" className="text-xs font-bold text-[#0A4F6B] hover:underline">Contact Enterprise Support →</Link>
            </div>
          </div>
        )}

        {/* ── Events list ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-display font-bold text-lg text-white">
              {isPlanner ? 'Client Events' : isBusiness ? 'Campaigns' : 'Your Events'}
            </h2>
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
                {isPlanner ? 'Add your first client event' : isBusiness ? 'Launch your first campaign' : 'Create your first event'}
              </h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                Set up a QR code in under 2 minutes. Guests scan, upload, and you collect every memory.
              </p>
              <Link href="/dashboard/events/new"
                className="inline-flex px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
                {isPlanner ? 'Create Client Event' : isBusiness ? 'Create Campaign' : 'Create Event'}
              </Link>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {events.map(event => {
                const pct = Math.round((event.upload_count / event.upload_limit) * 100)
                const isActive = event.status === 'active'
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-all group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-[#14B8A6] animate-pulse' : 'bg-white/20'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-[#14B8A6] transition-colors">
                        {event.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-white/40">
                          {event.upload_count}/{event.upload_limit} uploads
                        </p>
                        {event.event_date && (
                          <p className="text-xs text-white/25">
                            {new Date(event.event_date).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden w-36" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 text-[#14B8A6]"
                      style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}>
                      {event.plan.toUpperCase()}
                    </span>

                    <span className="text-white/30 group-hover:text-[#14B8A6] transition-colors text-lg">→</span>
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
