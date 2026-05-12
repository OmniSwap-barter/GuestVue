import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

// Plan registry — keeps pricing canonical, referenced by planId
const PLAN_PRICES: Record<string, { priceKobo: number; label: string; accountType: string }> = {
  // Planner bundles (one-time)
  planner_starter:  { priceKobo:  4999900, label: 'Planner Starter — ₦49,999/mo',  accountType: 'planner'  },
  planner_pro:      { priceKobo:  9999900, label: 'Planner Pro — ₦99,999/mo',      accountType: 'planner'  },
  // Business subscriptions
  business_growth:  { priceKobo:  7999900, label: 'Business Growth — ₦79,999/mo',  accountType: 'business' },
  business_scale:   { priceKobo: 14999900, label: 'Business Scale — ₦149,999/mo',  accountType: 'business' },
}

// GET /api/billing/checkout?planId=...&accountType=...
// Logged-in users arrive here from pricing page plan buttons.
// We initialize a Paystack checkout and redirect them straight there.
// Unauthenticated users are sent to login with a ?next= param.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planId      = searchParams.get('planId') ?? ''
  const accountType = searchParams.get('accountType') ?? ''
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

  const plan = PLAN_PRICES[planId]
  if (!plan) {
    return NextResponse.redirect(`${appUrl}/pricing?error=invalid_plan`)
  }

  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not logged in → send to LOGIN (not signup) so existing accounts don't
      // get stuck. After login, Paystack checkout re-initialises from /pricing.
      return NextResponse.redirect(`${appUrl}/auth/login?next=/pricing`)
    }

    const resolvedAccountType = accountType || plan.accountType

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.priceKobo,
        reference: `billing_${user.id}_${planId}_${Date.now()}`,
        callback_url: `${appUrl}/api/onboarding/callback?planId=${planId}&accountType=${resolvedAccountType}&userId=${user.id}`,
        metadata: {
          userId: user.id,
          planId,
          accountType: resolvedAccountType,
          purchase_type: 'subscription',
          target_tier: resolvedAccountType,
          plan_id: planId,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: plan.label },
            { display_name: 'Account Type', variable_name: 'account_type', value: resolvedAccountType },
          ],
        },
      }),
    })

    const body = await paystackRes.json()
    if (!body.status) {
      return NextResponse.redirect(`${appUrl}/pricing?error=payment_init_failed`)
    }

    // Record pending payment
    const admin = createAdminClient()
    await admin.from('payments').insert({
      user_id: user.id,
      paystack_ref: body.data.reference,
      amount_kobo: plan.priceKobo,
      plan: planId,
      type: 'subscription',
      status: 'pending',
      metadata: { accountType: resolvedAccountType, planId },
    })

    return NextResponse.redirect(body.data.authorization_url)
  } catch (err) {
    console.error('Billing checkout error:', err)
    return NextResponse.redirect(`${appUrl}/pricing?error=server_error`)
  }
}
