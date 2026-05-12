'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS, BUSINESS_PLANS, PLANNER_PLANS, formatNaira } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'
import { useUpgradeModal } from '@/components/UpgradeModal'

interface Props {
  userId: string
  planType: string
  isUnlimited?: boolean
}

type EventPlan = 'free' | 'flex' | 'pro'
type PlanCategory = 'personal' | 'business' | 'vendor' | 'enterprise'
type WizardStep = 'type' | 'details' | 'plan' | 'loading' | 'success'

const EVENT_TYPES = [
  { id: 'wedding',    emoji: '💍', label: 'Wedding' },
  { id: 'birthday',  emoji: '🎂', label: 'Birthday' },
  { id: 'corporate', emoji: '🏢', label: 'Corporate' },
  { id: 'graduation',emoji: '🎓', label: 'Graduation' },
  { id: 'baby',      emoji: '👶', label: 'Baby Shower' },
  { id: 'funeral',   emoji: '🕊️', label: 'Funeral / Burial' },
  { id: 'party',     emoji: '🎉', label: 'House Party' },
  { id: 'other',     emoji: '✨', label: 'Other' },
]

const LOADING_MESSAGES = [
  'Setting up your event…',
  'Generating your QR code…',
  'Almost ready…',
]

export default function CreateEventForm({ userId, planType, isUnlimited = false }: Props) {
  const router = useRouter()
  const upgrade = useUpgradeModal()

  // Paid subscription types get events without per-event payment
  const isPaidSubscriber =
    isUnlimited ||
    planType === 'planner' ||
    planType === 'business' ||
    planType === 'corporate'

  // Wizard state
  const [step, setStep]             = useState<WizardStep>('type')
  const [eventType, setEventType]   = useState('')
  const [name, setName]             = useState('')
  const [eventDate, setEventDate]   = useState('')
  const [hashtag, setHashtag]       = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [plan, setPlan]             = useState<EventPlan>('free')
  const [planCategory, setPlanCategory] = useState<PlanCategory>('personal')

  // Submission state
  const [loading, setLoading]         = useState(false)
  const [loadingMsg, setLoadingMsg]   = useState(LOADING_MESSAGES[0])
  const [error, setError]             = useState('')
  const [createdEventId, setCreatedEventId] = useState('')
  const [paymentUrl, setPaymentUrl]   = useState<string | null>(null)

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function nextStep() {
    setError('')
    if (step === 'type')    setStep('details')
    if (step === 'details') {
      // Paid subscribers (planner/business/corporate or unlimited flag) skip
      // the plan selection — their subscription covers the event cost.
      if (isPaidSubscriber) {
        setPlan('free')
        handleSubmit()
      } else {
        setStep('plan')
      }
    }
    if (step === 'plan')    handleSubmit()
  }

  function prevStep() {
    setError('')
    if (step === 'details') setStep('type')
    if (step === 'plan')    setStep('details')
  }

  function canProceed() {
    if (step === 'type')    return !!eventType
    if (step === 'details') return name.trim().length > 0
    if (step === 'plan')    return true
    return false
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true)
    setStep('loading')
    setError('')

    // Cycle loading messages for perceived progress
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIdx])
    }, 1200)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          event_date: eventDate || null,
          hashtag: hashtag.replace(/^#/, '') || null,
          plan,
          event_type: eventType,
          guest_count: guestCount ? parseInt(guestCount, 10) : null,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error || 'Failed to create event.')
        setStep('plan')
        return
      }

      setCreatedEventId(body.event.id)
      setPaymentUrl(body.paymentUrl || null)

      // Brief pause so the loading screen feels intentional
      await new Promise(r => setTimeout(r, 800))
      setStep('success')
    } finally {
      clearInterval(msgInterval)
      setLoading(false)
    }
  }

  // ─── Step 1: Event type ───────────────────────────────────────────────────
  if (step === 'type') {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h2 className="font-display font-bold text-midnight-900 text-xl mb-1">What type of event?</h2>
          <p className="text-sm text-midnight-400">We'll personalise the experience for your guests.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {EVENT_TYPES.map(et => (
            <button
              key={et.id}
              type="button"
              onClick={() => setEventType(et.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                eventType === et.id
                  ? 'border-ocean bg-ocean/5 shadow-md'
                  : 'border-midnight-100 hover:border-midnight-200 bg-white'
              }`}
            >
              <span className="text-3xl">{et.emoji}</span>
              <span className={`text-xs font-semibold leading-snug text-center ${
                eventType === et.id ? 'text-ocean' : 'text-midnight-700'
              }`}>{et.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!canProceed()}
          onClick={nextStep}
          className="w-full bg-ocean hover:bg-ocean-600 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all shadow-brand text-base"
        >
          Continue →
        </button>
      </div>
    )
  }

  // ─── Step 2: Event details ────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 text-sm text-midnight-400 hover:text-midnight-700 mb-5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="mb-6">
          <h2 className="font-display font-bold text-midnight-900 text-xl mb-1">Tell us about the event</h2>
          <p className="text-sm text-midnight-400">You can always update these details later.</p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-midnight-700 mb-2">
              Event name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                eventType === 'wedding' ? "Amaka & Chidi's Wedding" :
                eventType === 'birthday' ? "Tayo's 30th Birthday" :
                eventType === 'corporate' ? "Q3 All-Hands 2025" :
                "Event name"
              }
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-midnight-700 mb-2">
                Event date <span className="text-midnight-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-midnight-700 mb-2">
                Expected guests <span className="text-midnight-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
                placeholder="e.g. 150"
                className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-midnight-700 mb-2">
              Event hashtag <span className="text-midnight-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400 text-sm font-bold select-none">#</span>
              <input
                type="text"
                value={hashtag}
                onChange={e => setHashtag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="AmakaNChidi2025"
                maxLength={40}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
              />
            </div>
            <p className="text-xs text-midnight-400 mt-1">Shown on the guest upload page and AI reels.</p>
          </div>
        </div>

        <button
          type="button"
          disabled={!canProceed()}
          onClick={nextStep}
          className="w-full bg-ocean hover:bg-ocean-600 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all shadow-brand text-base"
        >
          Continue →
        </button>
      </div>
    )
  }

  // ─── Step 3: Plan selector ────────────────────────────────────────────────
  const PLAN_CATEGORIES: { id: PlanCategory; icon: string; label: string; sub: string }[] = [
    { id: 'personal',   icon: '🎟', label: 'Per Event',  sub: 'One-time payment'     },
    { id: 'business',   icon: '🏢', label: 'Business',   sub: 'Monthly subscription' },
    { id: 'vendor',     icon: '👔', label: 'Vendor',     sub: 'Multi-event bundle'   },
    { id: 'enterprise', icon: '🌟', label: 'Enterprise', sub: 'White-label & custom' },
  ]

  const personalPlanOptions = [
    {
      id: 'free' as EventPlan,
      label: PLANS.free.name,
      price: '₦0',
      sub: `${PLANS.free.uploads} uploads · 24-hr active page · 7-day storage`,
      badge: undefined as string | undefined,
      star: true,
    },
    {
      id: 'flex' as EventPlan,
      label: PLANS.flex.name,
      price: formatNaira(PLANS.flex.price),
      sub: `${PLANS.flex.uploads} uploads · 30-day page · AI reel + slideshow`,
      badge: 'Popular',
      star: false,
    },
    {
      id: 'pro' as EventPlan,
      label: PLANS.pro.name,
      price: formatNaira(PLANS.pro.price),
      sub: 'Unlimited · 90-day page · AI Pro Reel · content moderation',
      badge: undefined,
      star: false,
    },
  ]

  if (step === 'plan') {
    return (
      <div className="animate-fade-in">
        {upgrade.modal}
        {/* Back */}
        <button type="button" onClick={prevStep}
          className="flex items-center gap-1.5 text-sm text-midnight-400 hover:text-midnight-700 mb-5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="mb-5">
          <h2 className="font-display font-bold text-midnight-900 text-xl mb-1">Choose a plan</h2>
          <p className="text-sm text-midnight-400">Start free — no credit card needed. Upgrade any time.</p>
        </div>

        {/* ── Category tabs ── */}
        <div className="grid grid-cols-4 gap-1 mb-5 bg-midnight-50 rounded-xl p-1">
          {PLAN_CATEGORIES.map(cat => (
            <button key={cat.id} type="button"
              onClick={() => setPlanCategory(cat.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all ${
                planCategory === cat.id ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <span className="text-base mb-0.5">{cat.icon}</span>
              <span className={`text-[11px] font-bold leading-none ${planCategory === cat.id ? 'text-ocean' : 'text-midnight-500'}`}>
                {cat.label}
              </span>
              <span className="text-[9px] text-midnight-400 leading-tight mt-0.5 hidden sm:block">{cat.sub}</span>
            </button>
          ))}
        </div>

        {/* ── Per Event (personal) ── */}
        {planCategory === 'personal' && (
          <div>
            <div className="flex items-start gap-2.5 bg-ocean/5 border border-ocean/20 rounded-xl px-4 py-3 mb-4">
              <span className="text-base flex-shrink-0 mt-0.5">✨</span>
              <p className="text-xs text-ocean leading-relaxed">
                <strong>Try free first</strong> — collect up to 50 memories with zero commitment.
                See how your guests love it, then upgrade when you need more.
              </p>
            </div>
            <div className="grid gap-3 mb-4">
              {personalPlanOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => setPlan(opt.id)}
                  className={`relative text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    plan === opt.id ? 'border-ocean bg-ocean/5 shadow-md' : 'border-midnight-100 hover:border-midnight-200 bg-white'
                  }`}
                >
                  {opt.badge && (
                    <span className="absolute -top-2.5 right-4 text-xs bg-coral text-white font-bold px-2.5 py-0.5 rounded-full shadow">
                      {opt.badge}
                    </span>
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    plan === opt.id ? 'border-ocean' : 'border-midnight-300'
                  }`}>
                    {plan === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-ocean" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${plan === opt.id ? 'text-ocean' : 'text-midnight-800'}`}>{opt.label}</span>
                      <span className={`font-display font-black text-base ${plan === opt.id ? 'text-ocean' : 'text-midnight-900'}`}>{opt.price}</span>
                      {opt.star && (
                        <span className="text-[10px] font-bold text-ocean bg-ocean/10 px-1.5 py-0.5 rounded-full">Recommended start</span>
                      )}
                    </div>
                    <p className="text-xs text-midnight-400 mt-0.5">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            {plan !== 'free' && (
              <p className="text-xs text-midnight-400 mb-4 text-center">
                You&apos;ll be taken to Paystack to complete payment after creation.
              </p>
            )}
          </div>
        )}

        {/* ── Business / Brand Monthly ── */}
        {planCategory === 'business' && (
          <div className="space-y-3 mb-4">
            <div className="bg-midnight-50 rounded-xl px-4 py-3">
              <p className="text-xs text-midnight-600 leading-relaxed">
                <strong>Permanent QR code + rolling gallery</strong> — always on, always collecting content from your customers.
                Perfect for restaurants, clubs, gyms, and brands. Billed monthly, cancel any time.
              </p>
            </div>
            {([
              { bp: BUSINESS_PLANS.activation, features: ['2,000 uploads/month', 'Permanent QR + rolling gallery', 'Basic AI reel', 'Live slideshow', 'AI content moderation'], highlight: false },
              { bp: BUSINESS_PLANS.tycoon,     features: ['Unlimited uploads/month', 'Permanent QR + rolling gallery', 'Advanced AI reel ✓', 'Live slideshow', 'AI moderation', 'Advanced customisation'], highlight: true },
            ]).map(({ bp, features, highlight }) => (
              <div key={bp.id} className={`bg-white rounded-2xl border-2 px-5 py-4 ${highlight ? 'border-ocean/40' : 'border-midnight-100'}`}>
                <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                  <span className="font-bold text-midnight-900">{bp.name}</span>
                  <div><span className="font-black text-midnight-900">{formatNaira(bp.price)}</span><span className="text-xs text-midnight-400 font-medium">/mo</span></div>
                </div>
                <ul className="text-xs text-midnight-500 space-y-1">
                  {features.map(f => <li key={f} className="flex items-center gap-1.5"><span className="text-ocean font-bold">✓</span>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ── Vendor / Planner Bundles ── */}
        {planCategory === 'vendor' && (
          <div className="space-y-3 mb-4">
            <div className="bg-midnight-50 rounded-xl px-4 py-3">
              <p className="text-xs text-midnight-600 leading-relaxed">
                <strong>One-time purchase.</strong> Buy once and run multiple events without paying per event — built for planners, photographers, and agencies.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { vp: PLANNER_PLANS.starter, features: ['3 events/month', '2,000 combined uploads', 'All Flex features'], best: false, top: false },
                { vp: PLANNER_PLANS.growth,  features: ['5 events/month', 'Unlimited uploads', 'All Pro features'],       best: true,  top: false },
                { vp: PLANNER_PLANS.scale,   features: ['10 events/month', 'Unlimited uploads', 'Free welcome forms'],    best: false, top: false },
                { vp: PLANNER_PLANS.jagaban, features: ['20 events/month', 'Unlimited uploads', 'White-label ✓'],         best: false, top: true  },
              ]).map(({ vp, features, best, top }) => (
                <div key={vp.id} className={`bg-white rounded-2xl border-2 px-4 py-3 relative ${best ? 'border-ocean/40' : 'border-midnight-100'}`}>
                  {best && <span className="absolute -top-2 left-3 text-[10px] bg-ocean text-white font-black px-2 py-0.5 rounded-full">Best value</span>}
                  {top  && <span className="absolute -top-2 left-3 text-[10px] bg-coral text-white font-black px-2 py-0.5 rounded-full">🔥 Top tier</span>}
                  <p className="font-bold text-sm text-midnight-900 mb-0.5">{vp.name}</p>
                  <p className="font-black text-base text-midnight-900 mb-2">{formatNaira(vp.price)}</p>
                  <ul className="text-[11px] text-midnight-500 space-y-0.5">
                    {features.map(f => <li key={f} className="flex items-center gap-1"><span className="text-ocean text-[10px] font-bold">✓</span>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Enterprise ── */}
        {planCategory === 'enterprise' && (
          <div className="mb-4">
            <div className="rounded-2xl p-6 text-white text-center" style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0A4F6B 100%)' }}>
              <div className="text-4xl mb-3">🌟</div>
              <h3 className="font-black text-lg mb-2">Enterprise & White-Label</h3>
              <p className="text-white/70 text-xs leading-relaxed mb-1 max-w-xs mx-auto">
                Custom domain, white-label branding, dedicated human moderation, agency pricing, and tailored onboarding for large brands and agencies.
              </p>
              <p className="text-white/50 text-[11px] mb-5">Pricing on request — we&apos;ll design a plan around your volume.</p>
              <a href="/contact" target="_blank" rel="noopener noreferrer"
                className="inline-block bg-white text-midnight-900 font-black text-sm px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg">
                Contact us for a quote →
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {/* ── CTA ── */}
        {planCategory === 'personal' ? (
          <button type="button" disabled={loading} onClick={nextStep}
            className="w-full bg-ocean hover:bg-ocean-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-brand text-base">
            {plan === 'free' ? 'Create Event Free →' : 'Create & Proceed to Payment →'}
          </button>
        ) : (
          <div className="space-y-3">
            <button type="button"
              onClick={upgrade.show}
              className="block w-full text-center bg-ocean hover:bg-ocean-600 text-white font-bold py-4 rounded-xl transition-all shadow-brand text-base">
              See full pricing & get started →
            </button>
            <button type="button"
              onClick={() => { setPlanCategory('personal'); setPlan('free') }}
              className="w-full text-sm text-midnight-400 hover:text-midnight-600 transition-colors py-2">
              Or start with the free plan for now →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Step 4: Loading ──────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        {/* Spinning ring */}
        <div className="relative w-20 h-20 mb-6">
          <svg className="animate-spin w-20 h-20 text-ocean" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" strokeDasharray="160" strokeDashoffset="100" strokeLinecap="round" opacity="0.2" />
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" strokeDasharray="60" strokeDashoffset="0" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl">✨</span>
        </div>
        <p className="font-semibold text-midnight-700 text-base">{loadingMsg}</p>
        <p className="text-xs text-midnight-400 mt-1">This takes just a moment</p>
      </div>
    )
  }

  // ─── Step 5: Success ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-10 animate-fade-in">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-ocean/10 flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-ocean" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-display font-bold text-midnight-900 text-2xl mb-2">Event created! 🎉</h2>
        <p className="text-sm text-midnight-500 mb-6 max-w-xs leading-relaxed">
          <strong className="text-midnight-800">{name}</strong> is ready.
          {paymentUrl
            ? ' Complete payment to activate it and start collecting memories.'
            : ' Share your QR code and start collecting memories.'}
        </p>

        {paymentUrl ? (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <a
              href={paymentUrl}
              className="block w-full bg-ocean text-white font-bold py-4 rounded-xl text-center hover:bg-ocean-600 transition-all shadow-brand"
            >
              Complete Payment →
            </a>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/events/${createdEventId}`)}
              className="text-sm text-midnight-400 hover:text-midnight-600 transition-colors"
            >
              Skip for now, set up event →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/events/${createdEventId}`)}
            className="bg-ocean text-white font-bold px-8 py-4 rounded-xl hover:bg-ocean-600 transition-all shadow-brand"
          >
            Go to my event →
          </button>
        )}
      </div>
    )
  }

  return null
}
