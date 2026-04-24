import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createServerUserClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = await createServerUserClient()

  let { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Auto-create profile if missing — user is authenticated so don't redirect
  if (!profile) {
    const { data: created } = await db
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: (user.user_metadata?.full_name as string) ?? '',
        plan_type: 'individual',
      }, { onConflict: 'id' })
      .select()
      .single()
    profile = created
  }

  if (!profile) redirect('/dashboard') // last resort — back to dashboard, not login

  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700">
            ← Dashboard
          </Link>
          <h1 className="font-display font-bold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <SettingsClient profile={profile} email={user.email ?? ''} />
      </main>
    </div>
  )
}
