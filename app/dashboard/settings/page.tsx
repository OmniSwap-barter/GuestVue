import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-cloud">
      <header className="bg-white border-b border-midnight-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-midnight-400 hover:text-midnight-700">
            ← Dashboard
          </Link>
          <h1 className="font-display font-bold text-midnight-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-midnight-100 p-6">
          <h2 className="font-display font-bold text-midnight-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  defaultValue={profile.full_name || ''}
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 text-midnight-900 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  defaultValue={profile.phone || ''}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 text-midnight-900 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-midnight-700 mb-1.5">Email address</label>
              <input
                type="email"
                defaultValue={profile.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-midnight-100 bg-midnight-50 text-midnight-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-midnight-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>
            <button className="bg-ocean text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-ocean-600 transition-all shadow-brand">
              Save changes
            </button>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-white rounded-2xl border border-midnight-100 p-6">
          <h2 className="font-display font-bold text-midnight-900 mb-1">Your plan</h2>
          <p className="text-sm text-midnight-500 mb-4">
            Currently on the <strong className="text-midnight-900 capitalize">{profile.plan_type}</strong> plan.
          </p>
          <Link href="/pricing"
            className="inline-block bg-gradient-brand text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-brand hover:scale-105 transition-all">
            View & upgrade plans →
          </Link>
        </div>

        {/* Affiliate */}
        <div className="bg-white rounded-2xl border border-midnight-100 p-6">
          <h2 className="font-display font-bold text-midnight-900 mb-1">Affiliate programme</h2>
          <p className="text-sm text-midnight-500 mb-4">
            {profile.referral_code
              ? `Your referral code: ${profile.referral_code}`
              : 'Earn 20% commission by referring event hosts to GuestVue.'}
          </p>
          <Link href="/dashboard/affiliate"
            className="inline-block border border-midnight-200 text-midnight-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-midnight-50 transition-all">
            Manage affiliate account →
          </Link>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-midnight-100 p-6">
          <h2 className="font-display font-bold text-midnight-900 mb-1">Sign out</h2>
          <p className="text-sm text-midnight-500 mb-4">You&apos;ll be taken back to the login page.</p>
          <form action="/api/auth/signout" method="POST">
            <button type="submit"
              className="border border-midnight-200 text-midnight-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-midnight-50 transition-all">
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
