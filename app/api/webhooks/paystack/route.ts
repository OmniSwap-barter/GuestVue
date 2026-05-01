import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack sends webhooks — we verify with HMAC-SHA512 and process events
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature || !process.env.PAYSTACK_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // ── Verify HMAC-SHA512 signature ─────────────────────────────────────────
    const expected = createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    if (signature !== expected) {
      console.warn('Paystack webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const supabase = createAdminClient()

    // ── Handle events ─────────────────────────────────────────────────────────
    switch (event.event) {

      case 'charge.success': {
        const meta = event.data?.metadata ?? {}
        const { eventId, plan, userId } = meta

        // Record payment
        await supabase.from('payments').insert({
          user_id: userId || null,
          paystack_ref: event.data.reference,
          amount_kobo: event.data.amount,
          plan: plan || null,
          type: 'one_time',
          status: 'success',
          metadata: event.data,
        })

        // Activate event if this was for an event
        if (eventId) {
          await supabase
            .from('events')
            .update({ status: 'active', plan: plan || 'flex' })
            .eq('id', eventId)
        }

        // Grant unlimited entitlement for Tycoon / Business Tycoon plan purchases
        const isTycoon = plan && (
          plan.toLowerCase().includes('tycoon') ||
          plan === 'business_scale' ||
          plan === 'planner_pro'
        )
        if (userId && isTycoon) {
          await supabase
            .from('profiles')
            .update({ is_unlimited: true })
            .eq('id', userId)
        }

        // Handle referral commission
        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('referred_by')
            .eq('id', userId)
            .single()

          if (profile?.referred_by) {
            const { data: affiliate } = await supabase
              .from('affiliates')
              .select('id, commission_rate')
              .eq('referral_code', profile.referred_by)
              .single()

            if (affiliate) {
              const commission = Math.round(event.data.amount * affiliate.commission_rate)
              await supabase.from('referrals').insert({
                affiliate_id: affiliate.id,
                referred_user_id: userId,
                event_id: eventId || null,
                subscription_id: null,
                amount_kobo: event.data.amount,
                commission_kobo: commission,
                status: 'confirmed',
              })
              // Update affiliate totals
              await supabase.rpc('increment_affiliate_earnings', {
                affiliate_id_input: affiliate.id,
                commission_input: commission,
              })
            }
          }
        }
        break
      }

      case 'subscription.create': {
        const { data } = event
        await supabase.from('subscriptions').insert({
          user_id: data.customer?.metadata?.userId || null,
          plan: data.plan?.name || 'unknown',
          status: 'active',
          paystack_sub_id: data.subscription_code,
          current_period_start: data.createdAt,
          current_period_end: data.next_payment_date,
        })
        break
      }

      case 'subscription.disable': {
        const { data } = event
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('paystack_sub_id', data.subscription_code)
        break
      }

      case 'invoice.payment_failed': {
        const { data } = event
        await supabase
          .from('subscriptions')
          .update({ status: 'paused' })
          .eq('paystack_sub_id', data.subscription?.subscription_code)
        break
      }

      default:
        // Unknown event type — log and acknowledge
        console.log('Unhandled Paystack event:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Paystack webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
