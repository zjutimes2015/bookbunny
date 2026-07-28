import { neon } from '@neondatabase/serverless'
import AnalyticsClient from './analytics-client'

async function getAnalyticsData() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const [dailyBooks, dailyUsers, statusCounts] = await Promise.all([
      sql`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM books GROUP BY day ORDER BY day DESC LIMIT 14
      `,
      sql`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM characters GROUP BY day ORDER BY day DESC LIMIT 14
      `,
      sql`
        SELECT status, COUNT(*) as count
        FROM books GROUP BY status
      `,
    ])

    return {
      dailyBooks: (dailyBooks as { day: string; count: number }[]).reverse(),
      dailyUsers: (dailyUsers as { day: string; count: number }[]).reverse(),
      statusCounts: statusCounts as { status: string; count: number }[],
    }
  } catch {
    return { dailyBooks: [], dailyUsers: [], statusCounts: [] }
  }
}

export default async function AdminAnalytics() {
  const data = await getAnalyticsData()

  const hasData = data.dailyBooks.length > 0 || data.dailyUsers.length > 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2D2D]">Analytics</h1>
        <p className="text-sm text-[#8E8E93] mt-1">Usage trends over time</p>
      </div>

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
