'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatNaira } from '@/lib/pricing'
import SignOutButton from './SignOutButton'

// ─── Upgrade plan picker modal ────────────────────────────────────────────────
// Shown when a free user clicks "Upgrade". Bypasses /pricing entirely —
// clicking a plan button immediately POSTs to /api/billing/checkout and
// follows the redirect to Paystack. No sign-in or sign-up screens appear
// because the user is already authenticated.

const UPGRADE_PLANS = [
  // ── Planner bundles (one-time, account-level) ──────────────────────────────
  {
    id: 'starter', accountType: 'planner', badge: null,
    name: 'Planner Starter', priceLabel: '₦53,999', cadence: 'one-time',
    accent: '#14B8A6',
    highlight: false,
    tagline: 'For growing event professionals',
    perks: ['3 active events / month', '2,000 combined uploads', 'Bulk download', 'AI Reels included'],
  },
  {
    id: 'growth', accountType: 'planner', badge: 'Best value',
    name: 'Planner Growth', priceLabel: '₦94,999', cadence: 'one-time',
    accent: '#14B8A6',
    highlight: true,
    tagline: 'Unlimited uploads, 5 events/mo',
    perks: ['5 active events / month', 'Unlimited uploads', 'Priority support', 'Advanced AI Reels ✦'],
  },
  // ── Business subscriptions (monthly) ───────────────────────────────────────
  {
    id: 'activation', accountType: 'business', badge: null,
    name: 'Business Activation', priceLabel: '₦53,997', cadence: '/mo',
    accent: '#E8735C',
    highlight: false,
    tagline: 'Permanent QR for brands & venues',
    perks: ['2,000 uploads / month', 'Permanent rolling gallery', 'AI moderation', 'Cancel any time'],
  },
  {
    id: 'tycoon', accountType: 'business', badge: '🔥 Top Tier',
    name: 'Business Tycoon', priceLabel: '₦89,995', cadence: '/mo',
    accent: '#E8735C',
    highlight: false,
    tagline: 'High-volume brands & agencies',
    perks: ['Unlimited uploads / month', 'Advanced AI Reels ✦', 'AI moderation', 'Cancel any time'],
  },
]

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planId: string, accountType: string) {
    setLoading(planId)
    try {
      // POST → /api/billing/checkout returns a redirect to Paystack.
      // fetch follows the redirect automatically; we grab the final URL and
      // navigate the browser there so the Supabase session cookie is preserved.
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, accountType }),
        redirect: 'follow',
      })
      // If fetch followed a redirect to Paystack, res.url is the Paystack URL
      if (res.url && res.url !== window.location.href) {
        window.location.href = res.url
      } else {
        // Fallback: GET method (always works for redirect chains)
        window.location.href = `/api/billing/checkout?planId=${planId}&accountType=${accountType}`
      }
    } catch {
      window.location.href = `/api/billing/checkout?planId=${planId}&accountType=${accountType}`
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.10)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="font-black text-2xl text-white">Upgrade your account</h2>
            <p className="text-white/50 text-sm mt-1">
              Choose a plan — you&apos;ll go straight to secure Paystack checkout. No extra steps.
            </p>
          </div>
          <button onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none ml-4 mt-1">
            ×
          </button>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 gap-4 p-6">
          {UPGRADE_PLANS.map(plan => (
            <div key={plan.id}
              className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
              style={{
                background: '#060D1A',
                border: plan.highlight
                  ? `2px solid ${plan.accent}`
                  : '1px solid rgba(255,255,255,0.08)',
              }}>
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: plan.accent }} />

              {plan.badge && (
                <span className="absolute top-3 right-3 text-white text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: plan.accent }}>
                  {plan.badge}
                </span>
              )}

              {/* Category pill */}
              <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 w-fit"
                style={{
                  background: plan.accountType === 'planner'
                    ? 'rgba(20,184,166,0.15)' : 'rgba(232,115,92,0.15)',
                  color: plan.accent,
                }}>
                {plan.accountType === 'planner' ? '📋 Planner' : '🏢 Business'}
              </span>

              <p className="font-black text-lg text-white">{plan.name}</p>
              <p className="text-xs text-white/40 mb-3">{plan.tagline}</p>

              <div className="mb-4">
                <span className="font-black text-2xl" style={{ color: plan.accent }}>{plan.priceLabel}</span>
                <span className="text-white/40 text-sm"> {plan.cadence}</span>
              </div>

              <ul className="space-y-1.5 mb-5 flex-1">
                {plan.perks.map(p => (
                  <li key={p} className="flex items-start gap-2 text-xs text-white/70">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke={plan.accent} strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id, plan.accountType)}
                disabled={loading === plan.id}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: plan.highlight ? plan.accent : 'rgba(255,255,255,0.10)' }}>
                {loading === plan.id ? '⏳ Redirecting to Paystack…' : `Get ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-white/30">
            Want Flex or Pro for a single event?{' '}
            <Link href="/dashboard/events/new" className="text-[#14B8A6] hover:underline" onClick={onClose}>
              Create an event
            </Link>
            {' '}and select your plan there. ·{' '}
            <Link href="/pricing" className="hover:underline" onClick={onClose}>View all plans</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

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
    <div className="min-h-screen" style={{ background: '#060D1A' }}>
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
            <div className="grid sm:grid-cols-4" style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
