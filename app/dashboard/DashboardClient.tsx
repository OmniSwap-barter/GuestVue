'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatNaira } from '@/lib/pricing'
import SignOutButton from './SignOutButton'
import { UpgradeModal } from '@/components/UpgradeModal'

interface EventRow {
  id: string
  name: string
  status: string
  upload_count: number
  upload_limit: number
  event_date: string | null
  plan: string
}

interface Props {
  firstName: string
  planType: string
  events: EventRow[]
  activeEventCount: number
  totalUploads: number
  onboarded: string | undefined
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual Host',
  planner:    'Event Planner',
  business:   'Business / Brand',
  corporate:  'Corporate',
}

export default function DashboardClient({
  firstName,
  planType,
  events,
  activeEventCount,
  totalUploads,
  onboarded,
}: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  const isFree     = planType === 'individual'
  const isPlanner  = planType === 'planner'
  const isBusiness = planType === 'business'
  const isCorporate = planType === 'corporate'
  const planLabel  = ACCOUNT_TYPE_LABELS[planType] ?? (planType.charAt(0).toUpperCase() + planType.slice(1))

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#060D1A' }}>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

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
            {/* Account type identity chip */}
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
            { label: 'Active Events', value: activeEventCount, color: '#14B8A6' },
            { label: 'Total Events',  value: events.length,    color: '#14B8A6' },
            { label: 'Photos Collected', value: totalUploads.toLocaleString(), color: '#E8735C' },
            { label: 'Plan',          value: planLabel,         color: '#E8735C' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4"
              style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="font-display font-black text-2xl" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-white/50 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className={`grid gap-3 mb-8 ${isBusiness || isCorporate ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
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
                  Planner bundles, Business plans, and more — pick a plan and go straight to checkout.
                </p>
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex-shrink-0 bg-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-all"
                style={{ color: '#0A4F6B' }}>
                Upgrade →
              </button>
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
            <div className="rounded-2xl p-5" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Event Pipeline</h3>
                <Link href="/dashboard/events/new" className="text-xs font-bold text-[#14B8A6] hover:underline">+ New</Link>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Active',        count: activeEventCount,              color: '#14B8A6' },
                  { label: 'Total Managed', count: events.length,                 color: '#1E5AAF' },
                  { label: 'Total Uploads', count: totalUploads.toLocaleString(), color: '#E8735C' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-sm text-white/50">{item.label}</span>
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
            <div className="sm:col-span-2 rounded-2xl p-5" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Content Overview</h3>
                <span className="text-xs text-white/30">All time</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Events Created',   value: events.length,                 icon: '📅', color: '#14B8A6' },
                  { label: 'Active Campaigns', value: activeEventCount,              icon: '🔴', color: '#14B8A6' },
                  { label: 'UGC Collected',    value: totalUploads.toLocaleString(), icon: '📸', color: '#E8735C' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <p className="font-black text-xl" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs text-white/30">Full analytics dashboard coming soon</p>
                <Link href="/dashboard/analytics" className="text-xs font-bold text-[#14B8A6] hover:underline">View →</Link>
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🏷️</span>
                  <p className="font-bold text-sm text-white">White-Label</p>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,115,92,0.15)', color: '#E8735C' }}>Soon</span>
                </div>
                <p className="text-xs text-white/40">Your brand, your QR codes.</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔌</span>
                  <p className="font-bold text-sm text-white">API Access</p>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,115,92,0.15)', color: '#E8735C' }}>Soon</span>
                </div>
                <p className="text-xs text-white/40">Webhooks &amp; CRM sync.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CORPORATE: Enterprise overview ───────────────────────────────── */}
        {isCorporate && (
          <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #060d1a, #0A4F6B)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 className="font-bold text-white">Enterprise Dashboard</h3>
                <p className="text-white/50 text-xs">Corporate account — full platform access</p>
              </div>
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)' }}>
                Corporate
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { icon: '📅', label: 'Total Events', value: events.length },
                { icon: '🔴', label: 'Active',        value: activeEventCount },
                { icon: '📸', label: 'Total UGC',     value: totalUploads.toLocaleString() },
                { icon: '👥', label: 'Sub-accounts',  value: '—' },
              ].map((m, i) => (
                <div key={m.label} className="px-5 py-5 text-center" style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <p className="font-black text-xl" style={{ color: '#14B8A6' }}>{m.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-xs text-white/40">Need custom integrations or a dedicated account manager?</p>
              <Link href="/contact" className="text-xs font-bold text-[#14B8A6] hover:underline">Contact Enterprise Support →</Link>
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

          {events.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="text-5xl mb-4">🎊</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">
                {isPlanner ? 'Add your first client event' : isBusiness ? 'Launch your first campaign' : 'Create your first event'}
              </h3>
              <p className="text-sm text-white/40 mb-6 max-w-xs mx-auto">
                Set up a QR code in under 2 minutes. Guests scan, upload, and you collect every memory.
              </p>
              <Link href="/dashboard/events/new"
                className="inline-flex px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
                {isPlanner ? 'Create Client Event' : isBusiness ? 'Create Campaign' : 'Create Event'}
              </Link>
            </div>
          ) : (
            <div>
              {events.map(event => {
                const pct = Math.round((event.upload_count / event.upload_limit) * 100)
                const isActive = event.status === 'active'
                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center gap-3 px-4 sm:px-5 py-4 transition-all group"
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
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden w-full max-w-[9rem]" style={{ background: 'rgba(255,255,255,0.08)' }}>
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

                    {/* Plan badge — hidden on smallest screens to prevent overflow */}
                    <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 text-[#14B8A6]"
                      style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}>
                      {event.plan.toUpperCase()}
                    </span>

                    <span className="text-white/30 group-hover:text-[#14B8A6] transition-colors flex-shrink-0">→</span>
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
