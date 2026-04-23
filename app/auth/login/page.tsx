'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

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
          <p className="text-white/70 mt-3 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display font-bold text-2xl text-midnight-900 mb-6">Welcome back</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ocean hover:bg-ocean-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-brand"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-midnight-100 text-center">
            <p className="text-sm text-midnight-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-ocean font-semibold hover:text-cobalt">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
