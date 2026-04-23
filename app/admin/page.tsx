import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'guestvueapp@outlook.com'

export default async function AdminPage() {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const admin = createAdminClient()

  // Fetch stats
  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalUploads },
    { data: recentSignups },
    { data: recentEvents },
    { data: planBreakdown },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('events').select('*', { count: 'exact', head: true }),
    admin.from('uploads').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('id, email, created_at, referral_code').order('created_at', { ascending: false }).limit(10),
    admin.from('events').select('id, name, plan, status, upload_count, created_at, host_id').order('created_at', { ascending: false }).limit(10),
    admin.from('events').select('plan').then(({ data }) => {
      if (!data) return { data: [] }
      const counts: Record<string, number> = {}
      data.forEach(e => { counts[e.plan] = (counts[e.plan] || 0) + 1 })
      return { data: Object.entries(counts).map(([plan, count]) => ({ plan, count })) }
    }),
  ])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700">
              ← Dashboard
            </Link>
            <span className="text-slate-200">|</span>
            <h1 className="font-bold text-slate-900">Admin Panel</h1>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">INTERNAL</span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">{user.email}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total users', value: totalUsers?.toLocaleString() ?? '—', icon: '👥', color: 'bg-[#0A4F6B]' },
            { label: 'Total events', value: totalEvents?.toLocaleString() ?? '—', icon: '🎉', color: 'bg-[#1E5AAF]' },
            { label: 'Total uploads', value: totalUploads?.toLocaleString() ?? '—', icon: '📸', color: 'bg-[#14B8A6]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>
                {s.icon}
              </div>
              <p className="font-black text-2xl text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        {planBreakdown && planBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Events by plan</h2>
            <div className="flex flex-wrap gap-3">
              {(planBreakdown as { plan: string; count: number }[]).map(({ plan, count }) => (
                <div key={plan} className="bg-[#F8FAFC] rounded-xl border border-slate-100 px-4 py-2.5 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    plan === 'pro' ? 'bg-[#0A4F6B]' :
                    plan === 'flex' ? 'bg-[#1E5AAF]' :
                    'bg-slate-300'
                  }`} />
                  <span className="font-bold text-slate-800 uppercase text-xs">{plan}</span>
                  <span className="font-black text-slate-900 text-sm">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent signups */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent signups</h2>
            <span className="text-xs text-slate-400">Last 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Referral code</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSignups?.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{u.email || '—'}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{u.referral_code || '—'}</td>
                    <td className="px-6 py-3 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {(!recentSignups || recentSignups.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm">No users yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent events</h2>
            <span className="text-xs text-slate-400">Last 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Event name</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Uploads</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEvents?.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">{ev.name}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
                        ev.plan === 'pro' ? 'bg-[#0A4F6B]/10 text-[#0A4F6B]' :
                        ev.plan === 'flex' ? 'bg-[#1E5AAF]/10 text-[#1E5AAF]' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {ev.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${
                        ev.status === 'active' ? 'bg-[#14B8A6]/10 text-[#14B8A6]' :
                        ev.status === 'paused' ? 'bg-[#E8735C]/10 text-[#E8735C]' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{ev.upload_count}</td>
                    <td className="px-6 py-3 text-slate-400">
                      {new Date(ev.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/dashboard/events/${ev.id}`}
                        className="text-xs text-[#0A4F6B] font-semibold hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!recentEvents || recentEvents.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No events yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
