'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          plan_type: 'individual',
          referred_by: referralCode || null,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Signup failed — please try again.')
      setLoading(false)
      return
    }

    // If there is NO session, email confirmation is required
    if (!authData.session) {
      setAwaitingConfirmation(true)
      setLoading(false)
      return
    }

    // Email confirmation is disabled — session is active, go to dashboard
    router.push('/dashboard')
    router.refresh()
  }

  // ── Success / confirmation waiting screen ───────────────────────────────
  if (awaitingConfirmation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="GuestVue" width={44} height={44} priority />
              <span className="font-display font-black text-white text-2xl tracking-tight">GuestVue</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6] text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-3">Account created!</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Check your inbox and click the verification link to activate your account. Then come back to sign in.
            </p>
            <Link
              href="/auth/login"
              className="inline-block text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
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
          <p className="text-white/60 mt-3 text-sm">Create your free account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6]">
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Get started free</h1>
          <p className="text-sm text-gray-500 mb-6">No credit card required</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Amaka Okafor"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm"
              />
            </div>

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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Referral code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="GV-XXXXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#0A4F6B] font-semibold hover:text-[#1E5AAF] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6 px-4">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
