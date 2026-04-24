import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createAdminClient, createUserAuthClient } from '@/lib/supabase/server'
import { formatNaira, AFFILIATE } from '@/lib/pricing'

export default async function AffiliatePage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: { session } } = await supabase.auth.getSession()
  const admin = session?.access_token
    ? createUserAuthClient(session.access_token)
    : createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')
  let affiliate = null

  if (profile.referral_code) {
    const { data } = await admin
      .from('affiliates')
      .select('*')
      .eq('referral_code', profile.referral_code)
      .single()
    affiliate = data
  }

  // Get referral history
  const { data: referrals } = affiliate
    ? await admin
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guestvue.com'
  const affiliateLink = profile.referral_code
    ? `${appUrl}/?ref=${profile.referral_code}`
    : null

  const isLoyalty = (affiliate?.total_referrals ?? 0) >= AFFILIATE.loyaltyThreshold
  const currentRate = isLoyalty ? AFFILIATE.loyaltyRate : AFFILIATE.standardRate
  const toNextTier = Math.max(0, AFFILIATE.loyaltyThreshold - (affiliate?.total_referrals ?? 0))

  return (
    <div className="min-h-screen bg-cloud">
      <header className="bg-white border-b border-midnight-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-midnight-400 hover:text-midnight-700">
            ← Dashboard
          </Link>
          <h1 className="font-display font-bold text-midnight-900">Affiliate Programme</h1>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero card */}
        <div className="bg-gradient-brand rounded-2xl p-6 text-white">
          <h2 className="font-display font-bold text-2xl mb-1">Earn with GuestVue</h2>
          <p className="text-white/70 text-sm mb-4">
            Refer event hosts and earn <strong>{Math.round(AFFILIATE.standardRate * 100)}% commission</strong> on every paid event.
            Hit {AFFILIATE.loyaltyThreshold} referrals and earn <strong>{Math.round(AFFILIATE.loyaltyRate * 100)}%</strong> forever.
          </p>
          {!affiliate ? (
            <form action="/api/affiliate/join" method="POST">
              <button type="submit"
                className="bg-white text-ocean font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-all">
                Join the Programme →
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-mono font-bold">{affiliateLink}</span>
              <button
                onClick={() => navigator.clipboard.writeText(affiliateLink || '')}
                className="ml-auto bg-white text-ocean text-xs font-bold px-3 py-1 rounded-lg hover:scale-105 transition-all"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {affiliate && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Referrals', value: affiliate.total_referrals, icon: '👥' },
                { label: 'Total Earned', value: formatNaira(Math.round(affiliate.total_earned / 100)), icon: '💰' },
                { label: 'Total Paid', value: formatNaira(Math.round(affiliate.total_paid / 100)), icon: '✅' },
                { label: 'Commission Rate', value: `${Math.round(currentRate * 100)}%`, icon: isLoyalty ? '🏆' : '⭐' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-midnight-100 p-4">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="font-display font-bold text-lg text-midnight-900">{s.value}</p>
                  <p className="text-xs text-midnight-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tier progress */}
            {!isLoyalty && (
              <div className="bg-white rounded-2xl border border-midnight-100 p-5">
                <div className="flex justify-between text-sm text-midnight-600 mb-2">
                  <span className="font-semibold">Progress to 25% tier</span>
                  <span>{affiliate.total_referrals}/{AFFILIATE.loyaltyThreshold} referrals</span>
                </div>
                <div className="h-2 bg-midnight-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ocean to-cobalt rounded-full transition-all"
                    style={{ width: `${Math.min((affiliate.total_referrals / AFFILIATE.loyaltyThreshold) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-midnight-400 mt-2">
                  {toNextTier} more referral{toNextTier !== 1 ? 's' : ''} to unlock the 25% loyalty rate.
                </p>
              </div>
            )}

            {isLoyalty && (
              <div className="bg-ocean/10 border border-ocean/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold text-ocean text-sm">Loyalty tier unlocked!</p>
                  <p className="text-xs text-midnight-500">You earn 25% on all referrals. You also qualify for wholesale pricing.</p>
                </div>
              </div>
            )}

            {/* Payout info */}
            <div className="bg-white rounded-2xl border border-midnight-100 p-5">
              <h3 className="font-display font-bold text-midnight-900 mb-1">Payout details</h3>
              <p className="text-sm text-midnight-500 mb-4">
                Minimum payout: {formatNaira(AFFILIATE.payoutMinimum)}.
                Request a payout when your balance reaches this amount.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-midnight-400">Available balance</p>
                  <p className="font-display font-bold text-xl text-midnight-900">
                    {formatNaira(Math.round((affiliate.total_earned - affiliate.total_paid) / 100))}
                  </p>
                </div>
                <button
                  disabled={(affiliate.total_earned - affiliate.total_paid) < AFFILIATE.payoutMinimum * 100}
                  className="bg-ocean disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-ocean-600 transition-all"
                >
                  Request Payout
                </button>
              </div>
            </div>

            {/* Referral history */}
            <div className="bg-white rounded-2xl border border-midnight-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-midnight-100">
                <h3 className="font-display font-bold text-midnight-900">Referral history</h3>
              </div>
              {!referrals || referrals.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-midnight-400">No referrals yet. Share your link to start earning!</p>
                </div>
              ) : (
                <div className="divide-y divide-midnight-50">
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-midnight-800">
                          {formatNaira(Math.round(r.amount_kobo / 100))} event
                        </p>
                        <p className="text-xs text-midnight-400">
                          {new Date(r.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-ocean">
                          +{formatNaira(Math.round(r.commission_kobo / 100))}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          r.status === 'paid' ? 'bg-teal/10 text-teal' :
                          r.status === 'confirmed' ? 'bg-ocean/10 text-ocean' :
                          'bg-midnight-100 text-midnight-400'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* How it works */}
        {!affiliate && (
          <div className="bg-white rounded-2xl border border-midnight-100 p-6">
            <h3 className="font-display font-bold text-midnight-900 mb-4">How the affiliate programme works</h3>
            <div className="space-y-4">
              {[
                { icon: '🔗', title: 'Get your unique link', desc: 'Join and receive a referral link you can share anywhere — WhatsApp, Instagram, in person.' },
                { icon: '💸', title: `Earn ${Math.round(AFFILIATE.standardRate * 100)}% commission`, desc: `Every host who signs up through your link and pays earns you ${Math.round(AFFILIATE.standardRate * 100)}% of their payment.` },
                { icon: '🏆', title: `Hit ${AFFILIATE.loyaltyThreshold} referrals, earn more`, desc: `After ${AFFILIATE.loyaltyThreshold} successful referrals, your rate jumps to ${Math.round(AFFILIATE.loyaltyRate * 100)}% permanently — and you can buy plans wholesale.` },
              ].map(s => (
                <div key={s.title} className="flex gap-4">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="font-semibold text-midnight-900 text-sm">{s.title}</p>
                    <p className="text-xs text-midnight-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
