import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack callback for account-level subscriptions.
// Verifies the payment, updates plan_type + onboarding_complete, redirects to dashboard.
//
// Session-survival note: After Paystack redirects the user's browser here, the
// Supabase session cookie should still be present (SameSite=Lax allows top-level
// GET navigations). However if the session expired during checkout (>1 hour), we
// set a short-lived `gv_just_paid` cookie so the login page can show a friendly
// "Your upgrade is confirmed — please sign in again" message rather than silently
// dropping the user on the auth page with no context.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const reference   = searchParams.get('reference') || searchParams.get('trxref')
  const planId      = searchParams.get('planId')
  const accountType = searchParams.get('accountType')
  const userId      = searchParams.get('userId')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  if (!reference || !userId) {
    return NextResponse.redirect(`${appUrl}/onboarding?error=missing_params`)
  }

  try {
    // Verify transaction with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const verifyBody = await verifyRes.json()

    if (!verifyBody.status || verifyBody.data?.status !== 'success') {
      return NextResponse.redirect(`${appUrl}/onboarding?error=payment_failed`)
    }

    const admin = createAdminClient()

    // Update payment record to success
    await admin.from('payments')
      .update({ status: 'success' })
      .eq('paystack_ref', reference)

    // Activate the account — update plan_type + mark onboarding complete
    const resolvedAccountType = accountType ?? 'individual'
    await admin.from('profiles')
      .update({
        plan_type: resolvedAccountType,
        onboarding_complete: true,
      })
      .eq('id', userId)

    // Write entitlements so middleware gate and subscription checks work.
    // is_unlimited_events = true for account types/plans that don't cap per-event usage.
    const UNLIMITED_PLAN_IDS = new Set([
      'business', 'corporate',           // account types
      'tycoon', 'activation',            // business plan IDs
      'growth', 'scale', 'jagaban',      // planner plan IDs (high event counts)
    ])
    const isUnlimited = UNLIMITED_PLAN_IDS.has(planId ?? '') ||
                        UNLIMITED_PLAN_IDS.has(resolvedAccountType)

    await admin.from('user_entitlements')
      .upsert({
        user_id: userId,
        current_plan_id: planId ?? resolvedAccountType,
        subscription_status: 'active',
        is_unlimited_events: isUnlimited,
        updated_at: new Date().toISOString(),
      })

    // Redirect to dashboard. If the session cookie expired during the Paystack
    // flow, middleware will redirect to /auth/login. We set gv_just_paid so the
    // login page can show a "payment confirmed, please sign in" message.
    const res = NextResponse.redirect(`${appUrl}/dashboard?onboarded=1`)
    res.cookies.set('gv_just_paid', '1', {
      maxAge: 60 * 10,  // 10 minutes — enough time to reach the login page
      path: '/',
      httpOnly: false,  // readable by client JS on login page
      sameSite: 'lax',
    })
    return res
  } catch (err) {
    console.error('Onboarding callback error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard?onboarded=1`)
  }
}
