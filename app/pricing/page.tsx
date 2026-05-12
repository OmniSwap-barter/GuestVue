// force-dynamic is REQUIRED — this page reads the Supabase session to decide
// whether plan buttons point to checkout (logged in) or login (guest).
// Without it, Vercel caches a non-logged-in render and authenticated users
// see /auth/signup links instead of /api/billing/checkout links.
export const dynamic = 'force-dynamic'

import { createServerClient_server } from '@/lib/supabase/server'
import PricingClient from './PricingClient'

export const metadata = {
  title: 'Pricing — GuestVue',
  description: 'Start free. Upgrade when you need more. Personal event plans, vendor bundles, business subscriptions, and enterprise white-label.',
}

export default async function PricingPage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  return <PricingClient isLoggedIn={!!user} />
}
