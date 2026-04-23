'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatNaira, PLANS, PLANNER_PLANS } from '@/lib/pricing'

const FEATURES = [
  { icon: '📱', title: 'No App Required', desc: 'Guests scan a QR code and upload directly from their phone browser. iOS, Android, old and new — it just works.' },
  { icon: '⚡', title: 'Optimised for 3G/4G', desc: 'Images are compressed client-side before upload. Fast even on mobile data. Built for the real Nigerian network.' },
  { icon: '🎬', title: 'AI Highlight Reels', desc: 'Automatically stitch your best moments into a short-form video ready for Instagram Reels and TikTok.' },
  { icon: '🖥️', title: 'Live Slideshow', desc: 'Project a real-time photo stream at your event as guests upload. Turn any screen into a live gallery wall.' },
  { icon: '📦', title: 'Bulk Downloads', desc: 'Download your entire event gallery in one click — individually selected files or everything at once.' },
  { icon: '🔗', title: 'Affiliate Programme', desc: 'Earn 20% commission on every referral. Hit 15 referrals to unlock 25% permanently.' },
]

const STEPS = [
  { n: '01', icon: '🎉', title: 'Create your event', desc: 'Name it, pick a plan, and get a branded QR code in under 2 minutes.' },
  { n: '02', icon: '📲', title: 'Guests scan & upload', desc: 'They scan, pick photos from their camera roll or take new ones — done in seconds.' },
  { n: '03', icon: '🎞️', title: 'You get everything', desc: 'Gallery fills live. Download all media or generate an AI reel for social.' },
]

const LOGOS = ['📸', '🎊', '🎬', '📱', '🎉', '✨', '💫', '🌟', '🎯', '🚀']

