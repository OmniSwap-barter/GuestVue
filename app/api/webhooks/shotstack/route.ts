import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Shotstack render callback
 *
 * Shotstack POSTs here when a render completes or fails.
 * Payload shape (v1):
 *   { success, message, response: { id, status, url, error, ... } }
 *
 * We look up the reel by shotstack_render_id and update its status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Shotstack wraps the render details under `response`
    const response = body?.response ?? body
    const renderId: string | undefined = response?.id
    const status: string | undefined = response?.status   // "done" | "failed" | "rendering" | "fetching" | "saving"
    const outputUrl: string | undefined = response?.url
    const errorMsg: string | undefined = response?.error

    if (!renderId) {
      console.warn('[shotstack-webhook] Missing render ID in payload', JSON.stringify(body).slice(0, 300))
      return NextResponse.json({ ok: false, error: 'No render ID' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Find the reel with this render ID
    const { data: reel } = await admin
      .from('reels')
      .select('id, status')
      .eq('shotstack_render_id', renderId)
      .maybeSingle()

    if (!reel) {
      // Unknown render — acknowledge silently (could be from a different env)
      return NextResponse.json({ ok: true, message: 'Unknown render ID, ignored' })
    }

    // Map Shotstack status → our status
    if (status === 'done' && outputUrl) {
      await admin
        .from('reels')
        .update({
          status: 'complete',
          output_url: outputUrl,
          draft_url: outputUrl,
          completed_at: new Date().toISOString(),
          error_msg: null,
        })
        .eq('id', reel.id)

      console.log(`[shotstack-webhook] Reel ${reel.id} → complete (${outputUrl})`)
    } else if (status === 'failed') {
      await admin
        .from('reels')
        .update({
          status: 'failed',
          error_msg: errorMsg || 'Render failed at Shotstack',
          completed_at: new Date().toISOString(),
        })
        .eq('id', reel.id)

      console.log(`[shotstack-webhook] Reel ${reel.id} → failed: ${errorMsg}`)
    } else if (status === 'rendering' || status === 'fetching' || status === 'saving') {
      // Intermediate progress — map to 'processing' if still queued
      if (reel.status === 'queued') {
        await admin
          .from('reels')
          .update({ status: 'processing' })
          .eq('id', reel.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[shotstack-webhook] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
