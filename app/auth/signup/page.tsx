'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [phone, setPhone]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resending, setResending]       = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle')

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
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          plan_type: 'individual',
          referred_by: referralCode.trim() || null,
        },
      },
    })

    if (authError) { setError(authError.message); setLoading(false); return }
    if (!authData.user) { setError('Signup failed — please try again.'); setLoading(false); return }

    if (!authData.session) {
      setAwaitingConfirmation(true)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  async function handleResend() {
    setResending(true)
    setResendStatus('idle')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      setResendStatus(error ? 'error' : 'sent')
    } catch { setResendStatus('error') }
    finally { setResending(false) }
  }

  // ── Frame 2: Verification gate ───────────────────────────────────────────
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.svg" alt="GuestVue" width={44} height={44} priority />
              <span className="font-display font-black text-white text-2xl tracking-tight">GuestVue</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6]">
            <div className="w-16 h-16 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#14B8A6]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2 text-center">Check your inbox</h2>
            <p className="text-gray-500 text-sm text-center mb-1">We sent a confirmation link to</p>
            <p className="text-[#0A4F6B] font-semibold text-sm text-center mb-6 break-all">{email}</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-500 leading-relaxed">
              Click the link in the email to verify your account, then return here to sign in. Do not see it? Check your spam folder.
            </div>
            <div className="text-center mb-5">
              {resendStatus === 'sent' ? (
                <p className="text-sm text-[#14B8A6] font-semibold">Verification email resent!</p>
              ) : resendStatus === 'error' ? (
                <p className="text-sm text-red-500">Failed to resend. Try again shortly.</p>
              ) : (
                <button onClick={handleResend} disabled={resending}
                  className="text-sm text-slate-500 hover:text-[#0A4F6B] underline disabled:opacity-60 transition-colors">
                  {resending ? 'Resending…' : "Didn't get it? Resend verification email"}
                </button>
              )}
            </div>
            <Link href="/auth/login"
              className="block w-full text-center text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Frame 1: Registration ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #0A4F6B 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.svg" alt="GuestVue" width={44} height={44} priority />
            <span className="font-display font-black text-white text-2xl tracking-tight">GuestVue</span>
          </Link>
          <p className="text-white/60 mt-3 text-sm">Create your free account — no credit card needed</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl border-t-4 border-[#14B8A6]">
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">Get started free</h1>
          <p className="text-sm text-gray-500 mb-6">Takes 60 seconds.</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Amaka Okafor"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={8}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm pr-11" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Referral code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="GV-XXXXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-gray-900 text-sm uppercase tracking-widest" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm mt-2"
              style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #1E5AAF 50%, #E8735C 100%)' }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#0A4F6B] font-semibold hover:text-[#1E5AAF] transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-white/40 text-xs mt-6 px-4">
          By signing up you agree to our{' '}
          <Link href="/terms" className="hover:text-white/60 underline">Terms</Link> and{' '}
          <Link href="/privacy" className="hover:text-white/60 underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
