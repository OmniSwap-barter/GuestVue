import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack signs every webhook with HMAC-SHA512 using your secret key.
// We MUST verify this before touching the payload — otherwise any attacker
// can POST fake charge.success events and upgrade their own account for free.
export async function POST(req: NextRequest) {
  // ── 1. Read raw body FIRST — we need the exact bytes for signature verification ──
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!signature || !process.env.PAYSTACK_WEBHOOK_SECRET) {
    console.warn('[paystack] Missing signature or webhook secret')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // ── 2. Verify HMAC-SHA512 — reject anything that doesn't match ───────────────
  const expected = createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (signature !== expected) {
    console.warn('[paystack] Webhook signature mismatch — possible spoofed request')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── 3. Parse only after verification ────────────────────────────────────────
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.event) {

      // ────────────────────────────────────────────────────────────────────────
      case 'charge.success': {
        const meta = event.data?.metadata ?? {}
        const { eventId, plan, userId, purchase_type, target_tier, plan_id } = meta

        const isSubscription = purchase_type === 'subscription'

        // Record payment — log but don't block on insert failure
        const { error: paymentErr } = await supabase.from('payments').insert({
          user_id: userId || null,
          paystack_ref: event.data.reference,
          amount_kobo: event.data.amount,
          plan: plan_id || plan || target_tier || null,
          type: isSubscription ? 'subscription' : 'one_time',
          status: 'success',
          metadata: event.data,
        })
        if (paymentErr) {
          // Non-fatal — duplicate reference hits unique constraint on retries; log and continue
          console.warn('[paystack] payments insert warning:', paymentErr.message)
        }

        // ── Subscription: upgrade account plan + write entitlements ───────────
        if (isSubscription) {
          if (!userId || !target_tier) {
            console.error('[paystack] subscription charge.success missing userId or target_tier', meta)
            // Return 200 — retrying won't help without the metadata
            return NextResponse.json({ received: true })
          }

          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ plan_type: target_tier })
            .eq('id', userId)

          if (profileErr) {
            console.error('[paystack] profiles.update failed:', profileErr)
            // Return 500 so Paystack retries the webhook
            return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
          }

          const UNLIMITED_PLAN_IDS = new Set([
            'business', 'corporate',
            'tycoon', 'activation',
            'growth', 'scale', 'jagaban',
          ])
          const isUnlimited = UNLIMITED_PLAN_IDS.has(plan_id) || UNLIMITED_PLAN_IDS.has(target_tier)

          const { error: entitlementErr } = await supabase
            .from('user_entitlements')
            .upsert({
              user_id: userId,
              current_plan_id: plan_id || target_tier,
              subscription_status: 'active',
              is_unlimited_events: isUnlimited,
              payment_customer_id: event.data.customer?.customer_code ?? null,
              updated_at: new Date().toISOString(),
            })

          if (entitlementErr) {
            console.error('[paystack] user_entitlements.upsert failed:', entitlementErr)
            // Return 500 so Paystack retries
            return NextResponse.json({ error: 'Entitlement update failed' }, { status: 500 })
          }

          console.log(`[paystack] Subscription activated: user=${userId} tier=${target_tier} unlimited=${isUnlimited}`)
          break
        }

        // ── One-off event payment: activate the event ─────────────────────────
        if (eventId) {
          const { error: eventErr } = await supabase
            .from('events')
            .update({ status: 'active', plan: plan || 'flex' })
            .eq('id', eventId)

          if (eventErr) {
            console.error('[paystack] events.update failed:', eventErr)
            return NextResponse.json({ error: 'Event activation failed' }, { status: 500 })
          }

          console.log(`[paystack] Event activated: eventId=${eventId} plan=${plan || 'flex'}`)
        } else {
          console.warn('[paystack] one-off charge.success with no eventId in metadata', meta)
        }

        // ── Referral commission — non-fatal, don't block on failure ──────────
        if (userId) {
          try {
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
                await supabase.rpc('increment_affiliate_earnings', {
                  affiliate_id_input: affiliate.id,
                  commission_input: commission,
                })
                console.log(`[paystack] Referral commission recorded: affiliate=${affiliate.id} commission=${commission}`)
              }
            }
          } catch (refErr) {
            // Non-fatal — don't fail the webhook over referral logic
            console.error('[paystack] Referral commission error (non-fatal):', refErr)
          }
        }

        break
      }

      // ────────────────────────────────────────────────────────────────────────
      case 'subscription.create': {
        const { data } = event
        const { error } = await supabase.from('subscriptions').insert({
          user_id: data.customer?.metadata?.userId || null,
          plan: data.plan?.name || 'unknown',
          status: 'active',
          paystack_sub_id: data.subscription_code,
          current_period_start: data.createdAt,
          current_period_end: data.next_payment_date,
        })
        if (error) {
          console.error('[paystack] subscriptions.insert failed:', error)
          return NextResponse.json({ error: 'Subscription record failed' }, { status: 500 })
        }
        break
      }

      // ────────────────────────────────────────────────────────────────────────
      case 'subscription.disable': {
        const { data } = event
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('paystack_sub_id', data.subscription_code)
        if (error) console.error('[paystack] subscription.disable failed:', error)

        // Also mark entitlement as inactive if we can map subscription_code to user
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paystack_sub_id', data.subscription_code)
          .single()
        if (sub?.user_id) {
          await supabase
            .from('user_entitlements')
            .update({ subscription_status: 'cancelled' })
            .eq('user_id', sub.user_id)
        }
        break
      }

      // ────────────────────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const { data } = event
        const subCode = data.subscription?.subscription_code
        if (subCode) {
          await supabase
            .from('subscriptions')
            .update({ status: 'paused' })
            .eq('paystack_sub_id', subCode)

          // Reflect paused state in entitlements too
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('paystack_sub_id', subCode)
            .single()
          if (sub?.user_id) {
            await supabase
              .from('user_entitlements')
              .update({ subscription_status: 'past_due' })
              .eq('user_id', sub.user_id)
          }
        }
        break
      }

      // ────────────────────────────────────────────────────────────────────────
      default:
        console.log('[paystack] Unhandled event type:', event.event)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[paystack] Webhook processing error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
