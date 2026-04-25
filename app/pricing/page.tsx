import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatNaira, PLANS, BUSINESS_PLANS, PLANNER_PLANS, ADDONS } from '@/lib/pricing'

export const metadata = {
  title: 'Pricing — GuestVue',
  description: 'Start free. Upgrade when you need more. Personal event plans, vendor bundles, business subscriptions, and enterprise white-label.',
}

const Check = ({ accent = '#14B8A6' }: { accent?: string }) => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke={accent} strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const X = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Nav ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/"><Logo size={30} /></Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-[#0A4F6B] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-bold text-white bg-[#0A4F6B] px-4 py-2 rounded-xl hover:bg-[#1E5AAF] transition-all">
              Start free — no card needed
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #0A4F6B 0%, #1E5AAF 60%, #14B8A6 100%)' }}>
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
          No credit card required to start
        </div>
        <h1 className="font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
          Try it free.<br />
          <span className="text-[#14B8A6]">Upgrade when you love it.</span>
        </h1>
        <p className="text-white/75 text-base max-w-xl mx-auto mb-8">
          GuestVue collects your guests&apos; photos and videos instantly via QR code — no app download needed. Start completely free, then upgrade if you need more.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/signup" className="inline-block bg-white text-[#0A4F6B] font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl text-base">
            Create your first event free →
          </Link>
          <a href="#plans" className="inline-block border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
            See all plans ↓
          </a>
        </div>
        <p className="text-white/50 text-xs mt-4">50 uploads · 24-hour page · QR code included. No commitment.</p>
      </section>

      {/* ── Social proof strip ── */}
      <div className="bg-white border-y border-slate-100 py-4 px-4 text-center">
        <p className="text-sm text-slate-500">
          💍 <strong>Weddings</strong> &nbsp;·&nbsp; 🎂 <strong>Birthdays</strong> &nbsp;·&nbsp; 🏢 <strong>Corporates</strong> &nbsp;·&nbsp; 🎓 <strong>Graduations</strong> &nbsp;·&nbsp; 🎉 <strong>Parties</strong> &nbsp;·&nbsp; 🍽️ <strong>Restaurants</strong> &nbsp;·&nbsp; 🎤 <strong>Concerts</strong>
        </p>
      </div>

      <main id="plans" className="max-w-6xl mx-auto px-4 py-16 space-y-24">

        {/* ── SECTION JUMP LINKS ── */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { href: '#personal', label: '🎉 Personal Events', color: 'bg-[#0A4F6B]/10 text-[#0A4F6B] hover:bg-[#0A4F6B]/20' },
            { href: '#vendor', label: '📸 Vendor Bundles', color: 'bg-[#14B8A6]/10 text-[#14B8A6] hover:bg-[#14B8A6]/20' },
            { href: '#business', label: '🏢 Business Monthly', color: 'bg-[#E8735C]/10 text-[#E8735C] hover:bg-[#E8735C]/20' },
            { href: '#enterprise', label: '🌐 Enterprise', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
          ].map(({ href, label, color }) => (
            <a key={href} href={href} className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${color}`}>
              {label}
            </a>
          ))}
        </div>

        {/* ── PERSONAL PLANS ── */}
        <section id="personal">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#0A4F6B]/10 text-[#0A4F6B] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">For individuals</span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Personal Event Plans</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">One-time payment per event. No subscriptions, no recurring charges. Start free and upgrade anytime — even after your event is live.</p>
          </div>

          {/* Free plan — hero card */}
          <div className="bg-gradient-to-r from-[#0A4F6B] to-[#1E5AAF] rounded-3xl p-8 mb-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute right-16 bottom-0 w-32 h-32 bg-[#14B8A6]/20 rounded-full translate-y-1/2" />
            <div className="relative max-w-2xl">
              <span className="inline-block bg-[#14B8A6] text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Start here — It&apos;s free</span>
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
              <Link href="/auth/signup" className="inline-block bg-white text-[#0A4F6B] font-black px-8 py-3 rounded-2xl hover:scale-105 transition-all text-sm shadow-xl">
                Create your free event now →
              </Link>
              <p className="text-white/40 text-xs mt-3">Add AI reels, slideshows, extended pages as add-ons when you need them</p>
            </div>
          </div>

          {/* Flex + Pro cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Flex */}
            <div className="rounded-2xl border-2 border-[#0A4F6B] shadow-xl p-6 flex flex-col bg-white relative">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8735C] text-white text-xs font-black px-4 py-1 rounded-full">MOST POPULAR</span>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-black text-xl text-slate-900">Flex</p>
                  <p className="text-xs text-slate-400">Weddings & mid-size events</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-3xl text-[#0A4F6B]">{formatNaira(PLANS.flex.price)}</p>
                  <p className="text-xs text-slate-400">per event · one-time</p>
                </div>
              </div>
              <div className="h-px bg-slate-100 my-4" />
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
                  <li key={text as string} className="flex items-start gap-2 text-sm text-slate-600">
                    {included ? <Check accent="#0A4F6B" /> : <X />}
                    <span className={included ? '' : 'text-slate-300'}>{text as string}</span>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/events/new" className="block text-center py-3 rounded-xl font-bold text-sm bg-[#0A4F6B] text-white hover:bg-[#1E5AAF] transition-all">
                Get Flex →
              </Link>
              <p className="text-center text-xs text-slate-400 mt-2">Or start free and upgrade from your dashboard</p>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-slate-200 p-6 flex flex-col bg-white relative">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-black text-xl text-slate-900">Pro</p>
                  <p className="text-xs text-slate-400">Large events & productions</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-3xl text-slate-900">{formatNaira(PLANS.pro.price)}</p>
                  <p className="text-xs text-slate-400">per event · one-time</p>
                </div>
              </div>
              <div className="h-px bg-slate-100 my-4" />
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
                  <li key={text as string} className="flex items-start gap-2 text-sm text-slate-600">
                    {included ? <Check accent="#1E5AAF" /> : <X />}
                    {text as string}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/events/new" className="block text-center py-3 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">
                Get Pro →
              </Link>
              <p className="text-center text-xs text-slate-400 mt-2">Upgrade from Flex — pay just the ₦25,000 difference</p>
            </div>
          </div>

          {/* Plan comparison nudge */}
          <div className="mt-6 bg-[#14B8A6]/5 border border-[#14B8A6]/20 rounded-2xl p-5 text-center">
            <p className="text-sm text-slate-700 font-semibold mb-1">Not sure which to choose?</p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Start with the <strong>Free plan</strong> — no card needed. After your event, if you loved it and want more uploads, a longer page, or bulk downloads, upgrade to Flex or Pro in one click from your dashboard.
            </p>
          </div>
        </section>

        {/* ── VENDOR / PROFESSIONAL BUNDLES ── */}
        <section id="vendor">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">For professionals</span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Vendor &amp; Planner Bundles</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Event planners, photographers, videographers, and MCs — buy once, run multiple events from your account balance without paying per event.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              {
                plan: PLANNER_PLANS.starter,
                tagline: 'Just getting started',
                color: '#64748b',
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
                color: '#14B8A6',
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
                color: '#1E5AAF',
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
                color: '#E8735C',
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
            ]).map(({ plan, tagline, color, highlight, tag, features }) => (
              <div key={plan.id} className={`rounded-2xl border-2 p-5 flex flex-col bg-white relative ${highlight ? 'border-[#14B8A6] shadow-lg' : 'border-slate-100'}`}>
                {tag && (
                  <span className="absolute -top-3 left-4 text-white text-xs font-black px-2.5 py-1 rounded-full" style={{ backgroundColor: color }}>
                    {tag}
                  </span>
                )}
                <p className="font-black text-lg text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-400 mb-2">{tagline}</p>
                <p className="font-black text-2xl mb-0.5" style={{ color }}>{formatNaira(plan.price)}</p>
                <p className="text-xs text-slate-400 mb-4">one-time payment</p>
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check accent={color} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                    highlight ? 'text-white hover:opacity-90' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  style={highlight ? { backgroundColor: color } : {}}
                >
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">
            All bundles are one-time purchases — your event credits never expire. Running 20+ events? See Enterprise below.
          </p>
        </section>

        {/* ── BUSINESS / BRAND MONTHLY ── */}
        <section id="business">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#E8735C]/10 text-[#E8735C] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Monthly subscription</span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Business &amp; Brand Plans</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Restaurants, clubs, cafes, gyms, brands — keep a <strong>permanent QR code</strong> that collects customer content around the clock. Active as long as you stay subscribed. Cancel any time.
            </p>
          </div>

          <div className="bg-[#FFF8F6] border border-[#E8735C]/20 rounded-2xl p-5 mb-8 max-w-3xl mx-auto">
            <p className="text-sm text-slate-700 text-center">
              <strong>How it works:</strong> Your QR code never expires. Customers scan and upload on their own. Our AI turns their content into TikTok/Instagram reels — with music, transitions, and your hashtag — automatically.
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
              <div key={plan.id} className={`rounded-2xl border-2 p-6 flex flex-col bg-white relative ${highlight ? 'border-[#E8735C] shadow-lg' : 'border-slate-100'}`}>
                {tag && (
                  <span className="absolute -top-3 left-4 bg-[#E8735C] text-white text-xs font-black px-2.5 py-1 rounded-full">{tag}</span>
                )}
                <p className="font-black text-xl text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-400 mb-2">{tagline}</p>
                <div className="mb-0.5">
                  <span className={`font-black text-3xl ${highlight ? 'text-[#E8735C]' : 'text-slate-900'}`}>{formatNaira(plan.price)}</span>
                  <span className="text-slate-400 text-sm font-medium"> /mo</span>
                </div>
                <p className="text-xs text-slate-400 mb-5">billed monthly · cancel any time</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check accent={highlight ? '#E8735C' : '#14B8A6'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    highlight ? 'bg-[#E8735C] text-white hover:opacity-90' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── ENTERPRISE ── */}
        <section id="enterprise">
          <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
            <div className="bg-slate-900 px-8 py-10 text-white text-center">
              <span className="inline-block bg-white/10 text-white text-xs font-black px-3 py-1 rounded-full mb-4 uppercase tracking-wider">🌐 Enterprise & White-Label</span>
              <h2 className="font-black text-2xl sm:text-3xl mb-3">Custom solution for agencies &amp; brands</h2>
              <p className="text-white/60 text-sm max-w-xl mx-auto">
                Launching GuestVue under your own brand? Need custom integrations, dedicated infrastructure, or a reseller agreement? Let&apos;s build something together.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {[
                {
                  icon: '🏷️',
                  title: 'White-Label',
                  desc: 'Your brand, your domain. Remove all GuestVue branding and serve the platform as your own product to clients.',
                },
                {
                  icon: '🔌',
                  title: 'Custom Integrations',
                  desc: 'Webhook events, CRM sync, dedicated API access, custom analytics dashboards, and SLA-backed uptime.',
                },
                {
                  icon: '🤝',
                  title: 'Reseller Programme',
                  desc: 'Resell GuestVue to your clients at your own margin. Dedicated account manager and volume pricing.',
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="px-8 py-8 text-center">
                  <div className="text-3xl mb-3">{icon}</div>
                  <p className="font-bold text-slate-900 mb-2">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-4">Pricing is custom — based on volume, features, and contract length.</p>
              <Link href="/contact" className="inline-block bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-700 transition-all text-sm">
                Contact us for a custom quote →
              </Link>
            </div>
          </div>
        </section>

        {/* ── ADD-ONS ── */}
        <section>
          <div className="text-center mb-8">
            <h2 className="font-black text-2xl text-slate-900 mb-2">Add-ons</h2>
            <p className="text-slate-400 text-sm">Enhance any event on any plan. Pay only for what you need.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(ADDONS).map(addon => (
              <div key={addon.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-3 hover:border-[#0A4F6B]/30 hover:shadow-sm transition-all">
                <p className="font-semibold text-sm text-slate-800">{addon.name}</p>
                <p className="font-black text-[#0A4F6B] text-sm whitespace-nowrap">{formatNaira(addon.price)}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">Add-ons can be purchased from your event dashboard at any time.</p>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-black text-2xl text-slate-900 mb-8 text-center">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: 'Do I need a credit card to start?', a: 'No. The Free plan is completely free — create an event, get a QR code, and start collecting memories right now. No card, no commitment.' },
              { q: 'Are personal plans subscriptions?', a: 'No. Free, Flex, and Pro are one-time payments per event. You pay once, you own that event forever (within the storage window). No recurring charges.' },
              { q: 'Can I upgrade from Free to Flex or Pro later?', a: 'Yes — at any time, even after your event is live. Upgrade from your event dashboard and your guests can keep uploading with the expanded limit immediately.' },
              { q: 'Can I upgrade from Flex to Pro?', a: 'Yes. Upgrade any time by paying just the ₦25,000 difference. Your upload limit and page duration update immediately.' },
              { q: 'What are Vendor Bundles?', a: 'One-time purchases for event professionals who run many events. Instead of paying per event, you get a pool of events and uploads to spread across your jobs. Credits never expire.' },
              { q: 'What is the Business Monthly plan?', a: 'A recurring subscription for brands and venues that want a permanent QR code. Your gallery stays live and collecting content as long as you\'re subscribed. Cancel any time.' },
              { q: 'What payment methods are accepted?', a: 'All major Nigerian debit/credit cards and bank transfers via Paystack. International cards are also accepted.' },
              { q: 'Is there a refund policy?', a: 'Refunds are not available once an event has been activated. For technical issues on our end, contact support within 48 hours and we\'ll make it right.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-all">
                <p className="font-semibold text-slate-900 mb-1.5">{item.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <div className="rounded-3xl p-10 text-white text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A4F6B 0%, #1E5AAF 50%, #14B8A6 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
          <div className="relative">
            <p className="text-4xl mb-4">✨</p>
            <h2 className="font-black text-3xl mb-3">Ready to collect your first memory?</h2>
            <p className="text-white/70 mb-6 max-w-sm mx-auto text-sm">Start free. No card. No pressure. Upgrade if you fall in love — most people do.</p>
            <Link href="/auth/signup" className="inline-block bg-white text-[#0A4F6B] font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl text-base">
              Create your event free →
            </Link>
            <p className="text-white/40 text-xs mt-3">Takes less than 2 minutes</p>
          </div>
        </div>

      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>GuestVue &copy; {new Date().getFullYear()} &middot; Lagos, Nigeria</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/terms" className="hover:text-[#0A4F6B]">Terms</Link>
          <Link href="/privacy" className="hover:text-[#0A4F6B]">Privacy</Link>
          <Link href="/contact" className="hover:text-[#0A4F6B]">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
