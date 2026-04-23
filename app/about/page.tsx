import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'About GuestVue — Our Story and Mission',
  description: 'Learn about GuestVue, our mission to make event memories accessible for everyone, and how we are building for Africa.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-semibold text-slate-600 hover:text-[#0A4F6B] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
              Sign in
            </Link>
            <Link href="/auth/signup" className="text-sm font-bold text-white bg-[#0A4F6B] px-4 py-2 rounded-xl transition-all hover:bg-[#1E5AAF]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A4F6B] to-[#1E5AAF] py-20 text-center text-white px-4">
        <h1 className="font-black text-4xl sm:text-5xl mb-4">About GuestVue</h1>
        <p className="text-white/75 text-lg max-w-xl mx-auto">
          Making event memories accessible for every guest, at every occasion, on every phone.
        </p>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-14">
        <section>
          <h2 className="font-black text-2xl text-slate-900 mb-4">What is GuestVue?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            GuestVue is a QR-code-powered event media platform built for Nigerian events and the broader African market. We help event hosts — whether planning a wedding in Lagos, a corporate gala in Abuja, or a birthday party in Ibadan — collect every photo and video from their guests without anyone needing to download an app or create an account.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Guests simply scan a QR code displayed at the event, and they are taken to a lightweight, mobile-optimised upload page. They can pick photos from their camera roll or take a new one on the spot. The media appears in the host&apos;s gallery in real time.
          </p>
        </section>

        <section>
          <h2 className="font-black text-2xl text-slate-900 mb-4">Our mission</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Events are among the most important moments in people&apos;s lives. Yet so many memories get trapped on individual phones, never shared, never preserved together. GuestVue exists to change that.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            Our mission is to make collective event memories accessible to everyone — regardless of the device they own, the network they are on, or the technical experience they have. We believe that a guest at a wedding in rural Nigeria deserves the same seamless experience as someone at a tech launch in Victoria Island.
          </p>
          <p className="text-slate-600 leading-relaxed">
            That is why we obsess over performance on 3G networks, compatibility with older Android devices, and simplicity above all else.
          </p>
        </section>

        <section>
          <h2 className="font-black text-2xl text-slate-900 mb-4">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { step: '1', title: 'Host creates event', desc: 'Sign up, name your event, choose a plan, and receive a branded QR code.' },
              { step: '2', title: 'Guests upload freely', desc: 'Guests scan the QR code and upload photos or videos directly in their browser. Zero friction.' },
              { step: '3', title: 'Host collects everything', desc: 'Real-time gallery, bulk download, live slideshow, and optional AI highlight reel — all in your dashboard.' },
            ].map(s => (
              <div key={s.step} className="bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#0A4F6B] text-white font-black text-sm flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-black text-2xl text-slate-900 mb-4">Who we serve</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            GuestVue serves individual event hosts who need a simple solution for a one-time event, and professionals — photographers, event planners, and agencies — who run multiple events and need a scalable, reliable media collection platform.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Our vendor bundle plans are designed specifically for professionals who want predictable costs and the ability to run back-to-back events without paying per event each time.
          </p>
        </section>

        <section>
          <h2 className="font-black text-2xl text-slate-900 mb-4">Our technology commitments</h2>
          <ul className="space-y-3">
            {[
              'Media is stored on Cloudflare R2 with server-side encryption — your files are safe.',
              'Authentication and database are managed by Supabase with row-level security.',
              'The guest upload page is optimised for low-bandwidth environments — images are compressed client-side before upload.',
              'We are NDPR (Nigeria Data Protection Regulation) compliant in how we collect, process, and store personal data.',
              'No third-party analytics trackers are embedded on guest upload pages.',
            ].map(item => (
              <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                <span className="mt-1 text-[#14B8A6] flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#F8FAFC] rounded-2xl p-7 border border-slate-100">
          <h2 className="font-black text-xl text-slate-900 mb-4">Contact us</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p><strong>Company:</strong> GuestVue</p>
            <p><strong>Location:</strong> Lagos, Nigeria</p>
            <p><strong>Email:</strong>{' '}
              <a href="mailto:guestvueapp@outlook.com" className="text-[#0A4F6B] hover:underline">
                guestvueapp@outlook.com
              </a>
            </p>
            <p><strong>Support:</strong>{' '}
              <a href="mailto:hello@theguestvue.com" className="text-[#0A4F6B] hover:underline">
                hello@theguestvue.com
              </a>
            </p>
            <p><strong>Instagram:</strong>{' '}
              <a href="https://instagram.com/guestvue" target="_blank" rel="noopener noreferrer" className="text-[#0A4F6B] hover:underline">
                @guestvue
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
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