const FAQS = [
  { q: 'What is GuestVue?', a: 'GuestVue is a QR-powered event media platform. You create an event, guests scan a QR code and upload photos and videos from their phones — no app download required. All media collects in your dashboard in real time.' },
  { q: 'Which phones are supported?', a: 'All smartphones with a browser. iPhone 6 and above (iOS 12+), Android 5 (Lollipop) and above. We test across budget Android devices and older iPhones to ensure broad compatibility.' },
  { q: 'Does it work on slow internet?', a: 'Yes. Photos are compressed automatically in the browser before uploading. The guest upload page is under 100KB and loads on 3G connections in under 3 seconds.' },
  { q: 'How do guests upload?', a: 'They scan the QR code, which opens a simple upload page in their browser. They tap to choose photos from their camera roll, take a new photo, or record a short video. No sign-up. No app. Just upload.' },
  { q: 'Is there a free plan?', a: 'Yes — create an event, collect up to 30 uploads, and keep the gallery active for 24 hours at zero cost. No credit card required.' },
  { q: 'How long are files stored?', a: 'Storage is tied to your plan. Free: 24 hours. Flex: 7 days. Pro: 30 days. Vendor Jagaban bundle: 12 months. Always download your media before the period ends.' },
  { q: 'Can I download all photos at once?', a: 'Bulk download is available on Flex, Pro, and all vendor bundles. You can select individual files or download everything in one tap.' },
  { q: 'What is an AI reel?', a: 'An AI-generated short video highlight — your best event moments stitched into a dynamic clip with transitions, timed for Instagram Reels or TikTok. Included on Pro and above.' },
  { q: 'Is my data and media safe?', a: 'All media is encrypted at rest on Cloudflare R2 storage. User data is managed in Supabase with row-level security. We do not sell or share your data. Full details in our Privacy Policy.' },
  { q: 'How does the affiliate programme work?', a: 'Sign up, go to your dashboard, and join the affiliate programme. Share your referral link. Earn 20% commission on every paid event your referrals create. Reach 15 referrals to unlock 25% permanently.' },
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-dark shadow-[0_1px_0_rgba(255,255,255,0.06)]' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.svg" alt="GuestVue" width={36} height={36} priority className="transition-transform duration-300 group-hover:scale-110" />
            <span className="font-display font-black text-white text-lg tracking-tight">GuestVue</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/60">
            {[['#how-it-works','How it works'],['#features','Features'],['#pricing','Pricing'],['#faq','FAQ'],['/about','About']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors duration-200">{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-2">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary text-sm px-5 py-2.5">
              <span>Get started free</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass-dark border-t border-white/10 px-4 py-5 space-y-1">
            {[['#how-it-works','How it works'],['#features','Features'],['#pricing','Pricing'],['#faq','FAQ'],['/about','About'],['/contact','Contact']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium">{label}</a>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link href="/auth/login" className="block py-3 px-4 text-white/70 text-center font-semibold hover:text-white rounded-xl hover:bg-white/5 transition-all">Sign in</Link>
              <Link href="/auth/signup" className="btn-primary text-center justify-center"><span>Get started free →</span></Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-hero-mesh bg-grid pt-16">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal/10 blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-coral/10 blur-[100px] animate-float-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-cobalt/10 blur-[80px] animate-float-fast pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="section-label-dark">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse inline-block" />
                  Now live in Nigeria
                </span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08] mb-6">
                Every Guest.<br />
                Every Moment.<br />
                <span className="text-gradient-brand">One QR Code.</span>
              </h1>

              <p className="text-white/60 text-lg max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                Guests scan, upload photos and videos — you collect every memory, get a live slideshow, and generate AI reels for TikTok. No app needed. Works on any phone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link href="/auth/signup" className="btn-primary text-base px-7 py-4">
                  <span>Create your first event free</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
                </Link>
                <a href="#how-it-works" className="btn-ghost text-base px-7 py-4">
                  See how it works
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/></svg>
                </a>
              </div>

              <p className="text-white/30 text-sm">Free plan · No credit card · Ready in 2 minutes</p>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
                {[['🔒','Encrypted storage'],['⚡','3G optimised'],['📱','All phones'],['🇳🇬','Made in Nigeria']].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-white/50 text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Phone mockup */}
            <div className="hidden lg:flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow behind phone */}
                <div className="absolute inset-0 bg-teal/20 blur-[60px] rounded-full scale-75 translate-y-8" />

                <div className="phone-frame w-64 h-[520px] relative animate-float-slow">
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-10" />

                  {/* Screen content — guest upload UI */}
                  <div className="w-full h-full bg-[#0a1628] flex flex-col">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-8 pb-2">
                      <span className="text-white text-xs font-medium">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2.5 border border-white/60 rounded-sm relative"><div className="absolute inset-y-0 left-0 w-3/4 bg-white/60 rounded-sm" /></div>
                      </div>
                    </div>

                    {/* App header */}
                    <div className="px-5 pt-4 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-gradient-teal-coral" />
                        <span className="text-white font-bold text-sm">GuestVue</span>
                      </div>
                    </div>

                    {/* Upload area */}
                    <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
                      <div className="w-full rounded-2xl border-2 border-dashed border-teal/40 bg-teal/5 flex flex-col items-center gap-3 py-8 px-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-teal-coral flex items-center justify-center text-2xl">📸</div>
                        <p className="text-white text-sm font-bold text-center">Tap to add your photos</p>
                        <p className="text-white/40 text-xs text-center">Share your memories from<br/>Adaeze &amp; Chukwuma&apos;s Wedding</p>
                      </div>

                      {/* Uploaded thumbnails */}
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                        {['bg-teal/30','bg-coral/30','bg-cobalt/30','bg-teal/20','bg-coral/20','bg-indigo-400/20'].map((c,i) => (
                          <div key={i} className={`aspect-square rounded-xl ${c} flex items-center justify-center`}>
                            <span className="text-lg">{['📷','🥂','💃','🎊','🎶','🌟'][i]}</span>
                          </div>
                        ))}
                      </div>

                      <div className="w-full bg-teal rounded-xl py-3 flex items-center justify-center gap-2">
                        <span className="text-white font-bold text-sm">Upload 6 photos</span>
                        <span className="text-white/70 text-xs">✓</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 pb-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white/40 text-xs">Gallery capacity</span>
                        <span className="text-teal text-xs font-semibold">124/500</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-1/4 bg-gradient-teal-coral rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <div className="absolute -left-20 top-24 glass rounded-2xl px-4 py-3 shadow-teal animate-float" style={{animationDelay:'1s'}}>
                  <p className="text-white text-xs font-semibold">📸 New upload</p>
                  <p className="text-white/50 text-xs">Emeka just added 3 photos</p>
                </div>
                <div className="absolute -right-16 bottom-32 glass rounded-2xl px-4 py-3 shadow-coral animate-float-slow" style={{animationDelay:'2s'}}>
                  <p className="text-teal text-xs font-bold">✨ AI Reel ready!</p>
                  <p className="text-white/50 text-xs">Your highlight reel is done</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-subtle">
          <span className="text-white/30 text-xs font-medium">Scroll to explore</span>
          <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SCROLLING MARQUEE — social proof logos/labels
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#0a0f1e] border-y border-white/5 py-5 overflow-hidden">
        <div className="flex overflow-hidden">
          <div className="marquee-track">
            {[...LOGOS,...LOGOS,...LOGOS].map((icon, i) => (
              <span key={i} className="text-2xl opacity-60 hover:opacity-100 transition-opacity">{icon}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════ */}
      <section className="bg-[#060d1a] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['2 min','Event setup time'],['0','Apps to install'],['Any phone','iOS & Android'],['20%','Affiliate commission']].map(([val, label]) => (
            <div key={label}>
              <div className="stat-number mb-2">{val}</div>
              <p className="text-white/40 text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-[#060d1a] py-24 relative">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label-dark mb-4">How it works</div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">Three steps. No app. Done.</h2>
            <p className="text-white/50 max-w-xl mx-auto">Works on every phone in Nigeria — old iPhones, budget Androids, everything.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="card-dark p-8 group relative overflow-hidden">
                <div className="absolute top-4 right-4 font-display font-black text-7xl text-white/3 select-none">{s.n}</div>
                <div className="step-number mb-6">{i + 1}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-teal/40 text-2xl z-10">›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label mb-4">Features</div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-midnight-900 mb-4">
              Everything you need.<br />
              <span className="text-gradient-brand">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-midnight-500 max-w-lg mx-auto">Built from the ground up for Nigerian events — weddings, birthdays, corporate activations, concerts.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-feature group">
                <div className="feature-icon mb-5">{f.icon}</div>
                <h3 className="font-display font-bold text-lg text-midnight-900 mb-2">{f.title}</h3>
                <p className="text-midnight-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA inside features */}
          <div className="mt-12 rounded-3xl bg-hero-mesh bg-grid p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-teal/5 blur-xl" />
            <div className="relative">
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">Ready to try it?</h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">Create your first event for free. No credit card. No app. Just a QR code and your guests.</p>
              <Link href="/auth/signup" className="btn-primary inline-flex text-base px-8 py-4">
                <span>Start for free today</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PRICING — PERSONAL
      ══════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 bg-[#060d1a] relative">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="section-label-dark mb-4">Pricing</div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-4">Pay once per event. Keep every photo.</h2>
            <p className="text-white/50 max-w-lg mx-auto">No subscriptions for personal use. Pay per event, own your memories.</p>
          </div>

          {/* Personal plans */}
          <div className="grid sm:grid-cols-3 gap-5 mb-6">
            {Object.values(PLANS).map((plan, i) => {
              const isFeatured = plan.id === 'pro'
              return (
                <div key={plan.id} className={`pricing-card ${isFeatured ? 'featured' : ''}`}>
                  {isFeatured && (
                    <div className="absolute top-4 right-4">
                      <span className="badge-new">Most Popular</span>
                    </div>
                  )}
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isFeatured ? 'text-teal' : 'text-midnight-400'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`font-display font-black text-4xl ${isFeatured ? 'text-white' : 'text-midnight-900'}`}>
                      {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                    </span>
                    {plan.price > 0 && <span className={`text-sm ${isFeatured ? 'text-white/50' : 'text-midnight-400'}`}>/event</span>}
                  </div>
                  <p className={`text-xs mb-6 ${isFeatured ? 'text-white/40' : 'text-midnight-400'}`}>
                    {plan.price === 0 ? 'No credit card needed' : 'One-time per event'}
                  </p>

                  <div className="space-y-2.5 mb-8">
                    {[
                      `${plan.uploads === 9999 || plan.uploads > 999 ? 'Unlimited' : plan.uploads} uploads`,
                      'activePageHours' in plan ? '24-hour active page' : `${(plan as any).activePageDays}-day active page`,
                      plan.bulkDownload ? 'Bulk download' : 'Single file download only',
                      plan.slideshow ? 'Live slideshow ✓' : null,
                      plan.basicReel ? 'AI reel included ✓' : null,
                    ].filter(Boolean).map((item) => (
                      <div key={item} className={isFeatured ? 'check-item-dark' : 'check-item'}>
                        <span className="check">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/auth/signup"
                    className={`block text-center py-3 rounded-2xl font-bold text-sm transition-all ${
                      isFeatured
                        ? 'bg-gradient-teal-coral text-white hover:opacity-90 shadow-teal'
                        : 'bg-midnight-100 text-midnight-700 hover:bg-midnight-200'
                    }`}>
                    {plan.price === 0 ? 'Start free' : `Get ${plan.name}`} →
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Divider */}
          <div className="neon-line my-16" />

          {/* Vendor/Professional plans */}
          <div className="text-center mb-10">
            <div className="section-label-dark mb-4">For Professionals</div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">Vendor &amp; Planner Bundles</h3>
            <p className="text-white/50 max-w-lg mx-auto">One-time bundle for event planners, photographers, and agencies. Not a subscription — buy once, use across multiple events.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(PLANNER_PLANS).map((plan, i) => {
              const isTop = plan.id === 'jagaban'
              return (
                <div key={plan.id} className={`pricing-card ${isTop ? 'featured' : ''} relative`}>
                  {isTop && <div className="absolute top-4 right-4"><span className="badge-hot">🔥 Top Tier</span></div>}
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isTop ? 'text-teal' : 'text-midnight-400'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className={`font-display font-black text-3xl ${isTop ? 'text-white' : 'text-midnight-900'}`}>{formatNaira(plan.price)}</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {[
                      `${plan.activeEvents === -1 ? 'Unlimited' : plan.activeEvents} events`,
                      `${plan.uploadsPerEvent === -1 ? 'Unlimited' : plan.uploadsPerEvent} uploads/event`,
                      'Bulk download',
                      'Live slideshow',
                    ].map(item => (
                      <div key={item} className={isTop ? 'check-item-dark' : 'check-item'}>
                        <span className="check">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/auth/signup"
                    className={`block text-center py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isTop ? 'bg-gradient-teal-coral text-white hover:opacity-90' : 'bg-midnight-100 text-midnight-700 hover:bg-midnight-200'
                    }`}>
                    Get {plan.name} →
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="text-center text-white/30 text-sm mt-6">
            Need custom pricing for a large agency or corporate client?{' '}
            <Link href="/contact" className="text-teal hover:underline">Contact us</Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="section-label mb-4">FAQ</div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-midnight-900 mb-3">Frequently asked questions</h2>
            <p className="text-midnight-500">Everything you need to know before getting started.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  openFaq === i ? 'border-teal shadow-[0_0_0_1px_rgba(20,184,166,0.3)]' : 'border-midnight-100 hover:border-midnight-200'
                }`}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className={`font-display font-semibold text-sm sm:text-base transition-colors ${
                    openFaq === i ? 'text-[#0A4F6B]' : 'text-midnight-900'
                  }`}>{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openFaq === i ? 'bg-teal text-white rotate-180' : 'bg-midnight-100 text-midnight-500'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/>
                    </svg>
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-midnight-500 text-sm leading-relaxed border-t border-midnight-50">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-midnight-400 text-sm mb-3">Still have questions?</p>
            <Link href="/contact" className="btn-primary inline-flex text-sm px-6 py-3">
              <span>Get in touch</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section className="relative py-28 bg-hero-mesh bg-grid overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-teal/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-coral/10 blur-[100px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="section-label-dark mb-6 mx-auto w-fit">Launch your event today</div>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Your next event deserves<br />
            <span className="text-gradient-brand">every single memory.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
            Set up in 2 minutes. Share a QR code. Collect photos from every guest automatically. No app, no friction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary text-base px-9 py-4">
              <span>Create your first event free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>
            </Link>
            <Link href="/pricing" className="btn-ghost text-base px-9 py-4">View all plans</Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="bg-[#040912] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo.svg" alt="GuestVue" width={32} height={32} />
                <span className="font-display font-black text-white text-lg">GuestVue</span>
              </Link>
              <p className="text-white/40 text-sm leading-relaxed mb-4">The QR-powered event media platform built for Africa. Collect every guest moment automatically.</p>
              <div className="flex gap-3">
                {[['Instagram', '📸'], ['Twitter/X', '🐦'], ['WhatsApp', '💬']].map(([label, icon]) => (
                  <div key={label} title={label} className="w-9 h-9 glass rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-sm">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Product</p>
              <div className="space-y-3">
                {[['#how-it-works','How it works'],['#features','Features'],['#pricing','Pricing'],['#faq','FAQ'],['/pricing','All plans']].map(([href, label]) => (
                  <a key={href} href={href} className="block text-white/40 text-sm hover:text-white transition-colors">{label}</a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Company</p>
              <div className="space-y-3">
                {[['/about','About us'],['/contact','Contact'],['/faq','Help centre']].map(([href, label]) => (
                  <Link key={href} href={href} className="block text-white/40 text-sm hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">Legal</p>
              <div className="space-y-3">
                {[['/terms','Terms of service'],['/privacy','Privacy policy']].map(([href, label]) => (
                  <Link key={href} href={href} className="block text-white/40 text-sm hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
              <div className="mt-8">
                <p className="text-white/40 text-xs mb-1">Contact</p>
                <a href="mailto:hello@theguestvue.com" className="text-teal text-sm hover:underline">hello@theguestvue.com</a>
              </div>
            </div>
          </div>

          <div className="neon-line mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-xs">
            <p>© {new Date().getFullYear()} GuestVue. All rights reserved. Lagos, Nigeria.</p>
            <p>Made with ❤️ for African events</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
