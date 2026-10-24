import { neon } from '@neondatabase/serverless'
import { getAdminSession } from '@/lib/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — SproutTales Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const [userTotal, userPaid, userFree, monthAgo, newToday] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE is_paid = TRUE`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE is_paid = FALSE`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE created_at >= CURRENT_DATE`,
    ])

    const tierDist = await sql`
      SELECT subscription_tier, COUNT(*) as cnt FROM bookbunny_users
      GROUP BY subscription_tier ORDER BY cnt DESC
    `

    const [bookTotal, consentCnt, revenueTotal, revenueMonthly] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM books`,
      sql`SELECT COUNT(*) as cnt FROM parental_consents`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())`,
    ])

    const recentUsers = await sql`
      SELECT name, email, subscription_tier, created_at
      FROM bookbunny_users ORDER BY created_at DESC LIMIT 5
    `

    return {
      users: {
        total: Number(userTotal[0]?.cnt ?? 0),
        paid: Number(userPaid[0]?.cnt ?? 0),
        free: Number(userFree[0]?.cnt ?? 0),
        mau: Number(monthAgo[0]?.cnt ?? 0),
        newToday: Number(newToday[0]?.cnt ?? 0),
      },
      books: Number(bookTotal[0]?.cnt ?? 0),
      consents: Number(consentCnt[0]?.cnt ?? 0),
      revenue: {
        total: Number(revenueTotal[0]?.total ?? 0) / 100,
        monthly: Number(revenueMonthly[0]?.total ?? 0) / 100,
      },
      tiers: (tierDist as { subscription_tier: string; cnt: number }[]).map(r => ({
        tier: r.subscription_tier,
        count: Number(r.cnt),
      })),
      recentUsers: (recentUsers as Record<string, any>[]).map((u: Record<string, any>) => ({
        name: u.name,
        email: u.email,
        tier: u.subscription_tier || 'free',
        date: new Date(u.created_at).toLocaleDateString(),
      })),
    }
  } catch {
    return null
  }
}

export default async function AdminDashboard() {
  const admin = await getAdminSession()
  if (!admin) return null // layout handles notFound

  const stats = await getStats()

  if (!stats) {
    return (
      <div className="apple-card p-12 text-center">
        <div className="text-5xl mb-4">🗄️</div>
        <h2 className="font-semibold text-[#2D2D2D] mb-2">Database Not Connected</h2>
        <p className="text-sm text-[#8E8E93]">Add NEON_DATABASE_URL to .env.local</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Dashboard</h1>
        <p className="text-sm text-[#8E8E93] mt-1">Welcome back, {admin.email}</p>
      </div>

      {/* Key metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon="💰" label="Total Revenue" value={`$${stats.revenue.total.toFixed(2)}`}
          sub={`This month: $${stats.revenue.monthly.toFixed(2)}`} color="#FF6B8A"
        />
        <MetricCard
          icon="👥" label="Total Users" value={stats.users.total.toString()}
          sub={`${stats.users.paid} paid · ${stats.users.mau} active`} color="#C8A2E8"
        />
        <MetricCard
          icon="📚" label="Books Created" value={stats.books.toString()}
          sub={`${stats.consents} parental consents`} color="#98D8C8"
        />
        <MetricCard
          icon="🌱" label="New Today" value={stats.users.newToday.toString()}
          sub={`${stats.users.mau} last 30 days`} color="#FFDAB9"
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-3">Subscription Tiers</p>
          {stats.tiers.length === 0 ? (
            <p className="text-sm text-[#8E8E93]">No subscribers yet</p>
          ) : (
            <div className="space-y-2.5">
              {stats.tiers.map(({ tier, count }) => {
                const pct = stats.users.total > 0 ? (count / stats.users.total) * 100 : 0
                const colors: Record<string, string> = {
                  starter: '#98D8C8', creator: '#C8A2E8', studio: '#FF6B8A', free: '#E5E5EA',
                }
                return (
                  <div key={tier}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium text-[#2D2D2D]">{tier}</span>
                      <span className="text-[#8E8E93]">{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[tier] ?? '#E5E5EA' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-3">Growth Signals</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8E8E93]">Today&apos;s signups</span>
              <span className="text-lg font-bold text-[#2D2D2D]">{stats.users.newToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8E8E93]">30-day active users</span>
              <span className="text-lg font-bold text-[#2D2D2D]">{stats.users.mau}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8E8E93]">Paid conversion</span>
              <span className="text-lg font-bold text-[#FF6B8A]">
                {stats.users.total > 0 ? ((stats.users.paid / stats.users.total) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="apple-card p-5">
          <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider mb-3">Recent Signups</p>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-[#8E8E93]">No users yet</p>
          ) : (
            <div className="space-y-2.5">
              {stats.recentUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FFF5EE] flex items-center justify-center text-xs font-bold text-[#FF6B8A]">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-[#2D2D2D] truncate max-w-[100px]" title={u.email}>{u.name}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${u.tier === 'starter' ? 'bg-[#98D8C8]/20 text-[#4A9E8E]' : u.tier === 'creator' ? 'bg-[#C8A2E8]/20 text-[#7B52AB]' : 'bg-[#F2F2F7] text-[#8E8E93]'}`}>
                    {u.tier}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="apple-card p-5 flex items-start gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[#2D2D2D] mt-0.5">{value}</p>
        <p className="text-xs text-[#8E8E93] mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
