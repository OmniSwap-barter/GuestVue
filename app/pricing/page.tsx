import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatNaira, PLANS, BUSINESS_PLANS, PLANNER_PLANS, ADDONS, isUnlimited } from '@/lib/pricing'

export const metadata = {
  title: 'Pricing — GuestVue',
  description: 'Simple, transparent pricing for every event size. Personal plans, business monthly subscriptions, and professional vendor bundles.',
}

const Check = ({ accent }: { accent?: string }) => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke={accent || '#14B8A6'} strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/"><Logo size={30} /></Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-[#0A4F6B] px-3 py-1.5 rounded-lg hover:bg-slate-50">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-bold text-white bg-[#0A4F6B] px-4 py-2 rounded-xl hover:bg-[#1E5AAF] transition-all">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] py-16 text-center text-white px-4">
        <h1 className="font-black text-4xl sm:text-5xl mb-4">Simple, transparent pricing</h1>
        <p className="text-white/75 text-base max-w-xl mx-auto">
          Per-event personal plans · Monthly subscriptions for brands · One-time bundles for professionals. All prices in Nigerian Naira.
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-24">

        {/* ── PERSONAL PLANS ── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-block bg-[#0A4F6B]/10 text-[#0A4F6B] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">For individuals</span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Personal event plans</h2>
            <p className="text-slate-400 text-sm">One-time payment per event. No subscriptions, no recurring charges.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              {
                plan: PLANS.free,
                tagline: 'Perfect for small gatherings',
                features: [
                  '50 guest uploads (photos & videos)',
                  '24-hour active guest page',
                  'QR code + share link',
                  'Basic gallery & customisation',
                  'Good quality saves',
                  '7 days storage',
                  'Add-ons: AI reel, slideshow, extended page',
                ],
                note: 'No credit card required',
                cta: 'Start free',
                accent: '#14B8A6',
                highlight: false,
              },
              {
                plan: PLANS.flex,
                tagline: 'Weddings & mid-size events',
                features: [
                  '500 guest uploads (photos & videos)',
                  '1-month active guest page',
                  'High quality saves',
                  '2 months storage',
                  'Bulk download (all at once)',
                  'Basic AI highlight reel ✓',
                  'Live slideshow display ✓',
                  'Better customisation options',
                ],
                note: 'Most popular for weddings',
                cta: 'Get Flex',
                accent: '#0A4F6B',
                highlight: true,
              },
              {
                plan: PLANS.pro,
                tagline: 'Large events & productions',
                features: [
                  'Unlimited guest uploads',
                  '3-month active guest page',
                  'High quality saves',
                  '120 days storage',
                  'Bulk download (all at once)',
                  'Professional advanced AI reel ✓',
                  'Live slideshow display ✓',
                  'Advanced customisation',
                  'AI content moderation ✓',
                ],
                note: 'Best for large events',
                cta: 'Get Pro',
                accent: '#1E5AAF',
                highlight: false,
              },
            ] as { plan: (typeof PLANS)[keyof typeof PLANS]; tagline: string; features: string[]; note: string; cta: string; accent: string; highlight: boolean }[]).map(({ plan, tagline, features, note, cta, accent, highlight }) => (
              <div key={plan.id} className={`rounded-2xl border-2 p-6 flex flex-col bg-white relative ${highlight ? 'border-[#0A4F6B] shadow-xl' : 'border-slate-100'}`}>
                {highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8735C] text-white text-xs font-black px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-400 mb-1">{tagline}</p>
                <p className={`font-black text-3xl mt-1 ${highlight ? 'text-[#0A4F6B]' : 'text-slate-900'}`}>
                  {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                </p>
                <p className="text-xs text-slate-400 mb-5 mt-0.5">
                  {plan.price > 0 ? 'per event · one-time payment' : 'forever free'}
                </p>
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check accent={accent} />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mb-3">{note}</p>
                <Link href="/auth/signup"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    highlight ? 'bg-[#0A4F6B] text-white hover:bg-[#1E5AAF]' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-400 text-xs mt-5">
            Upgrade from Flex to Pro any time — pay only the ₦25,000 difference.
          </p>
        </section>

        {/* ── BUSINESS / BRAND MONTHLY ── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-block bg-[#E8735C]/10 text-[#E8735C] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              Monthly subscription
            </span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Business &amp; Brand Plans</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              For restaurants, clubs, cafes, brands, and agencies that want a <strong>permanent QR code</strong> and rolling gallery — always on, always collecting content from your customers. Cancel any time.
            </p>
          </div>

          <div className="bg-[#FFF8F6] border border-[#E8735C]/20 rounded-2xl p-5 mb-8 max-w-3xl mx-auto text-center">
            <p className="text-sm text-slate-700">
              <strong>How it works:</strong> Your QR code stays live as long as your subscription is active. Customers upload photos & videos on their own. Our AI reel tool turns their uploads into ready-to-post TikTok / Instagram content — with music, transitions, and your hashtag automatically added.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {([
              {
                plan: BUSINESS_PLANS.activation,
                tagline: 'For growing brands & businesses',
                features: [
                  '2,000 uploads per month',
                  'Permanent QR code + rolling gallery',
                  'Active while subscribed',
                  'Good quality with AI moderation',
                  'Bulk download all content',
                  'Basic AI reel generation',
                  'Live slideshow display',
                  'Better customisation options',
                ],
                highlight: false,
                tag: null as string | null,
              },
              {
                plan: BUSINESS_PLANS.tycoon,
                tagline: 'For high-volume brands & agencies',
                features: [
                  'Unlimited uploads per month',
                  'Permanent QR code + rolling gallery',
                  'Active while subscribed',
                  'High quality with AI moderation',
                  'Bulk download all content',
                  'Advanced AI reel generation ✓',
                  'Live slideshow display',
                  'Advanced customisation',
                ],
                highlight: true,
                tag: 'Best value' as string | null,
              },
            ]).map(({ plan, tagline, features, highlight, tag }) => (
              <div key={plan.id} className={`rounded-2xl border-2 p-6 flex flex-col bg-white relative ${highlight ? 'border-[#E8735C] shadow-lg' : 'border-slate-100'}`}>
                {tag && (
                  <span className={`absolute -top-3 left-4 text-white text-xs font-black px-2.5 py-1 rounded-full bg-[#E8735C]`}>
                    {tag}
                  </span>
                )}
                <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-400 mb-1">{tagline}</p>
                <div className="mt-1 mb-0.5">
                  <span className={`font-black text-3xl ${highlight ? 'text-[#E8735C]' : 'text-slate-900'}`}>
                    {formatNaira(plan.price)}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">/mo</span>
                </div>
                <p className="text-xs text-slate-400 mb-5">billed monthly · cancel any time</p>
                <ul className="space-y-2 mb-5 flex-1">
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
                  }`}>
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── VENDOR / PROFESSIONAL BUNDLES ── */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-block bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              For professionals
            </span>
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Vendor &amp; Planner Bundles</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              One-time purchase for event planners, photographers, videographers, and agencies. Buy once, run multiple events without paying per event.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              {
                plan: PLANNER_PLANS.starter,
                features: [
                  '3 active events/month',
                  '2,000 combined uploads',
                  'All Flex features',
                  'Bulk download',
                  'Watermark + GuestVue logo',
                  `Welcome form (+${formatNaira(PLANNER_PLANS.starter.welcomeFormPrice)})`,
                  `Remove logo (+${formatNaira(PLANNER_PLANS.starter.removeLogoPrice)})`,
                ],
                tag: null as string | null,
                highlight: false,
              },
              {
                plan: PLANNER_PLANS.growth,
                features: [
                  '5 active events/month',
                  'Unlimited uploads',
                  'All Pro features',
                  'Bulk download',
                  'Auto photo watermark',
                  `Welcome form (+${formatNaira(PLANNER_PLANS.growth.welcomeFormPrice)})`,
                  `Remove logo (+${formatNaira(PLANNER_PLANS.growth.removeLogoPrice)})`,
                ],
                tag: 'Best value' as string | null,
                highlight: true,
              },
              {
                plan: PLANNER_PLANS.scale,
                features: [
                  '10 active events/month',
                  'Unlimited uploads',
                  'All Pro features',
                  'Lead generation tools',
                  'Photo wall website embed',
                  'Welcome forms FREE ✓',
                  `Remove logo (+${formatNaira(PLANNER_PLANS.scale.removeLogoPrice)})`,
                ],
                tag: null as string | null,
                highlight: false,
              },
              {
                plan: PLANNER_PLANS.jagaban,
                features: [
                  '20 active events/month',
                  'Unlimited uploads',
                  'All Pro features',
                  'Lead generation tools',
                  'Photo wall website embed',
                  'Advanced welcome forms ✓',
                  'White-label solutions',
                ],
                tag: '🔥 Top Tier' as string | null,
                highlight: false,
              },
            ] as { plan: (typeof PLANNER_PLANS)[keyof typeof PLANNER_PLANS]; features: string[]; tag: string | null; highlight: boolean }[]).map(({ plan, features, tag, highlight }) => (
              <div key={plan.id} className={`rounded-2xl border-2 p-5 flex flex-col bg-white relative ${highlight ? 'border-[#14B8A6] shadow-lg' : 'border-slate-100'}`}>
                {tag && (
                  <span className={`absolute -top-3 left-4 text-white text-xs font-black px-2.5 py-1 rounded-full ${highlight ? 'bg-[#14B8A6]' : 'bg-slate-700'}`}>
                    {tag}
                  </span>
                )}
                <p className="font-bold text-slate-900">{plan.name}</p>
                <p className={`font-black text-2xl mt-1 ${highlight ? 'text-[#14B8A6]' : 'text-slate-900'}`}>
                  {formatNaira(plan.price)}
                </p>
                <p className="text-xs text-slate-400 mb-4 mt-0.5">one-time payment</p>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <Check accent={highlight ? '#14B8A6' : '#64748b'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                    highlight ? 'bg-[#14B8A6] text-white hover:opacity-90' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                  Get {plan.name} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-400 text-xs mt-5">
            Enterprise / custom rates for large agencies — <Link href="/contact" className="underline hover:text-[#0A4F6B]">contact us</Link>. Includes white-label branding, custom domain, and dedicated human moderation.
          </p>
        </section>

        {/* ── ADD-ONS ── */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Add-ons</h2>
            <p className="text-slate-400 text-sm">Enhance any event or plan with individual extras.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(ADDONS).map(addon => (
              <div key={addon.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-3">
                <p className="font-semibold text-sm text-slate-800">{addon.name}</p>
                <p className="font-bold text-[#0A4F6B] text-sm whitespace-nowrap">{formatNaira(addon.price)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-black text-2xl text-slate-900 mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Are personal plans subscriptions?',
                a: 'No. Free, Flex, and Pro are one-time per-event payments. You pay once when you create an event and own that event. No recurring charges.',
              },
              {
                q: 'Which plans are subscriptions?',
                a: 'Only the Business & Brand plans (Activation and Tycoon) are monthly subscriptions. They keep your QR code and gallery permanently active as long as you stay subscribed.',
              },
              {
                q: 'Can I upgrade from Flex to Pro?',
                a: 'Yes — upgrade any time from your dashboard by paying just the ₦25,000 difference. Your upload limit and page duration update immediately.',
              },
              {
                q: 'What do Vendor Bundles include?',
                a: 'Vendor bundles are one-time purchases. You get a credit pool of events and uploads to run across multiple events without paying per event. Starter gives 3 events + 2,000 combined uploads; Growth and above offer unlimited uploads.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'All major Nigerian debit/credit cards and bank transfers via Paystack. International cards are also accepted.',
              },
              {
                q: 'What is the refund policy?',
                a: 'Refunds are not available once an event has been activated (guest upload page is live). For technical issues on our end, contact support within 48 hours.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="font-semibold text-slate-900 mb-2">{item.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] rounded-3xl p-10 text-white text-center">
          <h2 className="font-black text-3xl mb-3">Start collecting memories today</h2>
          <p className="text-white/70 mb-6 max-w-sm mx-auto">Free plan available — no credit card needed.</p>
          <Link href="/auth/signup"
            className="inline-block bg-white text-[#0A4F6B] font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl">
            Create your event free →
          </Link>
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
