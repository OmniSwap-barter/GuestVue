import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import GuestUploadClient from './GuestUploadClient'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function GuestPage({ params }: Props) {
  const { eventId } = await params
  const supabase = createAdminClient()

  // Fetch event (public — no auth needed)
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return notFound()

  // Check if event page is active
  const now = new Date()
  const isExpired =
    event.status === 'expired' ||
    (event.page_expires_at && new Date(event.page_expires_at) < now)

  // Get host profile for branding
  const { data: host } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', event.host_id)
    .single()

  return (
    <GuestUploadClient
      event={event}
      hostName={host?.full_name ?? null}
      isExpired={!!isExpired}
    />
  )
}

// This page is public — no caching, always fresh
export const dynamic = 'force-dynamic'
