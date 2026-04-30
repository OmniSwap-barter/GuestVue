import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

// Account-level plan pricing in kobo (₦1 = 100 kobo)
const PLAN_PRICES: Record<string, { priceKobo: number; label: string }> = {
  planner_starter:  { priceKobo:  4999900, label: 'Planner Starter — ₦49,999/mo' },
  planner_pro:      { priceKobo:  9999900, label: 'Planner Pro — ₦99,999/mo' },
  business_growth:  { priceKobo:  7999900, label: 'Business Growth — ₦79,999/mo' },
  business_scale:   { priceKobo: 14999900, label: 'Business Scale — ₦149,999/mo' },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, accountType } = await req.json()
    const plan = PLAN_PRICES[planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.priceKobo,
        reference: `acct_${user.id}_${planId}_${Date.now()}`,
        callback_url: `${appUrl}/api/onboarding/callback?planId=${planId}&accountType=${accountType}&userId=${user.id}`,
        metadata: {
          userId: user.id,
          planId,
          accountType,
          type: 'account_subscription',
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: plan.label },
            { display_name: 'Account Type', variable_name: 'account_type', value: accountType },
          ],
        },
      }),
    })

    const paystackBody = await paystackRes.json()
    if (!paystackBody.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    // Record pending payment
    const admin = createAdminClient()
    await admin.from('payments').insert({
      user_id: user.id,
      paystack_ref: paystackBody.data.reference,
      amount_kobo: plan.priceKobo,
      plan: planId,
      type: 'subscription',
      status: 'pending',
      metadata: { accountType, planId },
    })

    return NextResponse.json({ paymentUrl: paystackBody.data.authorization_url })
  } catch (err) {
    console.error('Onboarding subscribe error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
