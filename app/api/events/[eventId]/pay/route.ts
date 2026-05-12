import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server } from '@/lib/supabase/server'
import { PLANS } from '@/lib/pricing'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify the event belongs to this user
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('host_id', user.id)
      .single() as { data: { id: string; status: string; plan: string; name: string } | null; error: any }

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.status === 'active') return NextResponse.json({ error: 'Event is already active' }, { status: 400 })
    if (event.plan === 'free') return NextResponse.json({ error: 'Free events do not require payment' }, { status: 400 })

    const planConfig = PLANS[event.plan as 'flex' | 'pro']
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: planConfig.priceKobo,
        reference: `evt_${eventId}_retry_${Date.now()}`,
        callback_url: `${appUrl}/api/webhooks/paystack/callback?eventId=${eventId}`,
        metadata: {
          eventId,
          plan: event.plan,
          userId: user.id,
          purchase_type: 'one_off_event',
          custom_fields: [
            { display_name: 'Event Name', variable_name: 'event_name', value: event.name },
            { display_name: 'Plan', variable_name: 'plan', value: event.plan },
          ],
        },
      }),
    })

    const paystackBody = await paystackRes.json()
    if (!paystackBody.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }

    return NextResponse.json({ paymentUrl: paystackBody.data.authorization_url })
  } catch (err) {
    console.error('Pay route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
