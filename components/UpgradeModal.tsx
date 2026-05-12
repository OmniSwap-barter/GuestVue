'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatNaira } from '@/lib/pricing'

// ─── Plan definitions ─────────────────────────────────────────────────────────
// Keep in sync with app/api/billing/checkout/route.ts PLAN_PRICES and lib/pricing.ts

const UPGRADE_PLANS = [
  {
    id: 'starter', accountType: 'planner', badge: null,
    name: 'Planner Starter', price: 53999, cadence: 'one-time',
    accent: '#14B8A6', highlight: false,
    tagline: 'For growing event professionals',
    perks: ['3 active events / month', '2,000 combined uploads', 'Bulk download', 'AI Reels included'],
  },
  {
    id: 'growth', accountType: 'planner', badge: 'Best value',
    name: 'Planner Growth', price: 94999, cadence: 'one-time',
    accent: '#14B8A6', highlight: true,
    tagline: 'Unlimited uploads, 5 events/mo',
    perks: ['5 active events / month', 'Unlimited uploads', 'Priority support', 'Advanced AI Reels ✦'],
  },
  {
    id: 'activation', accountType: 'business', badge: null,
    name: 'Business Activation', price: 53997, cadence: '/mo',
    accent: '#E8735C', highlight: false,
    tagline: 'Permanent QR for brands & venues',
    perks: ['2,000 uploads / month', 'Permanent rolling gallery', 'AI moderation', 'Cancel any time'],
  },
  {
    id: 'tycoon', accountType: 'business', badge: '🔥 Top Tier',
    name: 'Business Tycoon', price: 89995, cadence: '/mo',
    accent: '#E8735C', highlight: false,
    tagline: 'High-volume brands & agencies',
    perks: ['Unlimited uploads / month', 'Advanced AI Reels ✦', 'AI moderation', 'Cancel any time'],
  },
] as const

// ─── Checkmark icon ───────────────────────────────────────────────────────────
function Check({ color }: { color: string }) {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke={color} strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ─── Modal component ──────────────────────────────────────────────────────────
export function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planId: string, accountType: string) {
    setLoading(planId)
    try {
      // POST → /api/billing/checkout returns a redirect to Paystack.
      // We grab the final URL from res.url and navigate there so the
      // Supabase session cookie is preserved throughout.
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, accountType }),
        redirect: 'follow',
      })
      if (res.url && res.url !== window.location.href) {
        window.location.href = res.url
      } else {
        // Fallback: GET redirect (always works)
        window.location.href = `/api/billing/checkout?planId=${planId}&accountType=${accountType}`
      }
    } catch {
      window.location.href = `/api/billing/checkout?planId=${planId}&accountType=${accountType}`
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2 className="font-black text-2xl text-white">Upgrade your account</h2>
            <p className="text-white/50 text-sm mt-1">
              Pick a plan — you&apos;ll go straight to secure Paystack checkout.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none ml-4 mt-1"
          >
            ×
          </button>
        </div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 gap-4 p-6">
          {UPGRADE_PLANS.map(plan => (
            <div
              key={plan.id}
              className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
              style={{
                background: '#060D1A',
                border: plan.highlight
                  ? `2px solid ${plan.accent}`
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: plan.accent }} />

              {plan.badge && (
                <span
                  className="absolute top-3 right-3 text-white text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: plan.accent }}
                >
                  {plan.badge}
                </span>
              )}

              {/* Category pill */}
              <span
                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 w-fit"
                style={{
                  background: plan.accountType === 'planner'
                    ? 'rgba(20,184,166,0.15)' : 'rgba(232,115,92,0.15)',
                  color: plan.accent,
                }}
              >
                {plan.accountType === 'planner' ? '📋 Planner' : '🏢 Business'}
              </span>

              <p className="font-black text-lg text-white">{plan.name}</p>
              <p className="text-xs text-white/40 mb-3">{plan.tagline}</p>

              <div className="mb-4">
                <span className="font-black text-2xl" style={{ color: plan.accent }}>
                  {formatNaira(plan.price)}
                </span>
                <span className="text-white/40 text-sm"> {plan.cadence}</span>
              </div>

              <ul className="space-y-1.5 mb-5 flex-1">
                {plan.perks.map(p => (
                  <li key={p} className="flex items-start gap-2 text-xs text-white/70">
                    <Check color={plan.accent} />
                    {p}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id, plan.accountType)}
                disabled={loading === plan.id}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: plan.highlight ? plan.accent : 'rgba(255,255,255,0.10)' }}
              >
                {loading === plan.id ? '⏳ Redirecting to Paystack…' : `Get ${plan.name} →`}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-white/30">
            Want Flex or Pro for a single event?{' '}
            <Link href="/dashboard/events/new" className="text-[#14B8A6] hover:underline" onClick={onClose}>
              Create an event
            </Link>
            {' '}and select your plan there. ·{' '}
            <Link href="/pricing" className="hover:underline" onClick={onClose}>
              View all plans
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Hook — convenience wrapper so callers only need one import ───────────────
export function useUpgradeModal() {
  const [open, setOpen] = useState(false)
  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    modal: open ? <UpgradeModal onClose={() => setOpen(false)} /> : null,
  }
}
