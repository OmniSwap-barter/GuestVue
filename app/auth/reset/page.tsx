'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/update-password`
        : undefined

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
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
          <p className="text-white/60 mt-3 text-sm">Reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6]">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-3">Check your inbox</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                We&apos;ve sent a password reset link to <strong className="text-gray-800">{email}</strong>. Click the link in the email to set a new password.
              </p>
              <Link
                href="/auth/login"
                className="inline-block text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm"
                style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <Link href="/auth/login" className="text-sm text-[#0A4F6B] font-semibold hover:text-[#1E5AAF] transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
