import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

// Account-level plan pricing in kobo (₦1 = 100 kobo)
const PLAN_PRICES: Record<string, { priceKobo: number; label: string; accountType: string }> = {
  planner_starter:  { priceKobo:  4999900, label: 'Planner Starter — ₦49,999/mo',   accountType: 'planner'   },
  planner_pro:      { priceKobo:  9999900, label: 'Planner Pro — ₦99,999/mo',       accountType: 'planner'   },
  business_growth:  { priceKobo:  7999900, label: 'Business Growth — ₦79,999/mo',   accountType: 'business'  },
  business_scale:   { priceKobo: 14999900, label: 'Business Scale — ₦149,999/mo',   accountType: 'business'  },
}

async function initializeCheckout(userId: string, email: string, planId: string, accountType: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'
  const plan = PLAN_PRICES[planId]
  if (!plan) return null

  const resolvedAccountType = accountType || plan.accountType

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: plan.priceKobo,
      reference: `acct_${userId}_${planId}_${Date.now()}`,
      callback_url: `${appUrl}/api/onboarding/callback?planId=${planId}&accountType=${resolvedAccountType}&userId=${userId}`,
      metadata: {
        userId,
        planId,
        accountType: resolvedAccountType,
        // Fields the webhook handler reads to route correctly
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
  return body.status ? body.data : null
}

// POST — called from onboarding page (returns JSON with paymentUrl)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, accountType } = await req.json()
    const plan = PLAN_PRICES[planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const paystackData = await initializeCheckout(user.id, user.email!, planId, accountType)
    if (!paystackData) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    // Record pending payment
    const admin = createAdminClient()
    await admin.from('payments').insert({
      user_id: user.id,
      paystack_ref: paystackData.reference,
      amount_kobo: plan.priceKobo,
      plan: planId,
      type: 'subscription',
      status: 'pending',
      metadata: { accountType, planId },
    })

    return NextResponse.json({ paymentUrl: paystackData.authorization_url })
  } catch (err) {
    console.error('Onboarding subscribe error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// GET — called from pricing page links for logged-in users (redirects to Paystack)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planId      = searchParams.get('planId') ?? ''
  const accountType = searchParams.get('accountType') ?? ''
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

  if (!PLAN_PRICES[planId]) {
    return NextResponse.redirect(`${appUrl}/pricing?error=invalid_plan`)
  }

  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${appUrl}/auth/login?next=/pricing`)
    }

    const paystackData = await initializeCheckout(user.id, user.email!, planId, accountType)
    if (!paystackData) {
      return NextResponse.redirect(`${appUrl}/pricing?error=payment_init_failed`)
    }

    // Record pending payment
    const admin = createAdminClient()
    await admin.from('payments').insert({
      user_id: user.id,
      paystack_ref: paystackData.reference,
      amount_kobo: PLAN_PRICES[planId].priceKobo,
      plan: planId,
      type: 'subscription',
      status: 'pending',
      metadata: { accountType, planId },
    })

    return NextResponse.redirect(paystackData.authorization_url)
  } catch (err) {
    console.error('Onboarding subscribe GET error:', err)
    return NextResponse.redirect(`${appUrl}/pricing?error=server_error`)
  }
}
