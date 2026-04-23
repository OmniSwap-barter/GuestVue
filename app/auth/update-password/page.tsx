'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Supabase sends the user back with a hash fragment containing access_token.
  // The @supabase/ssr browser client picks this up automatically on mount.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.svg" alt="GuestVue" width={44} height={44} priority />
            <span className="font-display font-black text-white text-2xl tracking-tight">GuestVue</span>
          </Link>
          <p className="text-white/60 mt-3 text-sm">Set a new password</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6]">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Taking you to your dashboard…</p>
            </div>
          ) : hasSession === false ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="font-display font-bold text-lg text-gray-900 mb-2">Link expired</h2>
              <p className="text-sm text-gray-500 mb-6">
                This reset link has expired or already been used. Request a new one.
              </p>
              <Link
                href="/auth/reset"
                className="inline-block text-white font-bold px-6 py-3 rounded-xl shadow-lg text-sm"
                style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
              >
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Set new password</h1>
              <p className="text-sm text-gray-500 mb-6">Choose a strong password of at least 8 characters.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || hasSession === null}
                  className="w-full disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
