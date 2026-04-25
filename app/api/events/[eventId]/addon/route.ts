import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

const ADDON_LABELS: Record<string, string> = {
  uploads_100: '+100 Upload Slots',
  page_extension_7d: '+7 Days Page Access',
  storage_extension_30d: '+30 Days Storage',
  ai_reel: 'AI Highlight Reel',
  photo_wall: 'Live Photo Wall',
  remove_watermark: 'Remove GuestVue Watermark',
  upgrade_flex: 'Upgrade to Flex Plan',
  upgrade_pro: 'Upgrade to Pro Plan',
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { addonId, priceKobo } = await req.json() as { addonId: string; priceKobo: number }

    if (!addonId || !priceKobo || priceKobo <= 0) {
      return NextResponse.json({ error: 'Invalid addon request' }, { status: 400 })
    }

    // Verify event ownership — use admin client to bypass RLS reliably
    const admin = createAdminClient()
    const { data: event } = await admin
      .from('events')
      .select('id, name, host_id')
      .eq('id', eventId)
      .eq('host_id', user.id)
      .single()

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'
    const addonLabel = ADDON_LABELS[addonId] || addonId

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: priceKobo,
        reference: `addon_${eventId}_${addonId}_${Date.now()}`,
        callback_url: `${appUrl}/api/webhooks/paystack/callback?eventId=${eventId}&addon=${addonId}`,
        metadata: {
          eventId,
          addonId,
          userId: user.id,
          custom_fields: [
            { display_name: 'Event Name', variable_name: 'event_name', value: event.name },
            { display_name: 'Add-on', variable_name: 'addon', value: addonLabel },
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
    console.error('Addon pay error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
