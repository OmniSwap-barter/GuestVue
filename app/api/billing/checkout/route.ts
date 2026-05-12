import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

// ── Plan registry ──────────────────────────────────────────────────────────────
// Plan IDs MUST match lib/pricing.ts exactly. accountType is what gets written
// to profiles.plan_type on successful payment.
const PLAN_PRICES: Record<string, { priceKobo: number; label: string; accountType: string }> = {
  // ─ Personal / per-event (one-time) ─────────────────────────────────────────
  flex:       { priceKobo:  2499900, label: 'Flex — ₦24,999/event',              accountType: 'individual' },
  pro:        { priceKobo:  4999900, label: 'Pro — ₦49,999/event',               accountType: 'individual' },
  // ─ Planner bundles (one-time) ───────────────────────────────────────────────
  starter:    { priceKobo:  5399900, label: 'Planner Starter — ₦53,999',         accountType: 'planner'   },
  growth:     { priceKobo:  9499900, label: 'Planner Growth — ₦94,999',          accountType: 'planner'   },
  scale:      { priceKobo: 17999900, label: 'Planner Scale — ₦179,999',          accountType: 'planner'   },
  jagaban:    { priceKobo: 35000000, label: 'Industry Jagaban — ₦350,000',       accountType: 'planner'   },
  // ─ Business subscriptions (monthly) ────────────────────────────────────────
  activation: { priceKobo:  5399700, label: 'Business Activation — ₦53,997/mo', accountType: 'business'  },
  tycoon:     { priceKobo:  8999500, label: 'Business Tycoon — ₦89,995/mo',     accountType: 'business'  },
}

// ── Core checkout logic — shared by GET and POST ───────────────────────────
async function initializeCheckout(req: NextRequest, planId: string, accountType: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

  const plan = PLAN_PRICES[planId]
  if (!plan) {
    return NextResponse.redirect(`${appUrl}/pricing?error=invalid_plan`)
  }

  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not logged in → send to LOGIN (not signup) so existing accounts don't get stuck.
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
          userId:        user.id,
          planId,
          accountType:   resolvedAccountType,
          purchase_type: 'subscription',
          target_tier:   resolvedAccountType,
          plan_id:       planId,
          custom_fields: [
            { display_name: 'Plan',         variable_name: 'plan',         value: plan.label         },
            { display_name: 'Account Type', variable_name: 'account_type', value: resolvedAccountType },
          ],
        },
      }),
    })

    const body = await paystackRes.json()
    if (!body.status) {
      return NextResponse.redirect(`${appUrl}/pricing?error=payment_init_failed`)
    }

    // Record pending payment (maybeSingle silently ignores duplicate refs on Paystack retries)
    const admin = createAdminClient()
    await admin.from('payments').insert({
      user_id:      user.id,
      paystack_ref: body.data.reference,
      amount_kobo:  plan.priceKobo,
      plan:         planId,
      type:         'subscription',
      status:       'pending',
      metadata:     { accountType: resolvedAccountType, planId },
    })

    return NextResponse.redirect(body.data.authorization_url)
  } catch (err) {
    console.error('Billing checkout error:', err)
    return NextResponse.redirect(`${appUrl}/pricing?error=server_error`)
  }
}

// GET /api/billing/checkout?planId=...&accountType=...
// Used by pricing page <Link> buttons.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  return initializeCheckout(
    req,
    searchParams.get('planId') ?? '',
    searchParams.get('accountType') ?? '',
  )
}

// POST /api/billing/checkout  { planId, accountType }
// Used by dashboard upgrade modal — fetch() call from the client.
export async function POST(req: NextRequest) {
  let planId = '', accountType = ''
  try {
    const body = await req.json()
    planId      = body.planId      ?? ''
    accountType = body.accountType ?? ''
  } catch {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'
    return NextResponse.redirect(`${appUrl}/pricing?error=invalid_request`)
  }
  return initializeCheckout(req, planId, accountType)
}
