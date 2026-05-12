'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatNaira, PLANS, BUSINESS_PLANS, PLANNER_PLANS, ADDONS } from '@/lib/pricing'

// ─── Icons ───────────────────────────────────────────────────────────────────

const Check = ({ accent = '#14B8A6' }: { accent?: string }) => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke={accent} strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const X = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ─── Client Component ─────────────────────────────────────────────────────────

export default function PricingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  // Authenticated users → directly to Paystack checkout (session intact)
  // Unauthenticated → login page (NEVER signup — existing accounts get stuck)
  function planHref(planId: string, accountType: string): string {
    if (!isLoggedIn) return `/auth/login?next=/pricing`
    return `/api/billing/checkout?planId=${planId}&accountType=${accountType}`
  }

  // Flex/Pro are per-event plans chosen at event creation
  function eventPlanHref(): string {
    if (!isLoggedIn) return `/auth/login?next=/dashboard/events/new`
    return `/dashboard/events/new`
  }

  return (
    <div className="min-h-screen" style={{ background: '#060D1A' }}>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{ background: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/"><Logo size={30} /></Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard"
                className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/login"
                  className="text-sm font-semibold text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  Sign in
                </Link>
                <Link href="/auth/signup"
                  className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
                  Start free — no card needed
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #060D1A 0%, #0A1628 40%, #0A4F6B 100%)' }}>
        <div className="inline-flex items-center gap-2 border border-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
          No credit card required to start
        </div>
        <h1 className="font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
          Try it free.<br />
          <span style={{ color: '#14B8A6' }}>Upgrade when you love it.</span>
        </h1>
        <p className="text-white/60 text-base max-w-xl mx-auto mb-8">
          GuestVue collects your guests&apos; photos and videos instantly via QR code — no app download needed. Start completely free, then upgrade if you need more.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={isLoggedIn ? '/dashboard/events/new' : '/auth/signup'}
            className="inline-block font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl text-base text-white"
            style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
            {isLoggedIn ? 'Create a new event →' : 'Create your first event free →'}
          </Link>
          <a href="#plans"
            className="inline-block border text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/5 transition-all text-base"
            style={{ borderColor: 'rgba(255,255,255,0.20)' }}>
            See all plans ↓
          </a>
        </div>
        <p className="text-white/30 text-xs mt-4">50 uploads · 24-hour page · QR code included. No commitment.</p>
      </section>

      {/* ── Social proof strip ─────────────────────────────────────────── */}
      <div className="py-4 px-4 text-center" style={{ background: '#0A1628', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-sm text-white/50">
          💍 <strong className="text-white/70">Weddings</strong> &nbsp;·&nbsp; 🎂 <strong className="text-white/70">Birthdays</strong> &nbsp;·&nbsp; 🏢 <strong className="text-white/70">Corporates</strong> &nbsp;·&nbsp; 🎓 <strong className="text-white/70">Graduations</strong> &nbsp;·&nbsp; 🎉 <strong className="text-white/70">Parties</strong> &nbsp;·&nbsp; 🍽️ <strong className="text-white/70">Restaurants</strong> &nbsp;·&nbsp; 🎤 <strong className="text-white/70">Concerts</strong>
        </p>
      </div>

      <main id="plans" className="max-w-6xl mx-auto px-4 py-16 space-y-24">

        {/* ── Section jump links ─────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { href: '#personal',   label: '🎉 Personal Events',   color: '#14B8A6' },
            { href: '#vendor',     label: '📸 Vendor Bundles',    color: '#14B8A6' },
            { href: '#business',   label: '🏢 Business Monthly',  color: '#E8735C' },
            { href: '#enterprise', label: '🌐 Enterprise',        color: 'rgba(255,255,255,0.60)' },
          ].map(({ href, label, color }) => (
            <a key={href} href={href}
              className="text-sm font-bold px-4 py-2 rounded-full transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color }}>
              {label}
            </a>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PERSONAL PLANS                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="personal">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
              style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.25)' }}>
              For individuals
            </span>
            <h2 className="font-black text-2xl sm:text-3xl text-white mb-2">Personal Event Plans</h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">One-time payment per event. No subscriptions, no recurring charges. Start free and upgrade anytime — even after your event is live.</p>
          </div>

          {/* Free plan — hero card */}
          <div className="rounded-3xl p-8 mb-6 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0A4F6B 0%, #1E5AAF 100%)' }}>
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="absolute right-16 bottom-0 w-32 h-32 rounded-full translate-y-1/2" style={{ background: 'rgba(20,184,166,0.15)' }} />
            <div className="relative max-w-2xl">
              <span className="inline-block text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider"
                style={{ background: '#14B8A6' }}>
                Start here — It&apos;s free
              </span>
              <h3 className="font-black text-3xl mb-2">Free Plan</h3>
              <p className="text-white/70 mb-4 text-sm max-w-md">
                Try GuestVue completely free. Collect up to 50 guest photos and videos via your custom QR code — no app download required for guests.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                {[
                  { icon: '📸', text: '50 guest uploads' },
                  { icon: '⏱️', text: '24-hour guest page' },
                  { icon: '🔗', text: 'QR code + share link' },
                  { icon: '🖼️', text: 'Guest gallery included' },
                  { icon: '7️⃣', text: '7 days storage' },
                  { icon: '💳', text: 'No card needed' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/80">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
              <Link href={isLoggedIn ? '/dashboard/events/new' : '/auth/signup'}
                className="inline-block bg-white font-black px-8 py-3 rounded-2xl hover:scale-105 transition-all text-sm shadow-xl"
                style={{ color: '#0A4F6B' }}>
                {isLoggedIn ? 'Create a new event →' : 'Create your free event now →'}
              </Link>
              <p className="text-white/40 text-xs mt-3">Add AI reels, slideshows, extended pages as add-ons when you need them</p>
            </div>
          </div>

          {/* Flex + Pro cards */}
          <div className="grid sm:grid-cols-2 gap-6">

            {/* Flex */}
            <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
              style={{ background: '#0A1628', border: '2px solid #14B8A6', boxShadow: '0 0 0 1px rgba(20,184,166,0.10)' }}>
              {/* Teal accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: '#14B8A6' }} />
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-black px-4 py-1 rounded-full"
                style={{ background: '#E8735C' }}>
                MOST POPULAR
              </span>
              <div className="flex items-start justify-between mb-1 mt-2">
                <div>
                  <p className="font-black text-xl text-white">Flex</p>
                  <p className="text-xs text-white/50">Weddings &amp; mid-size events</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-3xl" style={{ color: '#14B8A6' }}>{formatNaira(PLANS.flex.price)}</p>
                  <p className="text-xs text-white/40">per event · one-time</p>
                </div>
              </div>
              <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  ['500 guest uploads (photos & videos)', true],
                  ['1-month active guest page', true],
                  ['High quality saves', true],
                  ['2 months storage', true],
                  ['Bulk download all media at once', true],
                  ['Basic AI highlight reel included', true],
                  ['Live slideshow display', true],
                  ['Better gallery customisation', true],
                  ['AI content moderation', false],
                  ['Advanced AI reel', false],
                ].map(([text, included]) => (
                  <li key={text as string} className="flex items-start gap-2 text-sm">
                    {included ? <Check accent="#14B8A6" /> : <X />}
                    <span style={{ color: included ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.20)' }}>{text as string}</span>
                  </li>
                ))}
              </ul>
              <Link href={eventPlanHref()}
                className="block text-center py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: '#14B8A6' }}>
                Get Flex →
              </Link>
              <p className="text-center text-xs text-white/30 mt-2">Or start free and upgrade from your dashboard</p>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
              style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.12)' }}>
              {/* Coral accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #E8735C, #14B8A6)' }} />
              <div className="flex items-start justify-between mb-1 mt-2">
                <div>
                  <p className="font-black text-xl text-white">Pro</p>
                  <p className="text-xs text-white/50">Large events &amp; productions</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-3xl text-white">{formatNaira(PLANS.pro.price)}</p>
                  <p className="text-xs text-white/40">per event · one-time</p>
                </div>
              </div>
              <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  ['Unlimited guest uploads', true],
                  ['3-month active guest page', true],
                  ['High quality saves', true],
                  ['120 days storage', true],
                  ['Bulk download all media at once', true],
                  ['Advanced AI highlight reel ✦', true],
                  ['Live slideshow display', true],
                  ['Advanced gallery customisation', true],
                  ['AI content moderation', true],
                  ['Priority support', true],
                ].map(([text, included]) => (
                  <li key={text as string} className="flex items-start gap-2 text-sm">
                    {included ? <Check accent="#E8735C" /> : <X />}
                    <span style={{ color: 'rgba(255,255,255,0.80)' }}>{text as string}</span>
                  </li>
                ))}
              </ul>
              <Link href={eventPlanHref()}
                className="block text-center py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
                Get Pro →
              </Link>
              <p className="text-center text-xs text-white/30 mt-2">Upgrade from Flex — pay just the ₦25,000 difference</p>
            </div>
          </div>

          {/* Comparison nudge */}
          <div className="mt-6 rounded-2xl p-5 text-center"
            style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)' }}>
            <p className="text-sm text-white font-semibold mb-1">Not sure which to choose?</p>
            <p className="text-xs text-white/50 max-w-lg mx-auto">
              Start with the <strong className="text-white/80">Free plan</strong> — no card needed. After your event, if you loved it and want more uploads, a longer page, or bulk downloads, upgrade to Flex or Pro in one click from your dashboard.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VENDOR / PROFESSIONAL BUNDLES                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="vendor">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
              style={{ background: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.25)' }}>
              For professionals
            </span>
            <h2 className="font-black text-2xl sm:text-3xl text-white mb-2">Vendor &amp; Planner Bundles</h2>
            <p className="text-white/50 text-sm max-w-xl mx-auto">
              Event planners, photographers, videographers, and MCs — buy once, run multiple events from your account balance without paying per event.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              {
                plan: PLANNER_PLANS.starter,
                tagline: 'Just getting started',
                accent: '#64748b',
                highlight: false,
                tag: null as string | null,
                features: [
                  '3 active events / month',
                  '2,000 combined uploads',
                  'All Flex features included',
                  'Bulk download',
                  `Welcome form add-on (${formatNaira(PLANNER_PLANS.starter.welcomeFormPrice)})`,
                  `Remove watermark (${formatNaira(PLANNER_PLANS.starter.removeLogoPrice)})`,
                  'GuestVue branding on reels',
                ],
              },
              {
                plan: PLANNER_PLANS.growth,
                tagline: 'Growing your business',
                accent: '#14B8A6',
                highlight: true,
                tag: 'Best value' as string | null,
                features: [
                  '5 active events / month',
                  'Unlimited uploads',
                  'All Pro features included',
                  'Bulk download',
                  `Welcome form add-on (${formatNaira(PLANNER_PLANS.growth.welcomeFormPrice)})`,
                  `Remove watermark (${formatNaira(PLANNER_PLANS.growth.removeLogoPrice)})`,
                  'Priority support',
                ],
              },
              {
                plan: PLANNER_PLANS.scale,
                tagline: 'Scaling your agency',
                accent: '#1E5AAF',
                highlight: false,
                tag: null as string | null,
                features: [
                  '10 active events / month',
                  'Unlimited uploads',
                  'All Pro features included',
                  'Welcome forms FREE ✓',
                  `Remove watermark (${formatNaira(PLANNER_PLANS.scale.removeLogoPrice)})`,
                  'Photo wall website embed',
                  'Lead generation tools',
                ],
              },
              {
                plan: PLANNER_PLANS.jagaban,
                tagline: 'Dominating the market',
                accent: '#E8735C',
                highlight: false,
                tag: '🔥 Top Tier' as string | null,
                features: [
                  '20 active events / month',
                  'Unlimited uploads',
                  'All Pro features included',
                  'Welcome forms FREE ✓',
                  'Remove watermark included ✓',
                  'Photo wall website embed',
                  'White-label solution available',
                ],
              },
            ]).map(({ plan, tagline, accent, highlight, tag, features }) => (
              <div key={plan.id}
                className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
                style={{
                  background: '#0A1628',
                  border: highlight ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: highlight ? `0 0 0 1px ${accent}18` : 'none',
                }}>
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
                {tag && (
                  <span className="absolute -top-3 left-4 text-white text-xs font-black px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: accent }}>
                    {tag}
                  </span>
                )}
                <p className="font-black text-lg text-white mt-1">{plan.name}</p>
                <p className="text-xs text-white/40 mb-2">{tagline}</p>
                <p className="font-black text-2xl mb-0.5" style={{ color: accent }}>{formatNaira(plan.price)}</p>
                <p className="text-xs text-white/40 mb-4">one-time payment</p>
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-white/70">
                      <Check accent={accent} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={planHref(plan.id, 'planner')}
                  className="block text-center py-2.5 rounded-xl font-bold text-sm transition-all text-white hover:opacity-90"
                  style={highlight
                    ? { background: accent }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-5">
            All bundles are one-time purchases — your event credits never expire. Running 20+ events? See Enterprise below.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BUSINESS / BRAND MONTHLY                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="business">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider"
              style={{ background: 'rgba(232,115,92,0.15)', color: '#E8735C', border: '1px solid rgba(232,115,92,0.25)' }}>
              Monthly subscription
            </span>
            <h2 className="font-black text-2xl sm:text-3xl text-white mb-2">Business &amp; Brand Plans</h2>
            <p className="text-white/50 text-sm max-w-xl mx-auto">
              Restaurants, clubs, cafes, gyms, brands — keep a <strong className="text-white/80">permanent QR code</strong> that collects customer content around the clock. Active as long as you stay subscribed. Cancel any time.
            </p>
          </div>

          {/* How it works callout */}
          <div className="rounded-2xl p-5 mb-8 max-w-3xl mx-auto text-center"
            style={{ background: 'rgba(232,115,92,0.08)', border: '1px solid rgba(232,115,92,0.20)' }}>
            <p className="text-sm text-white/80">
              <strong className="text-white">How it works:</strong> Your QR code never expires. Customers scan and upload on their own. Our AI turns their content into TikTok/Instagram reels — with music, transitions, and your hashtag — automatically.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {([
              {
                plan: BUSINESS_PLANS.activation,
                tagline: 'Growing brands & businesses',
                highlight: false,
                tag: null as string | null,
                features: [
                  '2,000 customer uploads / month',
                  'Permanent QR code + rolling gallery',
                  'Good quality with AI moderation',
                  'Bulk download all content',
                  'Basic AI reel generation',
                  'Live slideshow display',
                  'Better gallery customisation',
                ],
              },
              {
                plan: BUSINESS_PLANS.tycoon,
                tagline: 'High-volume brands & agencies',
                highlight: true,
                tag: 'Best value' as string | null,
                features: [
                  'Unlimited customer uploads / month',
                  'Permanent QR code + rolling gallery',
                  'High quality with AI moderation',
                  'Bulk download all content',
                  'Advanced AI reel generation ✦',
                  'Live slideshow display',
                  'Advanced gallery customisation',
                ],
              },
            ]).map(({ plan, tagline, highlight, tag, features }) => (
              <div key={plan.id}
                className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
                style={{
                  background: '#0A1628',
                  border: highlight ? '2px solid #E8735C' : '1px solid rgba(255,255,255,0.10)',
                }}>
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: highlight ? '#E8735C' : 'rgba(255,255,255,0.10)' }} />
                {tag && (
                  <span className="absolute -top-3 left-4 text-white text-xs font-black px-2.5 py-1 rounded-full"
                    style={{ background: '#E8735C' }}>
                    {tag}
                  </span>
                )}
                <p className="font-black text-xl text-white mt-1">{plan.name}</p>
                <p className="text-xs text-white/40 mb-2">{tagline}</p>
                <div className="mb-0.5">
                  <span className="font-black text-3xl" style={{ color: highlight ? '#E8735C' : 'rgba(255,255,255,0.90)' }}>
                    {formatNaira(plan.price)}
                  </span>
                  <span className="text-white/40 text-sm font-medium"> /mo</span>
                </div>
                <p className="text-xs text-white/40 mb-5">billed monthly · cancel any time</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check accent={highlight ? '#E8735C' : '#14B8A6'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={planHref(plan.id, 'business')}
                  className="block text-center py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                  style={highlight
                    ? { background: '#E8735C' }
                    : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ENTERPRISE                                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="enterprise">
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
            {/* Dark header */}
            <div className="px-8 py-10 text-white text-center" style={{ background: 'linear-gradient(135deg, #060D1A, #0A4F6B)' }}>
              <span className="inline-block text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                🌐 Enterprise &amp; White-Label
              </span>
              <h2 className="font-black text-2xl sm:text-3xl mb-3">Custom solution for agencies &amp; brands</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">
                Launching GuestVue under your own brand? Need custom integrations, dedicated infrastructure, or a reseller agreement? Let&apos;s build something together.
              </p>
            </div>

            {/* Feature columns */}
            <div className="grid sm:grid-cols-3 gap-0" style={{ background: '#0A1628' }}>
              {[
                { icon: '🏷️', title: 'White-Label', desc: 'Your brand, your domain. Remove all GuestVue branding and serve the platform as your own product to clients.' },
                { icon: '🔌', title: 'Custom Integrations', desc: 'Webhook events, CRM sync, dedicated API access, custom analytics dashboards, and SLA-backed uptime.' },
                { icon: '🤝', title: 'Reseller Programme', desc: 'Resell GuestVue to your clients at your own margin. Dedicated account manager and volume pricing.' },
              ].map(({ icon, title, desc }, i) => (
                <div key={title}
                  className="px-8 py-8 text-center"
                  style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div className="text-3xl mb-3">{icon}</div>
                  <p className="font-bold text-white mb-2">{title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* CTA footer */}
            <div className="px-8 py-6 text-center" style={{ background: '#060D1A', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-sm text-white/60 mb-4">Pricing is custom — based on volume, features, and contract length.</p>
              <Link href="/contact"
                className="inline-block text-white font-bold px-8 py-3 rounded-xl transition-all text-sm hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
                Contact us for a custom quote →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ADD-ONS                                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-8">
            <h2 className="font-black text-2xl text-white mb-2">Add-ons</h2>
            <p className="text-white/50 text-sm">Enhance any event on any plan. Pay only for what you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(ADDONS).map(addon => (
              <div key={addon.id}
                className="rounded-xl p-4 flex items-center justify-between gap-3 transition-all cursor-default"
                style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(20,184,166,0.30)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <p className="font-semibold text-sm text-white/80">{addon.name}</p>
                <p className="font-black text-sm whitespace-nowrap" style={{ color: '#14B8A6' }}>{formatNaira(addon.price)}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-4">Add-ons can be purchased from your event dashboard at any time.</p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FAQ                                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-black text-2xl text-white mb-8 text-center">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'Do I need a credit card to start?', a: 'No. The Free plan is completely free — create an event, get a QR code, and start collecting memories right now. No card, no commitment.' },
              { q: 'Are personal plans subscriptions?', a: 'No. Free, Flex, and Pro are one-time payments per event. You pay once, you own that event forever (within the storage window). No recurring charges.' },
              { q: 'Can I upgrade from Free to Flex or Pro later?', a: 'Yes — at any time, even after your event is live. Upgrade from your event dashboard and your guests can keep uploading with the expanded limit immediately.' },
              { q: 'Can I upgrade from Flex to Pro?', a: 'Yes. Upgrade any time by paying just the ₦25,000 difference. Your upload limit and page duration update immediately.' },
              { q: 'What are Vendor Bundles?', a: 'One-time purchases for event professionals who run many events. Instead of paying per event, you get a pool of events and uploads to spread across your jobs. Credits never expire.' },
              { q: 'What is the Business Monthly plan?', a: "A recurring subscription for brands and venues that want a permanent QR code. Your gallery stays live and collecting content as long as you're subscribed. Cancel any time." },
              { q: 'What payment methods are accepted?', a: 'All major Nigerian debit/credit cards and bank transfers via Paystack. International cards are also accepted.' },
              { q: 'Is there a refund policy?', a: 'Refunds are not available once an event has been activated. For technical issues on our end, contact support within 48 hours and we\'ll make it right.' },
            ].map((item, i) => (
              <div key={i}
                className="rounded-2xl p-5 transition-all cursor-default"
                style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <p className="font-semibold text-white mb-1.5">{item.q}</p>
                <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BOTTOM CTA                                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-3xl p-10 text-white text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #060D1A 0%, #0A1628 40%, #0A4F6B 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
          <div className="relative">
            <p className="text-4xl mb-4">✨</p>
            <h2 className="font-black text-3xl mb-3">Ready to collect your first memory?</h2>
            <p className="text-white/60 mb-6 max-w-sm mx-auto text-sm">Start free. No card. No pressure. Upgrade if you fall in love — most people do.</p>
            <Link href={isLoggedIn ? '/dashboard/events/new' : '/auth/signup'}
              className="inline-block font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl text-base text-white"
              style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}>
              {isLoggedIn ? 'Go to your dashboard →' : 'Create your event free →'}
            </Link>
            <p className="text-white/30 text-xs mt-3">Takes less than 2 minutes</p>
          </div>
        </div>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-xs text-white/30"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p>GuestVue &copy; {new Date().getFullYear()} &middot; Lagos, Nigeria</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/terms" className="hover:text-[#14B8A6] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#14B8A6] transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-[#14B8A6] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
