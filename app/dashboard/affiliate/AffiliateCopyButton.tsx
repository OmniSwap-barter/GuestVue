'use client'

import { useState } from 'react'

export default function AffiliateCopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
      <span className="text-sm font-mono font-bold truncate flex-1">{link}</span>
      <button
        onClick={copy}
        className="flex-shrink-0 bg-white text-ocean text-xs font-bold px-3 py-1 rounded-lg hover:scale-105 transition-all"
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  )
}
