'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatNaira, PLANS, PLANNER_PLANS } from '@/lib/pricing'

const faqs = [
  {
    q: 'What is GuestVue?',
    a: 'GuestVue is a QR-code-powered event media platform. You create an event, share a QR code with your guests, and they can upload photos and videos directly from their phones — no app download needed. All media is collected in your dashboard in real time.',
  },
  {
    q: 'Does it work without internet?',
    a: 'GuestVue requires a basic internet connection to upload media. It is optimised for 3G and 4G networks common across Nigeria. The interface is lightweight so it loads quickly even on slow connections.',
  },
  {
    q: 'Which phones are supported?',
    a: 'GuestVue works on all modern smartphones with a browser. This includes iPhone 6 and newer running iOS 12+, and Android phones running Android 5 (Lollipop) or newer. No app installation is required — just scan and go.',
  },
  {
    q: 'How do guests upload their photos?',
    a: 'Guests scan the QR code displayed at your event. This opens a simple upload page in their browser. They can pick photos from their camera roll, take a new photo, or record a short video. Files upload automatically and appear in your gallery within seconds.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan lets you create an event, collect up to 30 uploads, and keep the gallery active for 24 hours — at no cost. No credit card required. You can upgrade any time before or during your event.',
  },
  {
    q: 'How long are my files stored?',
    a: 'Storage depends on your plan. Free events are stored for 24 hours, Flex events for 7 days, and Pro events for 30 days after the event ends. Vendor bundle holders can extend storage up to 12 months (Jagaban plan). You should download your media before the storage period ends.',
  },
  {
    q: 'Can I download all photos at once?',
    a: 'Bulk download is available on the Flex and Pro plans, and all vendor bundles. You can select individual photos or download all at once. Free plan users can view their gallery but must download files one by one or upgrade.',
  },
  {
    q: 'What is an AI reel?',
    a: 'An AI reel is an automatically generated short video highlight of your event — combining your best guest photos into a dynamic slideshow with transitions and timing suited for Instagram Reels or TikTok. AI reel generation is included on the Pro plan and higher.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. All uploaded media is stored on Cloudflare R2 object storage with server-side encryption. User data is managed through Supabase with row-level security. We do not sell or share your data with third parties. See our Privacy Policy for full details.',
  },
  {
    q: 'How do I become an affiliate?',
    a: 'After signing up, go to your dashboard and click "Affiliate Programme." You will receive a unique referral link. Share it with friends, fellow photographers, or event planners — and earn 20% commission on every paid event they create. Hit 15 referrals to unlock 25% permanently.',
  },
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* ── STICKY NAV ─────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-[#0A4F6B] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#0A4F6B] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#0A4F6B] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#0A4F6B] transition-colors">FAQ</a>
            <Link href="/about" className="hover:text-[#0A4F6B] transition-colors">About</Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-[#0A4F6B] px-3 py-2 rounded-xl hover:bg-slate-50 transition-all">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-bold text-white bg-[#0A4F6B] hover:bg-[#1E5AAF] px-4 py-2 rounded-xl shadow transition-all">
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#features', label: 'Features' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
              { href: '/about', label: 'About' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-3 text-sm font-medium text-slate-600 hover:text-[#0A4F6B] hover:bg-slate-50 rounded-lg transition-all"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/auth/login" className="block text-center py-2.5 text-sm font-semibold border border-slate-200 rounded-xl text-slate-700">
                Sign in
              </Link>
              <Link href="/auth/signup" className="block text-center py-2.5 text-sm font-bold bg-[#0A4F6B] text-white rounded-xl">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A4F6B] via-[#1E5AAF] to-[#E8735C]">
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            Nigeria&apos;s first AI event media platform
          </div>
          <h1 className="font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-5">
            Every Guest. Every Moment.<br />
            <span className="opacity-75">One QR Code.</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Guests scan, upload photos and videos instantly. You collect every memory, share a live slideshow, and generate AI highlight reels — no app download needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-[#0A4F6B] font-black rounded-2xl shadow-2xl hover:scale-105 transition-all text-base">
              Create your first event free →
            </Link>
            <a href="#how-it-works" className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-base">
              See how it works
            </a>
          </div>
          <p className="text-white/50 text-xs mt-6">Free forever · No credit card · Ready in 2 minutes</p>
        </div>
        <div className="relative -mb-px">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60L1440 60L1440 20C1440 20 1200 0 720 0C240 0 0 20 0 20L0 60Z" fill="#ffffff"/>
          </svg>
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────────────────────── */}
      <section className="bg-white py-10 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by event hosts across Nigeria</p>
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { val: '10,000+', label: 'Photos collected' },
              { val: '500+', label: 'Events created' },
              { val: '3G ready', label: 'Works on any network' },
              { val: 'Zero app', label: 'No download needed' },
            ].map(s => (
              <div key={s.label} className="px-4">
                <p className="font-black text-2xl text-[#0A4F6B]">{s.val}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-[#14B8A6] uppercase tracking-widest mb-2">Simple process</p>
          <h2 className="font-black text-3xl sm:text-4xl text-slate-900 mb-3">How GuestVue works</h2>
          <p className="text-slate-400 text-base max-w-md mx-auto">Three steps. No app. Works on every phone at every event.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="#0A4F6B" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              ),
              title: 'Create your event',
              desc: 'Name your event, choose a plan, and get a branded QR code in under 2 minutes. Customise the upload page with your event colours.',
            },
            {
              step: '02',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="#0A4F6B" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: 'Guests scan and upload',
              desc: 'They scan the QR code — no app, no account. Pick photos from their camera roll or take a new one. Done in seconds.',
            },
            {
              step: '03',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="#0A4F6B" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ),
              title: 'You get everything',
              desc: 'Your gallery fills up live. Download all photos at once, run a live slideshow on screen, or generate an AI highlight reel.',
            },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl border border-slate-100 p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute top-4 right-4 font-black text-5xl text-slate-50">{s.step}</span>
              <div className="w-12 h-12 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center mb-4">
                {s.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#14B8A6] uppercase tracking-widest mb-2">Built for African events</p>
            <h2 className="font-black text-3xl sm:text-4xl text-slate-900 mb-3">Everything you need</h2>
            <p className="text-slate-400 max-w-md mx-auto">Designed for Nigerian network conditions, any phone, any event size.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '📱',
                title: 'No app download',
                desc: 'Guests upload directly in their browser. Works on any phone, any OS.',
              },
              {
                icon: '⚡',
                title: '3G optimised',
                desc: 'Images are compressed client-side before upload, so slow networks are not a barrier.',
              },
              {
                icon: '🎞',
                title: 'Live slideshow',
                desc: 'Display a real-time slideshow on a screen at your event as photos come in.',
              },
              {
                icon: '🎬',
                title: 'AI highlight reel',
                desc: 'Automatically generate a cinematic short video from your best guest photos.',
              },
              {
                icon: '📦',
                title: 'Bulk download',
                desc: 'Download your entire gallery in one click. No hunting through individual files.',
              },
              {
                icon: '🔒',
                title: 'Secure storage',
                desc: 'All media encrypted at rest on Cloudflare R2. Only you control your gallery.',
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONAL PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#14B8A6] uppercase tracking-widest mb-2">Transparent pricing</p>
            <h2 className="font-black text-3xl sm:text-4xl text-slate-900 mb-3">Pay per event. Simple.</h2>
            <p className="text-slate-400">No monthly fees on personal plans. Pay when you host.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-4">
            {([
              {
                plan: PLANS.free,
                features: [
                  '30 guest uploads',
                  '24-hour guest page',
                  'QR code included',
                  'Basic gallery view',
                  'Mobile-optimised upload',
                ],
                cta: 'Start for free',
              },
              {
                plan: PLANS.flex,
                features: [
                  '300 guest uploads',
                  '7-day guest page',
                  'Bulk download',
                  'Live slideshow',
                  'QR code + share link',
                ],
                popular: true,
                cta: 'Get Flex',
              },
              {
                plan: PLANS.pro,
                features: [
                  '1,000 guest uploads',
                  '30-day guest page',
                  'Bulk download',
                  'Live slideshow',
                  'Basic AI highlight reel',
                ],
                cta: 'Get Pro',
              },
            ] as {
              plan: (typeof PLANS)[keyof typeof PLANS]
              features: string[]
              popular?: boolean
              cta: string
            }[]).map(({ plan, features, popular, cta }) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 relative flex flex-col ${
                  popular ? 'border-[#0A4F6B] bg-[#0A4F6B]/5 shadow-lg' : 'border-slate-100'
                }`}
              >
                {popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E8735C] text-white text-xs font-black px-3 py-1 rounded-full tracking-wide">
                    MOST POPULAR
                  </span>
                )}
                <p className="font-bold text-xl text-slate-900">{plan.name}</p>
                <p className={`font-black text-3xl mt-1 mb-1 ${popular ? 'text-[#0A4F6B]' : 'text-slate-900'}`}>
                  {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                </p>
                {plan.price > 0 && (
                  <p className="text-xs text-slate-400 mb-4">per event, one-time</p>
                )}
                {plan.price === 0 && <div className="mb-4" />}
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={`mt-0.5 flex-shrink-0 ${popular ? 'text-[#0A4F6B]' : 'text-[#14B8A6]'}`}>
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
                    popular
                      ? 'bg-[#0A4F6B] text-white hover:bg-[#1E5AAF] shadow'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400">
            All plans include a QR code, real-time gallery, and guest upload page. Prices in Nigerian Naira.
          </p>
        </div>
      </section>

      {/* ── VENDOR / PROFESSIONAL PRICING ──────────────────────────────────── */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#E8735C] uppercase tracking-widest mb-2">For professionals</p>
            <h2 className="font-black text-3xl sm:text-4xl text-slate-900 mb-3">Vendor bundles</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              One-time purchase bundles for event planners, photographers, and agencies. Run multiple events without paying per event.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {([
              {
                plan: PLANNER_PLANS.starter,
                highlight: false,
                tag: null,
                features: ['2 active events', '300 uploads each', 'Bulk download', 'Live slideshow'],
              },
              {
                plan: PLANNER_PLANS.growth,
                highlight: true,
                tag: 'Best value',
                features: ['5 active events', '600 uploads each', 'Bulk download', 'Live slideshow', 'Priority support'],
              },
              {
                plan: PLANNER_PLANS.scale,
                highlight: false,
                tag: null,
                features: ['12 active events', '1,500 uploads each', 'Bulk download', 'Live slideshow', 'AI reel ready'],
              },
              {
                plan: PLANNER_PLANS.jagaban,
                highlight: false,
                tag: 'Ultimate',
                features: ['Unlimited events', 'Unlimited uploads', '12-month storage', 'All features', 'VIP support'],
              },
            ] as {
              plan: (typeof PLANNER_PLANS)[keyof typeof PLANNER_PLANS]
              highlight: boolean
              tag: string | null
              features: string[]
            }[]).map(({ plan, highlight, tag, features }) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-5 flex flex-col relative ${
                  highlight ? 'border-[#14B8A6] bg-[#14B8A6]/5 shadow-lg' : 'border-slate-100 bg-white'
                }`}
              >
                {tag && (
                  <span className="absolute -top-3 left-4 bg-[#14B8A6] text-white text-xs font-black px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                )}
                <p className="font-bold text-slate-900">{plan.name}</p>
                <p className={`font-black text-2xl mt-1 mb-0.5 ${highlight ? 'text-[#14B8A6]' : 'text-slate-900'}`}>
                  {formatNaira(plan.price)}
                </p>
                <p className="text-xs text-slate-400 mb-4">one-time payment</p>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-[#14B8A6] mt-0.5 flex-shrink-0">
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
          <div className="text-center mt-6">
            <Link href="/pricing" className="text-sm text-[#0A4F6B] font-semibold hover:underline">
              View full pricing details including add-ons →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-[#14B8A6] uppercase tracking-widest mb-2">Questions</p>
          <h2 className="font-black text-3xl sm:text-4xl text-slate-900 mb-3">Frequently asked</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-semibold text-slate-800 text-sm sm:text-base">{faq.q}</span>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/faq" className="text-sm text-[#0A4F6B] font-semibold hover:underline">
            View all FAQs →
          </Link>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="bg-gradient-to-br from-[#0A4F6B] via-[#1E5AAF] to-[#E8735C] rounded-3xl p-10 text-white text-center">
          <h2 className="font-black text-3xl sm:text-4xl mb-3">Your next event starts here</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Join event hosts across Lagos, Abuja, Port Harcourt, and beyond — collecting every memory with GuestVue.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-[#0A4F6B] font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl text-base"
          >
            Create your event free →
          </Link>
          <p className="text-white/40 text-xs mt-4">No credit card required</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row justify-between gap-8 mb-8">
            <div>
              <Logo size={32} />
              <p className="text-xs text-slate-400 mt-3 max-w-xs leading-relaxed">
                Nigeria&apos;s event media platform. Collect, showcase, and relive every memory from your events.
              </p>
              <p className="text-xs text-slate-400 mt-2">Lagos, Nigeria &middot; guestvueapp@outlook.com</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-bold text-slate-700 mb-3">Product</p>
                <div className="space-y-2">
                  <a href="#how-it-works" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">How it works</a>
                  <a href="#pricing" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">Pricing</a>
                  <a href="#features" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">Features</a>
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-3">Company</p>
                <div className="space-y-2">
                  <Link href="/about" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">About</Link>
                  <Link href="/faq" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">FAQ</Link>
                  <Link href="/contact" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">Contact</Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-3">Legal</p>
                <div className="space-y-2">
                  <Link href="/terms" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">Terms</Link>
                  <Link href="/privacy" className="block text-slate-500 hover:text-[#0A4F6B] transition-colors">Privacy</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>GuestVue &copy; {new Date().getFullYear()}. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="https://instagram.com/guestvue" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A4F6B] transition-colors">Instagram</a>
              <a href="https://twitter.com/guestvue" target="_blank" rel="noopener noreferrer" className="hover:text-[#0A4F6B] transition-colors">Twitter / X</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
