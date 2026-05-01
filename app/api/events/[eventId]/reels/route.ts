import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify ownership
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single() as any
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data: reels, error } = await admin
    .from('reels')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(10) as any

  if (error) return NextResponse.json({ error: 'Failed to load reels' }, { status: 500 })

  // ── Shotstack status sync ──────────────────────────────────────────────────
  // For any reel that is still "processing" or stuck "queued" with a render ID,
  // poll Shotstack directly so the frontend's 6-second poller resolves the status
  // even if the webhook callback was missed or not yet delivered.
  const apiKey = process.env.SHOTSTACK_API_KEY
  const apiEnv = process.env.SHOTSTACK_ENV || 'stage'

  if (apiKey && reels) {
    const pending = (reels as any[]).filter(
      r => (r.status === 'processing' || r.status === 'queued') && r.shotstack_render_id
    )

    if (pending.length > 0) {
      await Promise.allSettled(
        pending.map(async (reel: any) => {
          try {
            const res = await fetch(
              `https://api.shotstack.io/edit/${apiEnv}/render/${reel.shotstack_render_id}`,
              { headers: { 'x-api-key': apiKey }, signal: AbortSignal.timeout(5000) }
            )
            if (!res.ok) return

            const data = await res.json()
            const renderStatus: string = data?.response?.status
            const outputUrl: string | undefined = data?.response?.url

            if (renderStatus === 'done' && outputUrl) {
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

              // Patch in-memory so this response reflects the new state
              reel.status = 'complete'
              reel.output_url = outputUrl
              reel.draft_url = outputUrl

            } else if (renderStatus === 'failed') {
              const errMsg = data?.response?.error ?? 'Render failed'
              await admin
                .from('reels')
                .update({
                  status: 'failed',
                  error_msg: errMsg,
                  completed_at: new Date().toISOString(),
                })
                .eq('id', reel.id)

              reel.status = 'failed'
              reel.error_msg = errMsg

            } else if (
              (renderStatus === 'rendering' || renderStatus === 'fetching' || renderStatus === 'saving') &&
              reel.status === 'queued'
            ) {
              // Shotstack has started — advance from queued → processing
              await admin
                .from('reels')
                .update({ status: 'processing' })
                .eq('id', reel.id)

              reel.status = 'processing'
            }
          } catch {
            // Timeout or network error — skip this reel, try again next poll
          }
        })
      )
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ reels: reels ?? [] })
}
