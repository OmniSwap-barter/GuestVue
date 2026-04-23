import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Contact — GuestVue',
  description: 'Get in touch with the GuestVue team. Support, partnerships, and business enquiries.',
}

export default function ContactPage() {
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
        <h1 className="font-black text-4xl sm:text-5xl mb-4">Get in touch</h1>
        <p className="text-white/75 max-w-md mx-auto text-base">
          We respond to all enquiries within 24 hours, Monday to Friday, 9am–6pm WAT.
        </p>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid sm:grid-cols-2 gap-8">

          {/* Contact info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Contact details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0A4F6B]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Support email</p>
                    <a href="mailto:hello@theguestvue.com" className="text-sm text-[#0A4F6B] hover:underline font-medium">
                      hello@theguestvue.com
                    </a>
                    <p className="text-xs text-slate-400 mt-0.5">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0A4F6B]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Business enquiries</p>
                    <a href="mailto:guestvueapp@outlook.com" className="text-sm text-[#0A4F6B] hover:underline font-medium">
                      guestvueapp@outlook.com
                    </a>
                    <p className="text-xs text-slate-400 mt-0.5">Partnerships, vendor deals, press</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0A4F6B]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Support hours</p>
                    <p className="text-sm text-slate-700 font-medium">Monday – Friday</p>
                    <p className="text-xs text-slate-400">9:00am – 6:00pm WAT (Lagos time)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0A4F6B]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0A4F6B]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                    <p className="text-sm text-slate-700 font-medium">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Follow us</h2>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/guestvue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#0A4F6B] hover:text-[#0A4F6B] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @guestvue
                </a>
                <a
                  href="https://twitter.com/guestvue"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-[#0A4F6B] hover:text-[#0A4F6B] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @guestvue
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-1">Send us a message</h2>
            <p className="text-xs text-slate-400 mb-5">This form sends directly to our support inbox.</p>
            <form
              action="mailto:hello@theguestvue.com"
              method="GET"
              encType="text/plain"
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="name">
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Amara Okafor"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-[#F8FAFC] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="amara@example.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-[#F8FAFC] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="subject">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-[#F8FAFC] text-slate-800 focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B] transition-all"
                >
                  <option value="General enquiry">General enquiry</option>
                  <option value="Technical support">Technical support</option>
                  <option value="Billing question">Billing question</option>
                  <option value="Business / partnership">Business / partnership</option>
                  <option value="Affiliate programme">Affiliate programme</option>
                  <option value="Press / media">Press / media</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-[#F8FAFC] text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#0A4F6B] focus:ring-1 focus:ring-[#0A4F6B] transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-[#0A4F6B] text-white font-bold rounded-xl hover:bg-[#1E5AAF] transition-all text-sm"
              >
                Send message
              </button>
              <p className="text-xs text-slate-400 text-center">
                This opens your email client. Alternatively, email us directly at{' '}
                <a href="mailto:hello@theguestvue.com" className="text-[#0A4F6B] hover:underline">
                  hello@theguestvue.com
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>GuestVue &copy; {new Date().getFullYear()} &middot; Lagos, Nigeria</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/terms" className="hover:text-[#0A4F6B]">Terms</Link>
          <Link href="/privacy" className="hover:text-[#0A4F6B]">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
