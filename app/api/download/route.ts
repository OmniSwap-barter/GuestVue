import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server } from '@/lib/supabase/server'

/**
 * Proxy download endpoint for cross-origin R2 files.
 * Fetches the file server-side and streams it back with
 * Content-Disposition: attachment so the browser saves rather than opens it.
 *
 * GET /api/download?url=<encoded-R2-url>&filename=<encoded-filename>
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('filename') || 'download'

  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  // Safety: only proxy known R2 / CDN domains
  const allowed = [
    'r2.cloudflarestorage.com',
    'r2.dev',
    'cloudflare',
    'pub-', // R2 public buckets
  ]
  const isAllowed = allowed.some(d => url.includes(d))
  if (!isAllowed) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const safeFilename = encodeURIComponent(filename).replace(/%20/g, '_')

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[download proxy] error:', err)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
