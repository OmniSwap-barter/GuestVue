import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Paystack redirects here after payment (GET request with reference in query)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const eventId = searchParams.get('eventId')
  const addonId = searchParams.get('addon') // present for add-on purchases
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

  if (!reference) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_reference`)
  }

  try {
    // Verify payment with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })

    const body = await res.json()

    if (!body.status || body.data?.status !== 'success') {
      return NextResponse.redirect(`${appUrl}/dashboard?error=payment_failed`)
    }

    const meta = body.data?.metadata ?? {}
    const resolvedEventId = eventId || meta.eventId
    const resolvedAddonId = addonId || meta.addonId

    if (!resolvedEventId) {
      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`)
    }

    const supabase = createAdminClient()

    // ── Add-on purchase ──────────────────────────────────────────────────────
    if (resolvedAddonId) {
      switch (resolvedAddonId) {
        case 'uploads_100':
          await supabase.rpc('increment_upload_limit', { event_id: resolvedEventId, amount: 100 })
          break

        case 'page_extension_7d': {
          const { data: ev } = await supabase.from('events').select('page_expires_at').eq('id', resolvedEventId).single()
          if (ev) {
            const base = ev.page_expires_at ? new Date(ev.page_expires_at) : new Date()
            base.setDate(base.getDate() + 7)
            await supabase.from('events').update({ page_expires_at: base.toISOString() }).eq('id', resolvedEventId)
          }
          break
        }

        case 'storage_extension_30d': {
          const { data: ev } = await supabase.from('events').select('storage_expires_at').eq('id', resolvedEventId).single()
          if (ev) {
            const base = ev.storage_expires_at ? new Date(ev.storage_expires_at) : new Date()
            base.setDate(base.getDate() + 30)
            await supabase.from('events').update({ storage_expires_at: base.toISOString() }).eq('id', resolvedEventId)
          }
          break
        }

        case 'upgrade_flex':
          await supabase.from('events').update({ plan: 'flex', status: 'active', upload_limit: 500 }).eq('id', resolvedEventId)
          break

        case 'upgrade_pro':
          await supabase.from('events').update({ plan: 'pro', status: 'active', upload_limit: 999999 }).eq('id', resolvedEventId)
          break

        // ai_reel and photo_wall don't change DB schema — just unlock the feature;
        // for now just mark them as success and redirect.
        default:
          break
      }

      return NextResponse.redirect(
        `${appUrl}/dashboard/events/${resolvedEventId}?payment=success&addon=${resolvedAddonId}`
      )
    }

    // ── Initial event payment (activate event) ───────────────────────────────
    await supabase
      .from('events')
      .update({ status: 'active', plan: meta.plan || 'flex' })
      .eq('id', resolvedEventId)

    return NextResponse.redirect(
      `${appUrl}/dashboard/events/${resolvedEventId}?payment=success`
    )
  } catch (err) {
    console.error('Paystack callback error:', err)
    return NextResponse.redirect(`${appUrl}/dashboard?error=verification_failed`)
  }
}
