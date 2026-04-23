import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Privacy Policy — GuestVue',
  description: 'GuestVue Privacy Policy. NDPR compliant. Effective April 2026.',
}

export default function PrivacyPage() {
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
          <h1 className="font-black text-3xl sm:text-4xl text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Effective date: April 2026 &middot; GuestVue, Lagos, Nigeria</p>
          <p className="text-xs text-slate-400 mt-1">This policy complies with the Nigeria Data Protection Regulation (NDPR) 2019.</p>
        </div>

        <div className="space-y-8 text-slate-600 text-sm leading-relaxed">

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">1. Who we are</h2>
            <p>
              GuestVue is an event media technology platform operated from Lagos, Nigeria. We are the data controller for personal data collected through our platform. You can contact our data protection contact at: <a href="mailto:guestvueapp@outlook.com" className="text-[#0A4F6B] hover:underline">guestvueapp@outlook.com</a>.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">2. Data we collect</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-slate-800 mb-1.5">Account data (hosts):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Name and email address (collected at sign-up)</li>
                  <li>Password (stored as a one-way cryptographic hash — never readable)</li>
                  <li>Billing information (processed and stored by Paystack — we do not store card numbers)</li>
                  <li>Referral code and affiliate data (if you join our programme)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1.5">Event data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Event name, date, hashtag, and custom settings</li>
                  <li>Plan purchased and payment reference</li>
                  <li>Upload count and storage usage</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1.5">Guest upload data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Uploaded photos and videos (stored until storage period expires)</li>
                  <li>File metadata (type, size, upload timestamp)</li>
                  <li>IP address hash (one-way hash for abuse prevention — not reversible to your IP)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800 mb-1.5">Technical data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Browser type and version (from User-Agent header)</li>
                  <li>Access timestamps and error logs</li>
                  <li>Session cookies (for authentication)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>To deliver the service:</strong> Creating and managing events, storing and displaying uploaded media, generating QR codes, and processing payments.</li>
              <li><strong>Content moderation:</strong> Reviewing flagged uploads for compliance with our acceptable use policy.</li>
              <li><strong>Service improvement:</strong> Aggregated, anonymised analytics to understand how the platform is used and improve performance.</li>
              <li><strong>Communication:</strong> Sending transactional emails (payment confirmations, storage expiry reminders, support responses).</li>
              <li><strong>Affiliate programme:</strong> Tracking referrals and calculating commission for programme participants.</li>
              <li><strong>Legal compliance:</strong> Fulfilling legal obligations under Nigerian law, including responding to lawful requests from authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">4. Legal basis for processing</h2>
            <p>
              Under the NDPR, we process your data on the following legal bases:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li><strong>Contract performance:</strong> Processing necessary to provide the service you have paid for or signed up to use.</li>
              <li><strong>Legitimate interests:</strong> Abuse prevention, security, aggregated analytics.</li>
              <li><strong>Legal obligation:</strong> Compliance with Nigerian law and regulatory requirements.</li>
              <li><strong>Consent:</strong> Where you have explicitly consented (e.g., marketing communications, where applicable).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">5. Data storage and retention</h2>
            <p>
              <strong>Infrastructure:</strong> Uploaded media files are stored on Cloudflare R2 object storage with server-side encryption (AES-256). User account data is stored in Supabase (PostgreSQL) with row-level security policies.
            </p>
            <p className="mt-3">
              <strong>Retention periods:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Uploaded media: deleted automatically after the plan&apos;s storage window (24 hours for Free, 7 days for Flex, 30 days for Pro, up to 12 months for Jagaban)</li>
              <li>Account data: retained while your account is active and for 90 days after account deletion</li>
              <li>Payment records: retained for 7 years for tax and accounting compliance</li>
              <li>Access logs: retained for 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">6. Data sharing</h2>
            <p>
              We do not sell your personal data to any third party. We share data only with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li><strong>Paystack:</strong> For payment processing. Governed by Paystack&apos;s own privacy policy.</li>
              <li><strong>Cloudflare:</strong> For media storage (R2) and content delivery.</li>
              <li><strong>Supabase:</strong> For database hosting and authentication services.</li>
              <li><strong>Resend:</strong> For transactional email delivery.</li>
              <li><strong>Law enforcement:</strong> When required by a valid Nigerian court order or statutory authority.</li>
            </ul>
            <p className="mt-3">
              All sub-processors are contractually required to protect your data and process it only for the stated purposes.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">7. Your rights under the NDPR</h2>
            <p>As a data subject under the Nigeria Data Protection Regulation, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li><strong>Access:</strong> Request a copy of your personal data we hold.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your data where no legal obligation requires retention.</li>
              <li><strong>Portability:</strong> Receive your data in a structured, commonly-used format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdrawal of consent:</strong> Where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at <a href="mailto:guestvueapp@outlook.com" className="text-[#0A4F6B] hover:underline">guestvueapp@outlook.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">8. Cookie policy</h2>
            <p>
              GuestVue uses the following types of cookies:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li><strong>Essential cookies:</strong> Session and authentication cookies required to keep you logged in. These cannot be disabled without losing functionality.</li>
              <li><strong>Preference cookies:</strong> Storing user interface preferences (e.g., dashboard view settings).</li>
            </ul>
            <p className="mt-3">
              We do not use third-party advertising or behavioural tracking cookies. The guest upload pages accessed by your event guests do not set any cookies.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">9. Children&apos;s privacy</h2>
            <p>
              GuestVue is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us immediately and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated to registered users via email. Continued use of the platform after an update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-lg mb-3">11. Contact and complaints</h2>
            <p>
              For any privacy-related questions or to file a complaint, contact:{' '}
              <a href="mailto:guestvueapp@outlook.com" className="text-[#0A4F6B] hover:underline">guestvueapp@outlook.com</a>
            </p>
            <p className="mt-2">
              If you are not satisfied with our response, you may lodge a complaint with the Nigeria Data Protection Bureau (NDPB) at <a href="https://ndpb.gov.ng" target="_blank" rel="noopener noreferrer" className="text-[#0A4F6B] hover:underline">ndpb.gov.ng</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>GuestVue &copy; {new Date().getFullYear()} &middot; Lagos, Nigeria</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link href="/terms" className="hover:text-[#0A4F6B]">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[#0A4F6B]">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
