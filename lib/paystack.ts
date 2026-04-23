// ─── Paystack helpers ─────────────────────────────────────────────────────────
// All amounts are in KOBO (₦1 = 100 kobo).

const PAYSTACK_BASE = 'https://api.paystack.co'

function headers() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export interface PaystackInitResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

// ── Initialize a one-time payment ─────────────────────────────────────────────
export async function initializePayment({
  email,
  amountKobo,
  reference,
  callbackUrl,
  metadata = {},
}: {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}): Promise<PaystackInitResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  })

  const body = await res.json()
  if (!body.status) throw new Error(body.message || 'Paystack initialization failed')

  return {
    authorizationUrl: body.data.authorization_url,
    accessCode: body.data.access_code,
    reference: body.data.reference,
  }
}

// ── Verify a transaction by reference ─────────────────────────────────────────
export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: headers(),
  })
  const body = await res.json()
  if (!body.status) throw new Error(body.message || 'Verification failed')
  return body.data
}

// ── Create a subscription plan (run once via admin script) ────────────────────
export async function createPlan({
  name,
  amountKobo,
  interval,
}: {
  name: string
  amountKobo: number
  interval: 'monthly' | 'annually'
}): Promise<string> {
  const res = await fetch(`${PAYSTACK_BASE}/plan`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, amount: amountKobo, interval }),
  })
  const body = await res.json()
  if (!body.status) throw new Error(body.message)
  return body.data.plan_code
}

// ── Generate a unique Paystack reference ──────────────────────────────────────
export function generateRef(prefix = 'gv'): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 7)
  return `${prefix}_${ts}${rand}`.toUpperCase()
}
