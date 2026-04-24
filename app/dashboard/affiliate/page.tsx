import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { formatNaira, AFFILIATE } from '@/lib/pricing'
import AffiliateCopyButton from './AffiliateCopyButton'
import AffiliateBankForm from './AffiliateBankForm'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextBiweeklyPayoutDate(): Date {
  // Bi-weekly payouts every other Monday, anchored to 2025-01-06
  const anchor = new Date('2025-01-06T00:00:00Z')
  const now = new Date()
  const msSince = now.getTime() - anchor.getTime()
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
  const periodsElapsed = Math.ceil(msSince / twoWeeksMs)
  return new Date(anchor.getTime() + periodsElapsed * twoWeeksMs)
}

function startOf(period: 'day' | 'week' | 'month'): Date {
  const now = new Date()
  if (period === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - now.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function sumCommission(referrals: { commission_kobo: number; created_at: string }[], since?: Date): number {
  return referrals
    .filter(r => !since || new Date(r.created_at) >= since)
    .reduce((s, r) => s + r.commission_kobo, 0)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AffiliatePage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const { data: created } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) ?? '',
        plan_type: 'individual',
      }, { onConflict: 'id' })
      .select()
      .single()
    profile = created
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 text-sm">Unable to load affiliate data. Please try again.</p>
      </div>
    )
  }

  let affiliate = null

  if (profile.referral_code) {
    const { data } = await admin
      .from('affiliates')
      .select('*')
      .eq('referral_code', profile.referral_code)
      .single()
    affiliate = data
  }

  // All referrals for stats (no limit)
  const { data: allReferrals } = affiliate
    ? await admin
        .from('referrals')
        .select('commission_kobo, created_at, status')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Recent referral history with referred user info (for display)
  const { data: referrals } = affiliate
    ? await admin
        .from('referrals')
        .select('id, amount_kobo, commission_kobo, status, created_at, referred_user_id, profiles!referred_user_id(email, full_name)')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(30)
    : { data: [] }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guestvue.com'
  const affiliateLink = profile.referral_code
    ? `${appUrl}/?ref=${profile.referral_code}`
    : null

  const isLoyalty = (affiliate?.total_referrals ?? 0) >= AFFILIATE.loyaltyThreshold
  const currentRate = isLoyalty ? AFFILIATE.loyaltyRate : AFFILIATE.standardRate
  const toNextTier = Math.max(0, AFFILIATE.loyaltyThreshold - (affiliate?.total_referrals ?? 0))

  // Time-based earnings
  const safeReferrals = (allReferrals ?? []) as { commission_kobo: number; created_at: string; status: string }[]
  const earnedToday = sumCommission(safeReferrals, startOf('day'))
  const earnedWeek = sumCommission(safeReferrals, startOf('week'))
  const earnedMonth = sumCommission(safeReferrals, startOf('month'))
  const earnedAllTime = affiliate?.total_earned ?? 0

  const availableBalance = (affiliate?.total_earned ?? 0) - (affiliate?.total_paid ?? 0)
  const nextPayoutDate = nextBiweeklyPayoutDate()
  const daysToNextPayout = Math.ceil((nextPayoutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const eligibleForPayout = availableBalance >= AFFILIATE.payoutMinimum * 100

  const bankAccount = affiliate?.bank_account as { bank_name?: string; account_number?: string; account_name?: string } | null

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

        {/* ── Hero card ─────────────────────────────────────────────── */}
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
            <AffiliateCopyButton link={affiliateLink || ''} />
          )}
        </div>

        {affiliate && (
          <>
            {/* ── Earnings stats with time periods ─────────────────── */}
            <div className="bg-white rounded-2xl border border-midnight-100 p-5">
              <h3 className="font-display font-bold text-midnight-900 mb-4">Earnings breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Today', value: formatNaira(Math.round(earnedToday / 100)), sub: 'earned today', icon: '☀️' },
                  { label: 'This week', value: formatNaira(Math.round(earnedWeek / 100)), sub: 'since Monday', icon: '📅' },
                  { label: 'This month', value: formatNaira(Math.round(earnedMonth / 100)), sub: new Date().toLocaleString('en-NG', { month: 'long' }), icon: '🗓️' },
                  { label: 'All time', value: formatNaira(Math.round(earnedAllTime / 100)), sub: `${affiliate.total_referrals} referral${affiliate.total_referrals !== 1 ? 's' : ''}`, icon: '💰' },
                ].map(s => (
                  <div key={s.label} className="bg-cloud rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className="font-display font-bold text-lg text-midnight-900">{s.value}</p>
                    <p className="text-xs font-semibold text-midnight-600">{s.label}</p>
                    <p className="text-xs text-midnight-400">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stats row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Referrals', value: affiliate.total_referrals, icon: '👥' },
                { label: 'Total Earned', value: formatNaira(Math.round(affiliate.total_earned / 100)), icon: '💵' },
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

            {/* ── Tier progress ─────────────────────────────────────── */}
            {!isLoyalty && (
              <div className="bg-white rounded-2xl border border-midnight-100 p-5">
                <div className="flex justify-between text-sm text-midnight-600 mb-2">
                  <span className="font-semibold">Progress to {Math.round(AFFILIATE.loyaltyRate * 100)}% tier</span>
                  <span>{affiliate.total_referrals}/{AFFILIATE.loyaltyThreshold} referrals</span>
                </div>
                <div className="h-2 bg-midnight-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ocean to-cobalt rounded-full transition-all"
                    style={{ width: `${Math.min((affiliate.total_referrals / AFFILIATE.loyaltyThreshold) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-midnight-400 mt-2">
                  {toNextTier} more referral{toNextTier !== 1 ? 's' : ''} to unlock the {Math.round(AFFILIATE.loyaltyRate * 100)}% loyalty rate.
                </p>
              </div>
            )}

            {isLoyalty && (
              <div className="bg-ocean/10 border border-ocean/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold text-ocean text-sm">Loyalty tier unlocked!</p>
                  <p className="text-xs text-midnight-500">You earn {Math.round(AFFILIATE.loyaltyRate * 100)}% on all referrals. You also qualify for wholesale pricing.</p>
                </div>
              </div>
            )}

            {/* ── Payout card ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-midnight-100 p-5">
              <h3 className="font-display font-bold text-midnight-900 mb-4">Payout</h3>

              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-cloud rounded-xl p-4">
                  <p className="text-xs text-midnight-400 mb-1">Available balance</p>
                  <p className="font-display font-bold text-2xl text-midnight-900">
                    {formatNaira(Math.round(availableBalance / 100))}
                  </p>
                  {!eligibleForPayout && availableBalance > 0 && (
                    <p className="text-xs text-midnight-400 mt-1">
                      Min. {formatNaira(AFFILIATE.payoutMinimum)} to request
                    </p>
                  )}
                </div>
                <div className="bg-cloud rounded-xl p-4">
                  <p className="text-xs text-midnight-400 mb-1">Next payout date</p>
                  <p className="font-display font-bold text-lg text-midnight-900">
                    {nextPayoutDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-midnight-400 mt-1">
                    in {daysToNextPayout} day{daysToNextPayout !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="bg-cloud rounded-xl p-4">
                  <p className="text-xs text-midnight-400 mb-1">Payout schedule</p>
                  <p className="font-bold text-midnight-900 text-sm">Bi-weekly</p>
                  <p className="text-xs text-midnight-400 mt-1">Every 2 weeks on Mondays</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-midnight-50">
                <div className="flex-1 text-xs text-midnight-400 leading-relaxed">
                  Minimum payout: <strong className="text-midnight-600">{formatNaira(AFFILIATE.payoutMinimum)}</strong> ·
                  Applies to <strong className="text-midnight-600">first-time users only</strong> (one commission per unique new host)
                </div>
                <button
                  disabled
                  title={!bankAccount ? 'Add bank details below to request a payout' : !eligibleForPayout ? `Balance below minimum of ${formatNaira(AFFILIATE.payoutMinimum)}` : 'Contact support to request a payout'}
                  className="flex-shrink-0 bg-ocean disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-ocean-600 transition-all"
                >
                  Request Payout
                </button>
              </div>
            </div>

            {/* ── Bank account details ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-midnight-100 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ocean" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-midnight-900">Bank account for payouts</h3>
                  <p className="text-xs text-midnight-400 mt-0.5">
                    {bankAccount
                      ? `Currently: ${bankAccount.bank_name} · ••••${bankAccount.account_number?.slice(-4)}`
                      : 'Add your Nigerian bank account to receive payouts.'}
                  </p>
                </div>
              </div>
              <AffiliateBankForm initial={bankAccount} />
            </div>

            {/* ── Referral history ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-midnight-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-midnight-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-midnight-900">Referral history</h3>
                <span className="text-xs text-midnight-400 bg-cloud px-2.5 py-1 rounded-full font-semibold">
                  {safeReferrals.length} total
                </span>
              </div>
              {!referrals || referrals.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-4xl mb-3">🔗</p>
                  <p className="text-sm font-semibold text-midnight-700 mb-1">No referrals yet</p>
                  <p className="text-xs text-midnight-400">Share your link on WhatsApp, Instagram, or in person.</p>
                </div>
              ) : (
                <div className="divide-y divide-midnight-50">
                  {(referrals as any[]).map(r => {
                    const referred = r.profiles as { email?: string; full_name?: string } | null
                    const displayName = referred?.full_name || (referred?.email ? referred.email.split('@')[0] + '@…' : 'New host')
                    return (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-full bg-ocean/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-ocean">{displayName[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-midnight-800 truncate">{displayName}</p>
                          <p className="text-xs text-midnight-400">
                            {new Date(r.created_at).toLocaleDateString('en-NG', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })} · Event value: {formatNaira(Math.round(r.amount_kobo / 100))}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
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
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── How it works (pre-join) ────────────────────────────────── */}
        {!affiliate && (
          <div className="bg-white rounded-2xl border border-midnight-100 p-6">
            <h3 className="font-display font-bold text-midnight-900 mb-4">How the affiliate programme works</h3>
            <div className="space-y-4">
              {[
                { icon: '🔗', title: 'Get your unique link', desc: 'Join and receive a referral link you can share anywhere — WhatsApp, Instagram, in person.' },
                { icon: '💸', title: `Earn ${Math.round(AFFILIATE.standardRate * 100)}% commission`, desc: `Every host who signs up through your link and pays earns you ${Math.round(AFFILIATE.standardRate * 100)}% of their payment.` },
                { icon: '🏆', title: `Hit ${AFFILIATE.loyaltyThreshold} referrals, earn more`, desc: `After ${AFFILIATE.loyaltyThreshold} successful referrals, your rate jumps to ${Math.round(AFFILIATE.loyaltyRate * 100)}% permanently — and you can buy plans wholesale.` },
                { icon: '💳', title: 'Get paid bi-weekly', desc: `Payouts are sent every 2 weeks straight to your Nigerian bank account, minimum ${formatNaira(AFFILIATE.payoutMinimum)}.` },
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
