import { createAdminClient } from '@/lib/supabase/server'
import PhotoWallClient from './PhotoWallClient'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function PhotoWallPage({ params }: Props) {
  const { eventId } = await params
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, hashtag, custom_color, custom_logo, status')
    .eq('id', eventId)
    .single()

  if (!event || event.status !== 'active') {
    notFound()
  }

  const { data: uploads } = await supabase
    .from('uploads')
    .select('id, original_url, display_url, type, created_at')
    .eq('event_id', eventId)
    .eq('type', 'photo')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <PhotoWallClient
      event={event as { id: string; name: string; hashtag: string | null; custom_color: string | null; custom_logo: string | null; status: string }}
      initialUploads={(uploads ?? []) as { id: string; original_url: string; display_url: string | null; type: string; created_at: string }[]}
    />
  )
}
