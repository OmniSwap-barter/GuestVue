import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/pricing'
import QRCode from 'qrcode'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, event_date, hashtag, plan } = body as {
      name: string
      event_date: string | null
      hashtag: string | null
      plan: 'free' | 'flex' | 'pro'
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 })
    }

    if (!['free', 'flex', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    const planConfig = PLANS[plan]
    const eventId = randomUUID()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guestvue.com'
    const galleryUrl = `${appUrl}/e/${eventId}`

    // ── Generate QR code ──────────────────────────────────────────────────────
    let qrUrl: string | null = null

    try {
      const qrPng = await QRCode.toBuffer(galleryUrl, {
        type: 'png',
        width: 800,
        margin: 2,
        color: { dark: '#0A4F6B', light: '#FFFFFF' },
      })

      const qrKey = `events/${eventId}/qr.png`
      const r2 = getR2Client()
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: qrKey,
          Body: qrPng,
          ContentType: 'image/png',
        })
      )
      qrUrl = `${process.env.R2_PUBLIC_URL}/${qrKey}`
    } catch (qrErr) {
      console.warn('QR generation failed (non-fatal):', qrErr)
      // Event still created without QR — can regenerate later
    }

    // ── Calculate expiry dates ────────────────────────────────────────────────
    const now = new Date()
    let pageExpiresAt: string | null = null
    let storageExpiresAt: string | null = null

    if ('activePageHours' in planConfig) {
      const exp = new Date(now)
      exp.setHours(exp.getHours() + planConfig.activePageHours)
      pageExpiresAt = exp.toISOString()
    } else if ('activePageDays' in planConfig) {
      const exp = new Date(now)
      exp.setDate(exp.getDate() + (planConfig as { activePageDays: number }).activePageDays)
      pageExpiresAt = exp.toISOString()
    }

    if (planConfig.storageDays) {
      const exp = new Date(now)
      exp.setDate(exp.getDate() + planConfig.storageDays)
      storageExpiresAt = exp.toISOString()
    }

    // ── Insert event (use admin client so we can set id explicitly) ────────────
    const admin = createAdminClient()
    const { data: event, error: insertError } = await admin
      .from('events')
      .insert({
        id: eventId,
        host_id: user.id,
        name: name.trim(),
        event_date: event_date || null,
        hashtag: hashtag?.trim() || null,
        plan,
        status: plan === 'free' ? 'active' : 'paused', // paused until payment confirmed
        qr_url: qrUrl,
        gallery_url: galleryUrl,
        upload_limit: planConfig.uploads === Infinity ? 999999 : planConfig.uploads,
        page_expires_at: pageExpiresAt,
        storage_expires_at: storageExpiresAt,
        custom_color: null,
        custom_logo: null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Event insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create event.' }, { status: 500 })
    }

    // ── For paid plans, create a Paystack payment link ─────────────────────────
    let paymentUrl: string | null = null

    if (plan !== 'free' && process.env.PAYSTACK_SECRET_KEY) {
      try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            amount: planConfig.priceKobo,
            reference: `evt_${eventId}_${Date.now()}`,
            callback_url: `${appUrl}/api/webhooks/paystack/callback?eventId=${eventId}`,
            metadata: {
              eventId,
              plan,
              userId: user.id,
              custom_fields: [
                { display_name: 'Event Name', variable_name: 'event_name', value: name },
                { display_name: 'Plan', variable_name: 'plan', value: plan },
              ],
            },
          }),
        })

        const paystackBody = await paystackRes.json()
        if (paystackBody.status) {
          paymentUrl = paystackBody.data.authorization_url
        }
      } catch (err) {
        console.warn('Paystack init failed (non-fatal):', err)
      }
    }

    return NextResponse.json({ event, paymentUrl }, { status: 201 })
  } catch (err) {
    console.error('Create event error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ events: events ?? [] })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
