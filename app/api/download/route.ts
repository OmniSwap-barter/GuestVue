import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import type { Readable } from 'stream'

/**
 * Proxy download endpoint for private Cloudflare R2 files.
 * Uses the R2 SDK with credentials to fetch objects — plain fetch() fails
 * because R2 private buckets return XML AccessDenied for unauthenticated requests.
 *
 * GET /api/download?url=<encoded-R2-url>&filename=<encoded-filename>
 */

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

/**
 * Extract the R2 object key from a URL.
 *
 * Handles two URL shapes:
 *   1. Private:  https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key...>
 *   2. Public:   https://<hash>.r2.dev/<key...>   OR   https://<custom-domain>/<key...>
 *
 * For shape 1 we strip the leading bucket segment; for shape 2 the entire
 * pathname (minus leading slash) is the key.
 */
function extractR2Key(url: string): string | null {
  try {
    const parsed = new URL(url)
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts.length === 0) return null

    const bucket = process.env.R2_BUCKET_NAME || 'claude-guestvue'

    // If the path starts with the bucket name (private endpoint URL), skip it
    if (pathParts[0] === bucket) {
      return pathParts.slice(1).join('/')
    }

    // Public URL or custom domain — entire path is the key
    return pathParts.join('/')
  } catch {
    return null
  }
}

// Allowed domains — only proxy known R2 / CDN domains
const ALLOWED_DOMAINS = [
  'r2.cloudflarestorage.com',
  'r2.dev',
  'cloudflare',
  'pub-', // R2 public bucket hostnames
]

export async function GET(req: NextRequest) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('filename') || 'download'

  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  // Safety: only proxy known R2 / CDN domains
  const isAllowed = ALLOWED_DOMAINS.some(d => url.includes(d))
  // Also allow the configured public URL base
  const publicBase = process.env.R2_PUBLIC_URL || ''
  const isPublicBase = publicBase && url.startsWith(publicBase)

  if (!isAllowed && !isPublicBase) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  const key = extractR2Key(url)
  if (!key) {
    return NextResponse.json({ error: 'Could not parse R2 key from URL' }, { status: 400 })
  }

  const bucket = process.env.R2_BUCKET_NAME || 'claude-guestvue'

  try {
    const r2 = getR2Client()
    const obj = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }))

    if (!obj.Body) {
      return NextResponse.json({ error: 'Empty response from R2' }, { status: 502 })
    }

    const contentType = obj.ContentType || 'application/octet-stream'
    const safeFilename = filename.replace(/[^\w\-_.]/g, '_')

    // obj.Body is a web ReadableStream in the AWS SDK v3 browser/edge runtime
    const bodyStream = obj.Body as unknown as ReadableStream

    return new NextResponse(bodyStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
        ...(obj.ContentLength
          ? { 'Content-Length': String(obj.ContentLength) }
          : {}),
      },
    })
  } catch (err: any) {
    console.error('[download proxy] R2 error:', err?.message ?? err)

    // If R2 credentials aren't configured, surface a clearer error
    if (err?.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
