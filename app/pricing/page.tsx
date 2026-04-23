import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatNaira, PLANS, BUSINESS_PLANS, PLANNER_PLANS, ADDONS } from '@/lib/pricing'

export const metadata = {
  title: 'Pricing — GuestVue',
  description: 'Simple, transparent pricing for every event size. Personal plans, business activations, and professional vendor bundles.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Logo size={30} />
          </Link>
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
          Pay per event, buy a bundle, or activate for your business. All prices in Nigerian Naira.
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-20">

        {/* Personal Plans */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Personal plans</h2>
            <p className="text-slate-400 text-sm">Per event, one-time payment. No subscriptions.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              {
                plan: PLANS.free,
                features: [
                  '30 guest uploads',
                  '24-hour active guest page',
                  'QR code and share link',
                  'Basic gallery view',
                  'Mobile-optimised',
                ],
                note: 'No credit card required',
                cta: 'Start for free',
                highlight: false,
              },
              {
                plan: PLANS.flex,
                features: [
                  '300 guest uploads',
                  '7-day active guest page',
                  'Bulk download (all photos)',
                  'Live slideshow display',
                  'QR code and share link',
                ],
                note: 'Most popular for weddings',
                cta: 'Get Flex',
                highlight: true,
              },
              {
                plan: PLANS.pro,
                features: [
                  '1,000 guest uploads',
                  '30-day active guest page',
                  'Bulk download (all photos)',
                  'Live slideshow display',
                  'Basic AI highlight reel',
                ],
                note: 'Best for large events',
                cta: 'Get Pro',
                highlight: false,
              },
            ] as {
              plan: (typeof PLANS)[keyof typeof PLANS]
              features: string[]
              note: string
              cta: string
              highlight: boolean
            }[]).map(({ plan, features, note, cta, highlight }) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 flex flex-col bg-white relative ${
                  highlight ? 'border-[#0A4F6B] shadow-lg' : 'border-slate-100'
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8735C] text-white text-xs font-black px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                <p className={`font-black text-3xl mt-1 ${highlight ? 'text-[#0A4F6B]' : 'text-slate-900'}`}>
                  {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                </p>
                <p className="text-xs text-slate-400 mb-5 mt-0.5">
                  {plan.price > 0 ? 'per event, one-time' : 'forever free'}
                </p>
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-[#0A4F6B]' : 'text-[#14B8A6]'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400 mb-3">{note}</p>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    highlight
                      ? 'bg-[#0A4F6B] text-white hover:bg-[#1E5AAF]'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Business Activation */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Business activation</h2>
            <p className="text-slate-400 text-sm">One-time activation for businesses running a fixed number of events.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {([
              {
                plan: BUSINESS_PLANS.activation_starter,
                features: [
                  '1 event activation',
                  '500 uploads per event',
                  'Bulk download',
                  'Live slideshow',
                  'Basic gallery',
                ],
              },
              {
                plan: BUSINESS_PLANS.tycoon,
                features: [
                  '3 event activations',
                  '2,000 uploads per event',
                  'Bulk download',
                  'Live slideshow',
                  'Advanced AI reel',
                ],
                highlight: true,
              },
            ] as {
              plan: (typeof BUSINESS_PLANS)[keyof typeof BUSINESS_PLANS]
              features: string[]
              highlight?: boolean
            }[]).map(({ plan, features, highlight }) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 bg-white flex flex-col ${
                  highlight ? 'border-[#0A4F6B] shadow-lg' : 'border-slate-100'
                }`}
              >
                <p className="font-bold text-lg text-slate-900">{plan.name}</p>
                <p className={`font-black text-3xl mt-1 ${highlight ? 'text-[#0A4F6B]' : 'text-slate-900'}`}>
                  {formatNaira(plan.price)}
                </p>
                <p className="text-xs text-slate-400 mb-5 mt-0.5">one-time payment</p>
                <ul className="space-y-2 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 flex-shrink-0 text-[#14B8A6]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    highlight
                      ? 'bg-[#0A4F6B] text-white hover:bg-[#1E5AAF]'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Vendor Bundles */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Vendor bundles</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              One-time bundle purchases for event planners, photographers, and agencies. Run multiple events without paying per event.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              {
                plan: PLANNER_PLANS.starter,
                features: ['2 active events', '300 uploads each', 'Bulk download', 'Live slideshow'],
                tag: null,
                highlight: false,
              },
              {
                plan: PLANNER_PLANS.growth,
                features: ['5 active events', '600 uploads each', 'Bulk download', 'Live slideshow', 'Priority support'],
                tag: 'Best value',
                highlight: true,
              },
              {
                plan: PLANNER_PLANS.scale,
                features: ['12 active events', '1,500 uploads each', 'Bulk download', 'Live slideshow', 'AI reel ready'],
                tag: null,
                highlight: false,
              },
              {
                plan: PLANNER_PLANS.jagaban,
                features: ['Unlimited events', 'Unlimited uploads', '12-month storage', 'All features', 'VIP support'],
                tag: 'Ultimate',
                highlight: false,
              },
            ] as {
              plan: (typeof PLANNER_PLANS)[keyof typeof PLANNER_PLANS]
              features: string[]
              tag: string | null
              highlight: boolean
            }[]).map(({ plan, features, tag, highlight }) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-5 flex flex-col bg-white relative ${
                  highlight ? 'border-[#14B8A6] shadow-lg' : 'border-slate-100'
                }`}
              >
                {tag && (
                  <span className="absolute -top-3 left-4 bg-[#14B8A6] text-white text-xs font-black px-2.5 py-1 rounded-full">
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
                      <span className="mt-0.5 flex-shrink-0 text-[#14B8A6]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                    highlight
                      ? 'bg-[#14B8A6] text-white hover:opacity-90'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Get {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Add-ons */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-black text-2xl sm:text-3xl text-slate-900 mb-2">Add-ons</h2>
            <p className="text-slate-400 text-sm">Enhance any event with individual add-ons.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(ADDONS).map(addon => (
              <div key={addon.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{addon.name}</p>
                </div>
                <p className="font-bold text-[#0A4F6B] text-sm">{formatNaira(addon.price)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-black text-2xl text-slate-900 mb-8 text-center">Pricing FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Are these one-time payments or subscriptions?',
                a: 'Personal plans (Free, Flex, Pro) are one-time, per-event payments. Business activations and Vendor bundles are also one-time purchases — you pay once and use your credits across multiple events.',
              },
              {
                q: 'Can I upgrade after creating an event?',
                a: 'Yes. You can upgrade your event plan at any time from your dashboard. You will be charged the difference and your event limits will update immediately.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept all major Nigerian debit and credit cards, and bank transfers through Paystack. International cards are also accepted.',
              },
              {
                q: 'What is the refund policy?',
                a: 'Refunds are not available once an event has been activated (i.e., the guest upload page has gone live). For unanticipated technical issues on our end, contact support within 48 hours.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
                <p className="font-semibold text-slate-900 mb-2">{item.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] rounded-3xl p-10 text-white text-center">
          <h2 className="font-black text-3xl mb-3">Start collecting memories today</h2>
          <p className="text-white/70 mb-6 max-w-sm mx-auto">Free plan available. No credit card needed.</p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-[#0A4F6B] font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl"
          >
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
