import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { AFFILIATE } from '@/lib/pricing'

function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'GV'
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${suffix}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient_server()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.referral_code) return NextResponse.json({ error: 'Already an affiliate' }, { status: 400 })

    // Generate unique referral code
    let code = generateReferralCode(profile.full_name || 'GV')
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await admin.from('profiles').select('id').eq('referral_code', code).single()
      if (!existing) break
      code = generateReferralCode(profile.full_name || 'GV')
      attempts++
    }

    // Create affiliate record
    const { data: affiliate } = await admin
      .from('affiliates')
      .insert({
        id: user.id,
        type: profile.plan_type,
        referral_code: code,
        commission_rate: AFFILIATE.standardRate,
        total_referrals: 0,
        total_earned: 0,
        total_paid: 0,
      })
      .select()
      .single()

    // Update profile with referral code
    await admin.from('profiles').update({ referral_code: code }).eq('id', user.id)

    return NextResponse.json({ affiliate, code }, { status: 201 })
  } catch (err) {
    console.error('Affiliate join error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
