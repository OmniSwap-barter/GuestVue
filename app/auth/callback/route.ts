import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch { /* Server Component — middleware handles refresh */ }
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  // Check if this user has completed onboarding
  const { data: { user } } = await supabase.auth.getUser()
  let redirectTo = next // default (e.g. ?next= on login)

  if (user && next === '/dashboard') {
    // Only inspect onboarding status if there's no explicit ?next override
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    const profile = profileRow as { onboarding_complete: boolean } | null

    // New user (no profile yet) or profile not completed → onboarding
    if (!profile || !profile.onboarding_complete) {
      redirectTo = '/onboarding'
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'

  if (isLocal) return NextResponse.redirect(`${origin}${redirectTo}`)
  if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
