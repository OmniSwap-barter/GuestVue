'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AffiliateJoinButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/join', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      // Refresh the server component so the page re-fetches affiliate data
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={loading}
        className="bg-white text-ocean font-bold px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-wait disabled:scale-100"
      >
        {loading ? 'Joining…' : 'Join the Programme →'}
      </button>
      {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
    </div>
  )
}
