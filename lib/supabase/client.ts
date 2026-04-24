import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function getConfig(): { url: string; anonKey: string } {
  // Prefer the runtime-injected values from the server layout (always correct).
  // Fall back to build-time baked values for local dev where the script tag isn't needed.
  if (typeof window !== 'undefined') {
    const w = window as typeof window & {
      __GV_SUPABASE_URL__?: string
      __GV_SUPABASE_ANON_KEY__?: string
    }
    const url = w.__GV_SUPABASE_URL__ || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anonKey = w.__GV_SUPABASE_ANON_KEY__ || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, anonKey }
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  }
}

export function createClient() {
  const { url, anonKey } = getConfig()
  return createBrowserClient<Database>(url, anonKey)
}
