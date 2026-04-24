'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  planType: string
}

type EventPlan = 'free' | 'flex' | 'pro'

export default function CreateEventForm({ userId, planType }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [hashtag, setHashtag] = useState('')
  const [plan, setPlan] = useState<EventPlan>('free')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Get the browser session JWT and send it in the Authorization header.
    // This bypasses server-side cookie reading entirely, which is unreliable
    // in Next.js API routes when using @supabase/ssr.
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        name,
        event_date: eventDate || null,
        hashtag: hashtag.replace(/^#/, '') || null,
        plan,
      }),
    })

    const body = await res.json()

    if (!res.ok) {
      setError(body.error || 'Failed to create event.')
      setLoading(false)
      return
    }

    // Paid plans → redirect to Paystack checkout
    if (body.paymentUrl) {
      window.location.href = body.paymentUrl
    } else {
      router.push(`/dashboard/events/${body.event.id}`)
    }
  }

  const planOptions: { id: EventPlan; label: string; price: string; uploads: string; highlight?: boolean }[] = [
    {
      id: 'free',
      label: PLANS.free.name,
      price: '₦0',
      uploads: `${PLANS.free.uploads} uploads · 24-hr page`,
    },
    {
      id: 'flex',
      label: PLANS.flex.name,
      price: `₦${PLANS.flex.price.toLocaleString('en-NG')}`,
      uploads: `${PLANS.flex.uploads} uploads · 1-month page`,
      highlight: true,
    },
    {
      id: 'pro',
      label: PLANS.pro.name,
      price: `₦${PLANS.pro.price.toLocaleString('en-NG')}`,
      uploads: `Unlimited uploads · 3-month page`,
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan selector */}
      <div className="bg-white rounded-2xl border border-midnight-100 p-5">
        <h2 className="font-display font-bold text-midnight-900 mb-4">Choose a plan for this event</h2>
        <div className="grid grid-cols-3 gap-3">
          {planOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPlan(opt.id)}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                plan === opt.id
                  ? 'border-ocean bg-ocean/5'
                  : 'border-midnight-100 hover:border-midnight-200'
              }`}
            >
              {opt.highlight && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-coral text-white font-bold px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <p className={`font-bold text-sm ${plan === opt.id ? 'text-ocean' : 'text-midnight-800'}`}>
                {opt.label}
              </p>
              <p className={`font-display font-black text-lg mt-0.5 ${plan === opt.id ? 'text-ocean' : 'text-midnight-900'}`}>
                {opt.price}
              </p>
              <p className="text-xs text-midnight-400 mt-1 leading-snug">{opt.uploads}</p>
            </button>
          ))}
        </div>
        {plan !== 'free' && (
          <p className="text-xs text-midnight-400 mt-3 text-center">
            You&apos;ll be taken to payment after event creation.
          </p>
        )}
      </div>

      {/* Event details */}
      <div className="bg-white rounded-2xl border border-midnight-100 p-5 space-y-4">
        <h2 className="font-display font-bold text-midnight-900">Event details</h2>

        <div>
          <label className="block text-sm font-semibold text-midnight-700 mb-2">
            Event name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Amaka & Chidi's Wedding"
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-midnight-700 mb-2">
            Event date <span className="text-midnight-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={e => setEventDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-midnight-700 mb-2">
            Event hashtag <span className="text-midnight-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400 text-sm font-bold">#</span>
            <input
              type="text"
              value={hashtag}
              onChange={e => setHashtag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="AmakaNChidi2025"
              maxLength={40}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-midnight-200 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean text-midnight-900 text-sm"
            />
          </div>
          <p className="text-xs text-midnight-400 mt-1">
            Appears on the QR upload page and AI reels. No spaces or symbols.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-ocean hover:bg-ocean-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-brand text-base"
      >
        {loading ? 'Creating your event…' : `Create Event ${plan !== 'free' ? '& Proceed to Payment' : ''}`}
      </button>
    </form>
  )
}
