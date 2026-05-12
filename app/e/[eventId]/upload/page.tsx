import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import GuestUploadClient from '../GuestUploadClient'

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function GuestUploadPage({ params }: Props) {
  const { eventId } = await params
  const supabase = createAdminClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return notFound()

  const now = new Date()
  const isExpired =
    event.status === 'expired' ||
    (event.page_expires_at && new Date(event.page_expires_at) < now)

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

export const dynamic = 'force-dynamic'
