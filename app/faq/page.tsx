'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

const faqs = [
  {
    category: 'Getting started',
    q: 'What is GuestVue?',
    a: 'GuestVue is a QR-code-powered event media platform. You create an event, share a QR code, and your guests can upload photos and videos directly from their phones — no app download or account needed. All media collects in your dashboard in real time, ready to download, share, or turn into an AI highlight reel.',
  },
  {
    category: 'Technical',
    q: 'Does it work without internet?',
    a: 'GuestVue requires a basic internet connection to upload media. The platform is optimised for 3G and 4G networks common across Nigeria and Africa. The guest upload interface is lightweight — typically under 200KB to load — so it opens quickly even on slow connections. Offline functionality is not currently supported, but uploads can be retried automatically if the connection drops mid-upload.',
  },
  {
    category: 'Technical',
    q: 'Which phones are supported?',
    a: 'GuestVue works on all modern smartphones with a web browser. This includes iPhone 6 and newer running iOS 12 or higher, and Android phones running Android 5 (Lollipop) or newer. There is no app to install — guests just scan the QR code and the upload page opens in their browser. Older feature phones are not supported.',
  },
  {
    category: 'Using GuestVue',
    q: 'How do guests upload their photos?',
    a: 'Guests scan the QR code displayed at your event — either printed on signage, projected on a screen, or shared as a link via WhatsApp. The QR opens a simple upload page in their phone\'s browser. They can pick one or more photos from their camera roll, take a new photo with their camera, or upload a short video. Files are compressed automatically for faster upload and the photos appear in your gallery within seconds.',
  },
  {
    category: 'Plans and pricing',
    q: 'Is there a free plan?',
    a: 'Yes. The Free plan lets you create an event, collect up to 30 guest uploads, and keep the gallery active for 24 hours — completely free. No credit card is required to get started. You can upgrade to Flex or Pro at any time before or during your event if you need more uploads or a longer active page.',
  },
  {
    category: 'Plans and pricing',
    q: 'How long are my files stored?',
    a: 'Storage duration depends on your plan. Free events have a 24-hour active window and files are deleted after that. Flex events are stored for 7 days after the event ends. Pro events are stored for 30 days. Vendor Jagaban bundle holders receive up to 12 months of storage. You should download your media before the storage period ends — GuestVue is not responsible for data lost after the storage window closes.',
  },
  {
    category: 'Downloads',
    q: 'Can I download all photos at once?',
    a: 'Bulk download is available on the Flex plan, Pro plan, and all Vendor bundle tiers. You can select individual photos or click "Download All" to get everything at once. Free plan users can view their gallery and download photos individually, but bulk/ZIP download requires an upgrade. An upsell prompt will guide you to the appropriate plan.',
  },
  {
    category: 'Features',
    q: 'What is an AI reel?',
    a: 'An AI reel is an automatically generated short video highlight of your event. GuestVue selects your best guest photos, combines them into a dynamic slideshow with transitions and timing designed for Instagram Reels or TikTok, and renders the video ready for download. AI reel generation is included on the Pro plan and the Tycoon business activation. You can also add it to any event as a one-time add-on.',
  },
  {
    category: 'Privacy and security',
    q: 'Is my data safe?',
    a: 'Yes. All uploaded media is stored on Cloudflare R2 object storage with server-side encryption. User account data and event information are managed through Supabase with row-level security, meaning your data is isolated from other users\' data at the database level. We do not sell, share, or use your uploaded content for any purpose beyond delivering the service to you. See our Privacy Policy for complete details.',
  },
  {
    category: 'Earning with GuestVue',
    q: 'How do I become an affiliate?',
    a: 'After creating a GuestVue account, go to your dashboard and click "Affiliate Programme." You will receive a unique referral link instantly. Share it with friends, fellow photographers, event planners, or on social media. You earn 20% commission on every paid event created through your link. After 15 successful referrals, your commission rate increases to 25% permanently. The minimum payout is ₦5,000, and payouts are processed within 5 business days of your request.',
  },
]

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

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
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] py-16 text-center text-white px-4">
        <h1 className="font-black text-4xl sm:text-5xl mb-4">Frequently asked questions</h1>
        <p className="text-white/75 max-w-md mx-auto text-base">
          Everything you need to know about GuestVue.
        </p>
      </section>

      {/* FAQ list */}
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <div className="flex-1">
                  <span className="text-xs font-bold text-[#14B8A6] uppercase tracking-wider block mb-1">
                    {faq.category}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base leading-snug">{faq.q}</span>
                </div>
                <span className={`mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-100 bg-slate-50 flex items-center justify-center transition-transform ${openIdx === i ? 'rotate-180' : ''}`}>
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-14 bg-white rounded-2xl border border-slate-100 p-7 text-center">
          <h2 className="font-black text-xl text-slate-900 mb-2">Still have questions?</h2>
          <p className="text-sm text-slate-500 mb-5">
            Our support team responds within 24 hours, Monday to Friday, 9am–6pm WAT.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#0A4F6B] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#1E5AAF] transition-all text-sm"
          >
            Contact support →
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
