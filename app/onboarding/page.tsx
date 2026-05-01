'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Data ─────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    emoji: '🎉',
    label: 'Individual Host',
    desc: 'Personal events: weddings, birthdays, graduations',
    free: true,
  },
  {
    id: 'planner',
    emoji: '📋',
    label: 'Event Planner',
    desc: 'Manage multiple client events professionally',
    free: false,
  },
  {
    id: 'business',
    emoji: '🏢',
    label: 'Business / Brand',
    desc: 'Corporate events, branded activations & campaigns',
    free: false,
  },
  {
    id: 'corporate',
    emoji: '🌐',
    label: 'Corporate',
    desc: 'Enterprise-scale event media management',
    free: false,
  },
] as const

const COUNTRIES = [
  { group: 'Primary Markets', options: ['Nigeria', 'Ghana'] },
  { group: 'Other African Countries', options: ['South Africa', 'Kenya', 'Rwanda', 'Uganda', 'Tanzania', 'Ethiopia', "Côte d'Ivoire", 'Cameroon', 'Senegal', 'Zimbabwe', 'Zambia', 'Mozambique'] },
  { group: 'Rest of World', options: ['United Kingdom', 'United States', 'Canada', 'France', 'Germany', 'Netherlands', 'Other'] },
]

type AccountType = 'individual' | 'planner' | 'business' | 'corporate'

// ─── Plan selection for paid account types ─────────────────────────────────────

