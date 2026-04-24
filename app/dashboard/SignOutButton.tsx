'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all hidden sm:block"
    >
      Sign out
    </button>
  )
}
