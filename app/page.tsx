import Link from 'next/link'
import { formatNaira, PLANS } from '@/lib/pricing'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cloud">
      {/* Nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-midnight-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center">
              <span className="font-display font-black text-white text-sm">GV</span>
            </div>
            <span className="font-display font-black text-midnight-900 text-lg">GuestVue</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-midnight-500">
            <a href="#how-it-works" className="hover:text-midnight-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-midnight-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm font-semibold text-midnight-600 hover:text-midnight-900 px-3 py-2 rounded-xl hover:bg-midnight-50 transition-all">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-bold text-white bg-ocean hover:bg-ocean-600 px-4 py-2 rounded-xl shadow-brand transition-all">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-95" />
        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            Nigeria&apos;s first AI event media platform
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white leading-tight mb-5">
            Every Guest. Every Moment.<br />
            <span className="opacity-80">One QR Code.</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto mb-8">
            Guests scan, upload photos and videos — you collect every memory, get a live slideshow, and generate AI reels for TikTok and Instagram. No app needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-ocean font-black rounded-2xl shadow-2xl hover:scale-105 transition-all text-base">
              Create your first event free →
            </Link>
            <a href="#how-it-works" className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-base">
              See how it works
            </a>
          </div>
          <p className="text-white/50 text-xs mt-6">Free plan · No credit card · Ready in 2 minutes</p>
        </div>

        {/* Wave */}
        <div className="relative">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1440 20 1200 0 720 0C240 0 0 20 0 20L0 60Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-midnight-900 mb-3">How GuestVue works</h2>
          <p className="text-midnight-400 text-base max-w-lg mx-auto">Three steps. No app. Works on every phone in Nigeria.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '🎉', title: 'Create your event', desc: 'Name your event, choose a plan, and get a branded QR code in under 2 minutes.' },
            { step: '02', icon: '📱', title: 'Guests scan & upload', desc: 'They scan the QR, pick photos from their camera roll or take a new one. Done.' },
            { step: '03', icon: '🎬', title: 'You get everything', desc: 'Gallery fills up live. Download all at once or generate an AI reel for Instagram.' },
          ].map(s => (
            <div key={s.step} className="bg-white rounded-2xl border border-midnight-100 p-6 relative overflow-hidden">
              <span className="absolute top-4 right-4 font-display font-black text-5xl text-midnight-50">{s.step}</span>
              <span className="text-3xl mb-4 block">{s.icon}</span>
              <h3 className="font-display font-bold text-lg text-midnight-900 mb-2">{s.title}</h3>
              <p className="text-sm text-midnight-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-midnight-900 mb-3">Simple, Naira pricing</h2>
            <p className="text-midnight-400">Pay per event. No monthly fees on the individual plan.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {([
              { plan: PLANS.free, features: ['50 uploads', '24hr guest page', 'QR code included', 'Basic gallery'] },
              { plan: PLANS.flex, features: ['500 uploads', '30-day guest page', 'Bulk download ZIP', 'Basic AI Reel', 'Live Slideshow'], popular: true },
              { plan: PLANS.pro, features: ['Unlimited uploads', '90-day guest page', 'Advanced AI Reel', 'Content moderation', 'Priority support'] },
            ] as { plan: typeof PLANS[keyof typeof PLANS]; features: string[]; popular?: boolean }[]).map(({ plan, features, popular }) => (
              <div key={plan.id}
                className={`rounded-2xl border-2 p-6 relative ${popular ? 'border-ocean bg-ocean/5 shadow-brand' : 'border-midnight-100'}`}>
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-coral text-white text-xs font-black px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <p className="font-display font-bold text-xl text-midnight-900">{plan.name}</p>
                <p className={`font-display font-black text-3xl mt-1 mb-4 ${popular ? 'text-ocean' : 'text-midnight-900'}`}>
                  {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                  {plan.price > 0 && <span className="text-base font-semibold text-midnight-400">/event</span>}
                </p>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-midnight-600">
                      <span className={popular ? 'text-ocean' : 'text-teal'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    popular
                      ? 'bg-ocean text-white shadow-brand hover:bg-ocean-600'
                      : 'border border-midnight-200 text-midnight-700 hover:bg-midnight-50'
                  }`}>
                  {plan.price === 0 ? 'Start free' : `Get ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-brand rounded-3xl p-10 text-white">
          <h2 className="font-display font-black text-3xl mb-3">Your next event starts here</h2>
          <p className="text-white/70 mb-6">Join event hosts across Lagos, Abuja, and Ibadan collecting memories with GuestVue.</p>
          <Link href="/auth/signup"
            className="inline-block bg-white text-ocean font-black px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-2xl">
            Create your event free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-midnight-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-midnight-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="font-display font-black text-white text-xs">GV</span>
            </div>
            <span>GuestVue © 2025</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-midnight-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-midnight-700 transition-colors">Terms</a>
            <Link href="/auth/signup" className="hover:text-midnight-700 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