const ACCOUNT_PLANS = {
  planner: [
    { id: 'planner_starter', label: 'Planner Starter', price: '₦49,999/mo', features: ['Up to 10 active events', 'Unlimited uploads per event', 'AI reels on all events', 'Basic client portal'], highlight: false },
    { id: 'planner_pro', label: 'Planner Pro', price: '₦99,999/mo', features: ['Unlimited events', 'Client sub-accounts', 'White-label branding', 'Priority support', 'Custom domain'], highlight: true },
  ],
  business: [
    { id: 'business_growth', label: 'Business Growth', price: '₦79,999/mo', features: ['20 events/month', 'Analytics dashboard', 'Brand kit & logo watermark', 'API access (1,000 calls/day)', 'Dedicated account manager'], highlight: false },
    { id: 'business_scale', label: 'Business Scale', price: '₦149,999/mo', features: ['Unlimited events', 'Advanced analytics', 'Full white-labeling', 'Unlimited API access', 'SLA guarantee'], highlight: true },
  ],
  corporate: [
    { id: 'corporate', label: 'Corporate Enterprise', price: 'Custom pricing', features: ['Unlimited everything', 'Dedicated infrastructure', 'Custom integrations', 'Multi-team management', 'On-site support'], highlight: true },
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState<'profile' | 'plan'>('profile')
  const [fullName, setFullName]       = useState('')
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [country, setCountry]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // Plan step state
  const [selectedPlan, setSelectedPlan] = useState('')
  const [payingForPlan, setPayingForPlan] = useState(false)

  // Pre-fill name from user metadata
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const name = user.user_metadata?.full_name as string | undefined
      if (name) setFullName(name)
    }
    load()
  }, [router])

  // ── Save profile (Frame 3) ─────────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!country) { setError('Please select your country.'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        plan_type: accountType,
        country,
        phone: user.user_metadata?.phone || null,
        onboarding_complete: accountType === 'individual', // only mark complete for free tier
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Failed to save profile. Please try again.')
      setSaving(false)
      return
    }

    // Individual → dashboard. Paid tiers → plan selection (Frame 4)
    if (accountType === 'individual') {
      router.push('/dashboard')
    } else {
      setStep('plan')
      setSaving(false)
    }
  }

  // ── Skip plan / go free for now ────────────────────────────────────────
  async function handleSkipPlan() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await (supabase as any).from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    router.push('/dashboard')
  }

  // ── Subscribe (Frame 4) ────────────────────────────────────────────────
  async function handleSubscribe() {
    if (!selectedPlan) { setError('Please select a plan.'); return }
    setPayingForPlan(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/onboarding/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ planId: selectedPlan, accountType }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || 'Could not start checkout. Please try again.')
        setPayingForPlan(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setPayingForPlan(false)
    }
  }

  // ── Frame 4: Plan selection ──────────────────────────────────────────────
  if (step === 'plan') {
    const plans = ACCOUNT_PLANS[accountType as keyof typeof ACCOUNT_PLANS] ?? []
    const typeLabel = ACCOUNT_TYPES.find(t => t.id === accountType)?.label ?? accountType

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="GuestVue" width={40} height={40} priority />
              <span className="font-display font-black text-white text-xl tracking-tight">GuestVue</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-7 shadow-2xl">
            {/* Header */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => { setStep('profile'); setSelectedPlan(''); setError('') }}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                ← Back to profile
              </button>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A4F6B] bg-[#0A4F6B]/10 px-3 py-1.5 rounded-full mb-3">
                STEP 2 OF 2
              </div>
              <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Choose your {typeLabel} plan</h2>
              <p className="text-sm text-gray-500">Start with what you need — upgrade or cancel anytime.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

            {/* Plan cards */}
            <div className={`grid gap-4 mb-6 ${plans.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {plans.map(plan => (
                <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 shadow-md'
                      : 'border-gray-100 hover:border-gray-300 bg-gray-50'
                  }`}>
                  {plan.highlight && (
                    <span className="absolute -top-2.5 left-4 text-xs font-bold bg-gradient-to-r from-[#14B8A6] to-[#1E5AAF] text-white px-3 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                  <p className="font-display font-bold text-lg text-gray-900 mb-0.5">{plan.label}</p>
                  <p className="text-[#0A4F6B] font-bold text-sm mb-3">{plan.price}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-[#14B8A6] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Actions */}
            {accountType === 'corporate' ? (
              <a href="mailto:hello@theguestvue.com?subject=Corporate%20Plan%20Enquiry"
                className="block w-full text-center text-white font-bold py-3.5 rounded-xl text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #0A4F6B, #1E5AAF)' }}>
                Contact us for enterprise pricing →
              </a>
            ) : (
              <button onClick={handleSubscribe} disabled={!selectedPlan || payingForPlan}
                className="w-full disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
                {payingForPlan ? 'Redirecting to payment…' : 'Subscribe & activate →'}
              </button>
            )}

            <button onClick={handleSkipPlan} disabled={saving}
              className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3 py-2 transition-colors">
              {saving ? 'Saving…' : 'Skip for now — start on free plan'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Frame 3: Profile completion ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.svg" alt="GuestVue" width={40} height={40} priority />
            <span className="font-display font-black text-white text-xl tracking-tight">GuestVue</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-2xl border-t-4 border-[#14B8A6]">
          {/* Progress */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A4F6B] bg-[#0A4F6B]/10 px-3 py-1.5 rounded-full mb-5">
            STEP 1 OF 1
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Complete your profile</h1>
          <p className="text-sm text-gray-500 mb-6">
            Let us get your account set up so you can start creating events.
          </p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

          <form onSubmit={handleProfileSave} className="space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Amaka Okafor"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm" />
            </div>

            {/* Account type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNT_TYPES.map(type => (
                  <button key={type.id} type="button" onClick={() => setAccountType(type.id as AccountType)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                      accountType === type.id
                        ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300 bg-gray-50'
                    }`}>
                    <span className="text-xl mb-1.5">{type.emoji}</span>
                    <span className={`text-sm font-bold leading-tight ${accountType === type.id ? 'text-[#0A4F6B]' : 'text-gray-800'}`}>
                      {type.label}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5 leading-snug">{type.desc}</span>
                    {!type.free && (
                      <span className="mt-1.5 self-start text-xs font-semibold text-[#E8735C]">Subscription required</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
              <select required value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm bg-white">
                <option value="" disabled>Select a country…</option>
                {COUNTRIES.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <button type="submit" disabled={saving || !country}
              className="w-full disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
              {saving ? 'Saving…' : accountType === 'individual' ? 'Complete setup →' : 'Continue to plan selection →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
