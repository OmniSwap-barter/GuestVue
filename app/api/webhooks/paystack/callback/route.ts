import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack redirects here after payment (GET request with reference in query)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const eventId = searchParams.get('eventId')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

  if (!reference) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_reference`)
  }

  try {
    // Verify payment with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const body = await res.json()

    if (!body.status || body.data?.status !== 'success') {
      return NextResponse.redirect(`${appUrl}/dashboard?error=payment_failed`)
    }

    // Activate the event
    const meta = body.data?.metadata ?? {}
    const resolvedEventId = eventId || meta.eventId

    if (resolvedEventId) {
      const supabase = createAdminClient()
      await supabase
        .from('events')
        .update({ status: 'active', plan: meta.plan || 'flex' })
        .eq('id', resolvedEventId)

      return NextResponse.redirect(
        `${appUrl}/dashboard/events/${resolvedEventId}?payment=success`
      )
    }

    return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
  } catch (err) {
    console.error('Paystack callback error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard?error=verification_failed`)
  }
}
