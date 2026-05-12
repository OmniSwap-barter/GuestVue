import { redirect } from 'next/navigation'
import { createServerClient_server, createServerUserClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

interface Props {
  searchParams: Promise<{ onboarded?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { onboarded } = await searchParams

  // Auth check via SSR client (needs cookies)
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = await createServerUserClient()

  // Get profile — never redirect to login for a missing profile row
  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile missing — create it on the fly so the user reaches the dashboard
    const { data: created } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) ?? '',
        plan_type: 'individual',
        onboarding_complete: true,
      }, { onConflict: 'id' })
      .select()
      .single()
    profile = created
  }

  // Gate: incomplete onboarding → redirect (skip for admin-created profiles)
  if (profile && profile.onboarding_complete === false) {
    redirect('/onboarding')
  }

  // Fallback object if DB is entirely unreachable — user still lands on dashboard
  const safeProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: '',
    plan_type: 'individual' as const,
    referral_code: null,
    is_admin: false,
    onboarding_complete: true,
    country: null,
    created_at: new Date().toISOString(),
  }

  // Get events
  const { data: events } = await admin
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const activeEvents = events?.filter(e => e.status === 'active') ?? []
  const totalUploads = events?.reduce((sum, e) => sum + e.upload_count, 0) ?? 0
  const firstName = safeProfile.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  const planType = safeProfile.plan_type ?? 'individual'

  return (
    <DashboardClient
      firstName={firstName}
      planType={planType}
      events={events ?? []}
      activeEventCount={activeEvents.length}
      totalUploads={totalUploads}
      onboarded={onboarded}
    />
  )
}
