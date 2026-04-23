'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type PlanType = 'individual' | 'business' | 'planner'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [planType, setPlanType] = useState<PlanType>('individual')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, plan_type: planType },
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

    // 2. Insert profile row (trigger also handles this, but belt-and-suspenders)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      phone: phone || null,
      plan_type: planType,
      is_admin: false,
      referral_code: null,
      referred_by: referralCode || null,
    })

    if (profileError) {
      // Non-fatal — profile may have been created by DB trigger
      console.warn('Profile upsert warning:', profileError.message)
    }

    router.push('/dashboard')
    router.refresh()
  }

  const planOptions: { id: PlanType; label: string; sub: string }[] = [
    { id: 'individual', label: 'Individual / Host', sub: 'For personal events & celebrations' },
    { id: 'business', label: 'Business', sub: 'For brands, corporates & activations' },
    { id: 'planner', label: 'Event Planner', sub: 'Manage multiple events for clients' },
  ]

  return (
    <div className="min-h-screen bg-gradient-brand flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="font-display font-black text-white text-xl">GV</span>
            </div>
            <span className="font-display font-black text-white text-2xl">GuestVue</span>
          </Link>
          <p className="text-white/70 mt-3 text-sm">Create your free account</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {[1, 2].map(n => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                n <= step ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display font-bold text-2xl text-midnight-900 mb-1">
            {step === 1 ? 'Who are you?' : 'Your details'}
          </h1>
          <p className="text-sm text-midnight-500 mb-6">
            {step === 1 ? 'Choose your account type' : 'Just a few more things'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {planOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlanType(opt.id)}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                    planType === opt.id
                      ? 'border-ocean bg-ocean/5'
                      : 'border-midnight-100 hover:border-midnight-200'
                  }`}
                >
                  <p className={`font-semibold text-sm ${planType === opt.id ? 'text-ocean' : 'text-midnight-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-midnight-400 mt-0.5">{opt.sub}</p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-ocean hover:bg-ocean-600 text-white font-bold py-3 rounded-xl transition-all shadow-brand mt-4"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Amaka Okafor"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">
                  Phone <span className="text-midnight-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-midnight-700 mb-2">
                  Referral code <span className="text-midnight-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="GV-XXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm uppercase"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-midnight-100 hover:bg-midnight-200 text-midnight-700 font-semibold py-3 rounded-xl transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-ocean hover:bg-ocean-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-brand"
                >
                  {loading ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-midnight-100 text-center">
            <p className="text-sm text-midnight-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-ocean font-semibold hover:text-cobalt">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6 px-4">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
