import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bankName, accountNumber, accountName } = await req.json()

  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: 'All bank fields are required' }, { status: 400 })
  }

  // Basic validation
  if (!/^\d{10}$/.test(accountNumber.trim())) {
    return NextResponse.json({ error: 'Account number must be exactly 10 digits' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get profile to find affiliate
  const { data: profile } = await admin
    .from('profiles')
    .select('referral_code, email, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.referral_code) {
    return NextResponse.json({ error: 'Not an affiliate' }, { status: 400 })
  }

  // Get current affiliate record
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, bank_account')
    .eq('referral_code', profile.referral_code)
    .single()

  if (!affiliate) {
    return NextResponse.json({ error: 'Affiliate record not found' }, { status: 404 })
  }

  const hadExistingBank = !!affiliate.bank_account
  const newBankAccount = {
    bank_name: bankName.trim(),
    account_number: accountNumber.trim(),
    account_name: accountName.trim(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin
    .from('affiliates')
    .update({ bank_account: newBankAccount })
    .eq('id', affiliate.id)

  if (error) {
    console.error('[bank-details] update error:', error)
    return NextResponse.json({ error: 'Failed to save bank details' }, { status: 500 })
  }

  // Security alert email for changes to existing bank info
  if (hadExistingBank) {
    console.warn(`[SECURITY] Affiliate ${user.id} (${profile.email}) changed bank details at ${new Date().toISOString()}`)
    // TODO: Send email alert via Resend when configured
    // await sendEmail({ to: profile.email, subject: 'Bank details changed on GuestVue', ... })
  }

  return NextResponse.json({ success: true, isUpdate: hadExistingBank })
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  if (!profile?.referral_code) {
    return NextResponse.json({ bank_account: null })
  }

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('bank_account')
    .eq('referral_code', profile.referral_code)
    .single()

  return NextResponse.json({ bank_account: affiliate?.bank_account ?? null })
}
