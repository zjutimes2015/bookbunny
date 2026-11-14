import { neon } from '@neondatabase/serverless'
import AnalyticsClient from './analytics-client'
import { getDemandStats, type DemandStats } from '@/lib/demand/store'

async function getAnalyticsData() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const [dailyBooks, dailyUsers, statusCounts, revenueTrend] = await Promise.all([
      sql`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM books GROUP BY day ORDER BY day DESC LIMIT 14
      `,
      sql`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM bookbunny_users GROUP BY day ORDER BY day DESC LIMIT 14
      `,
      sql`
        SELECT status, COUNT(*) as count
        FROM books GROUP BY status
      `,
      sql`
        SELECT DATE(created_at) as day, COALESCE(SUM(amount), 0) as amt
        FROM payments WHERE status = 'completed'
          AND created_at >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY day ORDER BY day
      `,
    ])

    return {
      dailyBooks: (dailyBooks as { day: string; count: number }[]).reverse(),
      dailyUsers: (dailyUsers as { day: string; count: number }[]).reverse(),
      statusCounts: (statusCounts as { status: string; count: number }[]),
      revenueTrend: (revenueTrend as { day: string; amt: number }[]).map(r => ({
        day: r.day,
        amount: Number(r.amt) / 100,
      })),
    }
  } catch {
    return { dailyBooks: [], dailyUsers: [], statusCounts: [], revenueTrend: [] }
  }
}

export default async function AdminAnalytics() {
  const [data, demand] = await Promise.all([getAnalyticsData(), getDemandStats()])

  const hasData = data.dailyBooks.length > 0 || data.dailyUsers.length > 0 || data.revenueTrend.length > 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Analytics</h1>
        <p className="text-sm text-[#8E8E93] mt-1">Usage trends over time</p>
      </div>

      {demand && <DemandStatsCard stats={demand} />}

      {!hasData ? (
        <div className="apple-card p-12 text-center">
          <div className="text-5xl mb-4">📈</div>
          <h2 className="font-semibold text-[#2D2D2D] mb-2">No Data Yet</h2>
          <p className="text-sm text-[#8E8E93]">Data will appear once users start creating books</p>
        </div>
      ) : (
        <AnalyticsClient data={data} />
      )}
    </div>
  )
}

/** R5 observability: current-month demand lookups (admin-only page). Hidden when the demand_calls table does not exist yet. */
function DemandStatsCard({ stats }: { stats: DemandStats }) {
  const hitRate = stats.calls > 0 ? Math.round((100 * stats.cacheHits) / stats.calls) : 0
  return (
    <div className="apple-card p-5 mb-6">
      <h2 className="font-semibold text-[#2D2D2D] mb-3">Demand lookups · this month</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[#2D2D2D]">{stats.calls}</p>
          <p className="text-xs text-[#8E8E93]">lookups</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#2D2D2D]">{hitRate}%</p>
          <p className="text-xs text-[#8E8E93]">cache hits</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-[#2D2D2D]">${stats.estimatedSpendUsd.toFixed(2)}</p>
          <p className="text-xs text-[#8E8E93]">estimated spend</p>
        </div>
      </div>
    </div>
  )
}
