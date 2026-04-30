import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {}
        },
      },
    }
  )
}

// Alias used in dashboard server components
export const createServerClient_server = createClient

// Admin client — bypasses RLS. Falls back to anon key if service role key is missing.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const key = (serviceKey && serviceKey.length > 20) ? serviceKey : anonKey
  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// User-authenticated DB client — sets the user's JWT explicitly in the Authorization
// header so RLS policies (auth.uid() = id) always work, regardless of service role key.
export function createUserAuthClient(accessToken: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}

// ─── Direct cookie token reader ───────────────────────────────────────────────
// @supabase/ssr@0.5.x stores the session as:
//   "base64-<base64url(sessionJSON)>" in cookie "sb-<projectRef>-auth-token"
// (possibly chunked into .0, .1, .2 … if over 3180 encoded bytes).
// getSession() is unreliable in Next.js server components — this reads
// the token directly from cookies so createUserAuthClient always gets a
// fresh, valid JWT without depending on getSession() at all.
const PROJECT_REF =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] ?? ''
const AUTH_COOKIE_KEY = `sb-${PROJECT_REF}-auth-token`
const SUPABASE_BASE64_PREFIX = 'base64-'

export async function getServerAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const all = cookieStore.getAll()

    // Reassemble chunked cookie: try base key first, then .0, .1, .2 …
    let combined = ''
    const base = all.find(c => c.name === AUTH_COOKIE_KEY)
    if (base) {
      combined = base.value
    } else {
      for (let i = 0; i < 10; i++) {
        const chunk = all.find(c => c.name === `${AUTH_COOKIE_KEY}.${i}`)
        if (!chunk) break
        combined += chunk.value
      }
    }

    if (!combined) return null

    // Decode the base64- prefix that @supabase/ssr adds before storing
    const raw = combined.startsWith(SUPABASE_BASE64_PREFIX)
      ? Buffer.from(combined.slice(SUPABASE_BASE64_PREFIX.length), 'base64url').toString('utf-8')
      : combined

    const session = JSON.parse(raw)
    return (session?.access_token as string) ?? null
  } catch {
    return null
  }
}

// Convenience: returns a db client authenticated as the current user.
// Falls back to admin client if no token is found (e.g. SSR pre-render).
export async function createServerUserClient() {
  const token = await getServerAccessToken()
  return token ? createUserAuthClient(token) : createAdminClient()
}
