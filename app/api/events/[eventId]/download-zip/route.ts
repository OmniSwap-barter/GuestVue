import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { zipSync, strToU8 } from 'fflate'

// Public endpoint — no auth required. Guests can download all event photos as a ZIP.
// Files are fetched from Supabase Storage (public URLs) and zipped server-side.
// Capped at 200 files to avoid memory issues on Vercel's 1792 MB limit.
const MAX_FILES = 200

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const admin = createAdminClient()

  // Fetch event to get name (public — no auth needed)
  const { data: event } = await admin
    .from('events')
    .select('id, name, status')
    .eq('id', eventId)
    .single() as any

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Fetch uploads from Supabase Storage (original_url is a public URL)
  const { data: uploads } = await admin
    .from('uploads')
    .select('id, original_url, type, created_at')
    .eq('event_id', eventId)
    .in('status', ['ready', 'processing'])
    .order('created_at', { ascending: true })
    .limit(MAX_FILES) as any

  const files = (uploads ?? []) as {
    id: string
    original_url: string | null
    type: string
    created_at: string
  }[]

  if (files.length === 0) {
    return NextResponse.json({ error: 'No photos to download.' }, { status: 404 })
  }

  // Fetch all files in parallel and build the zip payload
  const fetched = await Promise.allSettled(
    files.map(async (u, i) => {
      const url = u.original_url
      if (!url) return null

      const ext = u.type === 'video'
        ? 'mp4'
        : url.match(/\.(png|webp|gif|heic|jpeg)$/i)?.[1] ?? 'jpg'

      const filename = `${String(i + 1).padStart(3, '0')}.${ext}`

      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      if (!res.ok) return null

      const buf = await res.arrayBuffer()
      return { filename, data: new Uint8Array(buf) }
    })
  )

  const zipFiles: Record<string, Uint8Array> = {}
  for (const result of fetched) {
    if (result.status === 'fulfilled' && result.value) {
      const { filename, data } = result.value
      zipFiles[filename] = data
    }
  }

  if (Object.keys(zipFiles).length === 0) {
    return NextResponse.json({ error: 'Could not fetch any files.' }, { status: 500 })
  }

  // Add a small readme so the archive isn't completely bare
  const safeName = event.name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim()
  zipFiles['README.txt'] = strToU8(
    `Photos from: ${event.name}\nDownloaded via GuestVue — theguestvue.com\n`
  )

  const zipBuffer = zipSync(zipFiles, { level: 0 }) // level 0 = store, fast for already-compressed media

  const zipFilename = `${safeName.replace(/\s+/g, '_') || 'GuestVue_Photos'}_${eventId.slice(0, 6)}.zip`

  return new NextResponse(Buffer.from(zipBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipFilename}"`,
      'Content-Length': String(zipBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  })
}
