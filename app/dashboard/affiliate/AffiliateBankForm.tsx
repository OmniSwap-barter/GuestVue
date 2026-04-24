'use client'

import { useState } from 'react'

interface BankAccount {
  bank_name?: string
  account_number?: string
  account_name?: string
}

interface Props {
  initial: BankAccount | null
}

export default function AffiliateBankForm({ initial }: Props) {
  const [bankName, setBankName] = useState(initial?.bank_name ?? '')
  const [accountNumber, setAccountNumber] = useState(initial?.account_number ?? '')
  const [accountName, setAccountName] = useState(initial?.account_name ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [showChangeWarning, setShowChangeWarning] = useState(false)

  const hasExisting = !!initial?.account_number
  const isDirty =
    bankName !== (initial?.bank_name ?? '') ||
    accountNumber !== (initial?.account_number ?? '') ||
    accountName !== (initial?.account_name ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasExisting && isDirty && !showChangeWarning) {
      setShowChangeWarning(true)
      return
    }
    await save()
  }

  async function save() {
    setSaving(true)
    setShowChangeWarning(false)
    setStatus('idle')
    setErrorMsg('')
    try {
      const res = await fetch('/api/affiliate/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save')
        setStatus('error')
      } else {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Security warning for changes */}
      {showChangeWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">You are changing your payout bank details</p>
            <p className="text-xs text-amber-700 mt-0.5">A security notification will be sent to your email. Only proceed if this change is intentional.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => setShowChangeWarning(false)}
              className="text-xs text-amber-700 font-semibold px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100 transition-all">
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="text-xs text-white font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 transition-all disabled:opacity-60">
              {saving ? 'Saving…' : 'Confirm change'}
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-midnight-600 mb-1.5">Bank Name</label>
          <input
            type="text"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            placeholder="e.g. First Bank, GTBank, Access Bank"
            required
            className="w-full px-3 py-2.5 text-sm bg-cloud border border-midnight-200 rounded-xl text-midnight-900 placeholder:text-midnight-300 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-midnight-600 mb-1.5">Account Number</label>
          <input
            type="text"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit NUBAN"
            pattern="\d{10}"
            required
            className="w-full px-3 py-2.5 text-sm bg-cloud border border-midnight-200 rounded-xl text-midnight-900 placeholder:text-midnight-300 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition font-mono"
          />
          {accountNumber.length > 0 && accountNumber.length < 10 && (
            <p className="text-xs text-[#E8735C] mt-1">{10 - accountNumber.length} more digit{10 - accountNumber.length !== 1 ? 's' : ''} needed</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-midnight-600 mb-1.5">Account Name</label>
          <input
            type="text"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="Name on account"
            required
            className="w-full px-3 py-2.5 text-sm bg-cloud border border-midnight-200 rounded-xl text-midnight-900 placeholder:text-midnight-300 focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-xs text-[#E8735C] font-semibold">{errorMsg}</p>
      )}

      {!showChangeWarning && (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="bg-ocean text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-ocean-600 disabled:opacity-40 transition-all"
          >
            {saving ? 'Saving…' : hasExisting ? 'Update bank details' : 'Save bank details'}
          </button>
          {status === 'saved' && (
            <span className="text-sm text-teal font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-midnight-400">
        Payouts are sent bi-weekly. Any change to bank details triggers a security email to your registered address.
      </p>
    </form>
  )
}
