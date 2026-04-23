import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Terms and Conditions — GuestVue',
  description: 'GuestVue Terms and Conditions. Effective April 2026.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Logo size={30} />
          </Link>
          <Link href="/auth/signup" className="text-sm font-bold text-white bg-[#0A4F6B] px-4 py-2 rounded-xl hover:bg-[#1E5AAF] transition-all">
            Get started free
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-14">
        <div className="mb-10">
          <h1 className="font-black text-3xl sm:text-4xl text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-slate-400">Effective date: April 2026 &middot; GuestVue, Lagos, Nigeria</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">1. About GuestVue</h2>
            <p>
              GuestVue (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is an event media technology platform operated from Lagos, Nigeria. We provide a QR-code-powered service that enables event hosts to collect photos and videos uploaded by their guests through a web-based interface. By accessing or using GuestVue, you agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">2. Service description</h2>
            <p>
              GuestVue provides the following services: event creation and management tools, a guest-facing media upload interface accessible via QR code or direct link, a host dashboard for viewing and downloading uploaded media, optional features including live slideshows and AI-generated highlight reels, and an affiliate referral programme.
            </p>
            <p className="mt-3">
              Features available to any individual event depend on the plan selected at the time of event creation or activation.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">3. User obligations</h2>
            <p>
              By using GuestVue, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>Provide accurate and complete information when creating your account.</li>
              <li>Maintain the security and confidentiality of your login credentials.</li>
              <li>Notify us promptly if you suspect unauthorised access to your account.</li>
              <li>Use the platform only for lawful purposes and in compliance with these terms.</li>
              <li>Not misrepresent your identity, affiliation, or the nature of your events.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">4. Acceptable use</h2>
            <p>You may not use GuestVue to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>Upload, store, or distribute illegal, obscene, defamatory, harassing, or harmful content.</li>
              <li>Infringe on the intellectual property, privacy, or other rights of any person.</li>
              <li>Upload content depicting minors in a sexual or exploitative manner (this is a criminal offence under Nigerian law and will be reported to relevant authorities).</li>
              <li>Use automated tools, bots, or scripts to interact with the platform without our written consent.</li>
              <li>Attempt to gain unauthorised access to any system, account, or data.</li>
              <li>Resell, sublicense, or commercially exploit GuestVue&apos;s services without an authorised vendor arrangement.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove any content and terminate accounts that violate this policy, without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">5. Content ownership and licence</h2>
            <p>
              You retain all ownership rights to media uploaded by you or your guests through GuestVue. By uploading content to the platform, you grant GuestVue a limited, non-exclusive, royalty-free licence to store, process, and display your content solely for the purpose of delivering the service to you.
            </p>
            <p className="mt-3">
              We do not claim ownership of your uploaded media. We will not use your media for advertising, marketing, or any purpose beyond operating the service without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">6. Payment terms</h2>
            <p>
              Paid plans and bundles are charged in Nigerian Naira (NGN) at the prices listed on our pricing page. Payments are processed securely through Paystack. By completing a payment, you authorise GuestVue to charge your selected payment method for the stated amount.
            </p>
            <p className="mt-3">
              All prices are stated inclusive of applicable taxes unless stated otherwise. GuestVue reserves the right to modify pricing with 14 days&apos; notice. Price changes do not affect already-activated events or bundles.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">7. Refund policy</h2>
            <p>
              Refunds are not available once an event has been activated — meaning the guest upload page has gone live and guests can upload media. This is because server resources, storage, and processing capacity are allocated immediately upon activation.
            </p>
            <p className="mt-3">
              If you experience a confirmed technical failure on our end that prevents your event from functioning, contact us at <a href="mailto:hello@theguestvue.com" className="text-[#0A4F6B] hover:underline">hello@theguestvue.com</a> within 48 hours of the event. We will investigate and, at our sole discretion, offer a credit, plan extension, or partial refund.
            </p>
            <p className="mt-3">
              For events that have not yet been activated, a full refund may be requested within 24 hours of payment.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">8. Storage and data retention</h2>
            <p>
              Media files are stored for the duration specified by the plan associated with each event. Once the storage period expires, media is automatically and permanently deleted from our systems. GuestVue is not liable for loss of data after the storage window has closed.
            </p>
            <p className="mt-3">
              We strongly recommend downloading all media before your plan&apos;s storage period ends. We send email reminders before deletion where technically feasible.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">9. Disclaimer of warranties</h2>
            <p>
              GuestVue is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely secure. We make no warranty regarding the accuracy or completeness of any content on the platform.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by applicable law, GuestVue and its officers, employees, and affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising out of your use of or inability to use the platform, including loss of data, loss of profits, or loss of goodwill.
            </p>
            <p className="mt-3">
              Our total aggregate liability for any claim arising from or related to these terms shall not exceed the amount you paid to us in the 30 days preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">11. Affiliate programme terms</h2>
            <p>
              Participants in the GuestVue Affiliate Programme agree to promote GuestVue honestly and accurately. Commission is earned only on genuine referrals resulting in a paid transaction. GuestVue reserves the right to withhold or reverse commission if fraud, policy abuse, or misrepresentation is detected. Commissions are paid to a bank account designated by the affiliate and are subject to a minimum threshold of ₦5,000.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">12. Governing law</h2>
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">13. Changes to these terms</h2>
            <p>
              We may update these Terms and Conditions from time to time. We will notify registered users of material changes via email or a prominent notice on the platform. Continued use of GuestVue after changes take effect constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{' '}
              <a href="mailto:guestvueapp@outlook.com" className="text-[#0A4F6B] hover:underline">guestvueapp@outlook.com</a>
            </p>
            <p className="mt-2">GuestVue &middot; Lagos, Nigeria</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>GuestVue &copy; {new Date().getFullYear()} &middot; Lagos, Nigeria</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/privacy" className="hover:text-[#0A4F6B]">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-[#0A4F6B]">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
