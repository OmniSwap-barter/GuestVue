'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string
  plan_type: string
  referral_code: string | null
}

interface Props {
  profile: Profile
  email: string
}

export default function SettingsClient({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [signingOut, setSigningOut] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveStatus('idle')

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq('id', profile.id)

    setSaving(false)
    setSaveStatus(error ? 'error' : 'saved')
    if (!error) setTimeout(() => setSaveStatus('idle'), 3000)
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const planLabel = profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1)

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-display font-bold text-slate-900 mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0A4F6B] hover:bg-[#1E5AAF] disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-sm text-[#14B8A6] font-semibold">✓ Saved!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-500">Failed to save. Try again.</span>
            )}
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-display font-bold text-slate-900 mb-1">Password</h2>
        <p className="text-sm text-slate-500 mb-4">Change your password or reset it if you&apos;ve forgotten it.</p>
        <Link
          href="/auth/reset"
          className="inline-block border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all"
        >
          Send password reset email →
        </Link>
      </div>

      {/* Plan */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-slate-900 mb-1">Your plan</h2>
            <p className="text-sm text-slate-500">
              Currently on the <strong className="text-slate-900">{planLabel}</strong> account.
              Your plan level is per account; each event has its own plan (Free / Flex / Pro).
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0A4F6B]/10 text-[#0A4F6B] flex-shrink-0">
            {planLabel}
          </span>
        </div>
        <div className="mt-4">
          <Link href="/pricing"
            className="inline-block text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #1E5AAF)' }}>
            View plans & pricing →
          </Link>
        </div>
      </div>

      {/* Affiliate */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-display font-bold text-slate-900 mb-1">Affiliate programme</h2>
        {profile.referral_code ? (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Your referral code: <strong className="text-slate-900 font-mono">{profile.referral_code}</strong>
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Share your code and earn 20% commission on every paid event booked with it.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500 mb-4">
            Earn 20% commission by referring event hosts to GuestVue.
          </p>
        )}
        <Link href="/dashboard/affiliate"
          className="inline-block border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          Manage affiliate account →
        </Link>
      </div>

      {/* Danger / Sign out */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-display font-bold text-slate-900 mb-1">Sign out</h2>
        <p className="text-sm text-slate-500 mb-4">You&apos;ll be taken back to the login page.</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-all"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
