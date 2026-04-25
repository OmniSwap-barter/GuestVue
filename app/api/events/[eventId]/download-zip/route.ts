import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Returns presigned R2 URLs for all event uploads.
 * Presigned URLs embed the credentials so the browser can download
 * directly from R2 (no proxy hop) with proper Content-Disposition headers.
 * Expiry: 5 minutes — enough to trigger all browser downloads.
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

function extractKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    const bucket = process.env.R2_BUCKET_NAME || 'claude-guestvue'
    if (parts[0] === bucket) return parts.slice(1).join('/')
    return parts.join('/')
  } catch {
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  // Next.js 15: params is async — must await
  const { eventId } = await params

  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: event } = await admin
    .from('events')
    .select('id, name, plan')
    .eq('id', eventId)
    .eq('host_id', user.id)
    .single() as any

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only Flex+ plans can bulk-download
  if (event.plan === 'free') {
    return NextResponse.json({ error: 'Bulk download requires Flex or Pro plan.' }, { status: 403 })
  }

  const { data: uploads } = await admin
    .from('uploads')
    .select('id, original_url, display_url, type, created_at')
    .eq('event_id', eventId)
    .in('status', ['ready', 'processing'])
    .order('created_at', { ascending: true }) as any

  const files = (uploads ?? []) as { id: string; original_url: string | null; display_url: string | null; type: string; created_at: string }[]

  const bucket = process.env.R2_BUCKET_NAME || 'claude-guestvue'
  const r2 = getR2Client()

  // Generate presigned URLs in parallel (max 5 min expiry)
  const signed = await Promise.all(
    files.map(async (u, i) => {
      const rawUrl = u.original_url || u.display_url
      if (!rawUrl) return null

      const key = extractKey(rawUrl)
      if (!key) return null

      const ext = u.type === 'video' ? 'mp4' : 'jpg'
      const filename = `${event.name.replace(/[^\w\- ]/g, '').trim()}-${String(i + 1).padStart(3, '0')}.${ext}`

      try {
        const url = await getSignedUrl(
          r2,
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${filename}"`,
            ResponseContentType: u.type === 'video' ? 'video/mp4' : 'image/jpeg',
          }),
          { expiresIn: 300 } // 5 minutes
        )
        return { url, filename, type: u.type }
      } catch {
        // If presigning fails (missing creds), fall back to proxy URL
        const proxyUrl = `/api/download?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(filename)}`
        return { url: proxyUrl, filename, type: u.type }
      }
    })
  )

  const urls = signed.filter(Boolean) as { url: string; filename: string; type: string }[]

  return NextResponse.json({
    urls,
    eventName: event.name,
    count: urls.length,
  })
}
