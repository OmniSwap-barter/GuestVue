import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import GalleryView from './GalleryView'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function EventGalleryPage({ params }: Props) {
  const { eventId } = await params
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return notFound()

  // Most-recently published complete reel (published_to_gallery flag set by host)
  const { data: reel } = await supabase
    .from('reels')
    .select('id, output_url, status')
    .eq('event_id', eventId)
    .eq('status', 'complete')
    .eq('published_to_gallery', true)
    .not('output_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Only show approved (or not-yet-moderated, i.e. approved IS NULL) uploads.
  // The approved column defaults to true, so existing uploads always pass.
  // Rejected uploads (approved = false) are hidden from guests.
  const { data: uploadsWithNames } = await supabase
    .from('uploads')
    .select('id, original_url, display_url, type, created_at, guest_name')
    .eq('event_id', eventId)
    .in('status', ['ready', 'processing'])
    .or('approved.is.null,approved.eq.true')
    .order('created_at', { ascending: false })
    .limit(500)

  // Fallback without guest_name for type safety
  const uploads = uploadsWithNames

  const finalUploads = (uploadsWithNames ?? uploads ?? []) as Array<{
    id: string
    original_url: string
    display_url: string | null
    type: string
    created_at: string
    guest_name?: string | null
  }>

  return (
    <GalleryView
      event={{
        id: event.id,
        name: event.name,
        hashtag: event.hashtag ?? null,
        custom_color: event.custom_color ?? null,
        custom_logo: event.custom_logo ?? null,
        status: event.status,
        upload_count: event.upload_count,
      }}
      reelUrl={reel?.output_url ?? null}
      initialUploads={finalUploads}
    />
  )
}

export const dynamic = 'force-dynamic'
