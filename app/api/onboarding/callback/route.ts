import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack callback for account-level subscriptions
// Verifies the payment, updates plan_type + onboarding_complete, redirects to dashboard
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
    await admin.from('profiles')
      .update({
        plan_type: accountType ?? 'individual',
        onboarding_complete: true,
      })
      .eq('id', userId)

    return NextResponse.redirect(`${appUrl}/dashboard?onboarded=1`)
  } catch (err) {
    console.error('Onboarding callback error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard?onboarded=1`)
  }
}
