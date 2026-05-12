import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/pricing',
  '/about',
  '/faq',
  '/terms',
  '/privacy',
  '/contact',
]

// Routes starting with these prefixes are always public (guest upload pages)
const PUBLIC_PREFIXES = ['/e/', '/api/webhooks/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public prefixes
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Always allow exact public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow static files, _next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/og-image') ||
    /\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check session
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in and hits /auth pages, redirect to dashboard
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is NOT logged in and hits a protected route, redirect to login
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // Admin check done in the page itself via server component (avoids extra DB call in middleware)
  }

  // ── Entitlement gate for creating new events ──────────────────────────────
  // Authenticated users who have no active subscription and no event credits
  // are sent to /pricing. Users with no row in user_entitlements are on the
  // free tier and get a default credit, so they always pass.
  if (user && pathname === '/dashboard/events/new') {
    const { data: entitlement } = await supabase
      .from('user_entitlements')
      .select('subscription_status, event_credits, is_unlimited_events')
      .eq('user_id', user.id)
      .maybeSingle()

    // No row → free tier with default 1 credit: allow
    if (entitlement) {
      const hasActiveSubscription = entitlement.subscription_status === 'active'
      const hasCredits            = (entitlement.event_credits ?? 0) > 0
      const isUnlimited           = entitlement.is_unlimited_events === true

      if (!hasActiveSubscription && !hasCredits && !isUnlimited) {
        return NextResponse.redirect(new URL('/pricing', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
