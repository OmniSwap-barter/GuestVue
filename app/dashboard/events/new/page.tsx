import { redirect } from 'next/navigation'
import CreateEventForm from './CreateEventForm'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export default async function NewEventPage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('plan_type')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-cloud">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <a href="/dashboard" className="text-sm text-midnight-400 hover:text-midnight-700 mb-4 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="font-display font-bold text-2xl text-midnight-900">Create a new event</h1>
          <p className="text-midnight-500 text-sm mt-1">
            Your QR code will be ready in seconds.
          </p>
        </div>
        <CreateEventForm userId={user.id} planType={profile?.plan_type ?? 'individual'} />
      </div>
    </div>
  )
}
