import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAdminSession } from '@/lib/admin'

/**
 * GET /api/admin/stats
 * 返回平台运营核心指标（仅 admin 可访问）
 */
export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    // 基础统计
    const [userTotal, userPaid, userFree] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE is_paid = TRUE`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE is_paid = FALSE`,
    ])

    // 订阅分档分布
    const tierDist = await sql`
      SELECT subscription_tier, COUNT(*) as cnt
      FROM bookbunny_users
      GROUP BY subscription_tier ORDER BY subscription_tier
    `

    // 月度活跃用户（过去30天有登录/创建行为）
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const [mau, newUsersToday] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE created_at >= ${monthAgo}`,
      sql`SELECT COUNT(*) as cnt FROM bookbunny_users WHERE created_at >= CURRENT_DATE`,
    ])

    // 累计书籍数 + 各状态分布
    const [bookTotal, bookStatus] = await Promise.all([
      sql`SELECT COUNT(*) as cnt FROM books`,
      sql`SELECT status, COUNT(*) as cnt FROM books GROUP BY status ORDER BY cnt DESC`,
    ])

    // 累计收入（payments 表 completed 记录 sum）
    const totalRevenue = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments WHERE status = 'completed'
    `

    // 本月收入
    const monthlyRevenue = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments WHERE status = 'completed'
        AND created_at >= DATE_TRUNC('month', NOW())
    `

    // 近14天每日收入趋势
    const revenueTrend = await sql`
      SELECT DATE(created_at) as day, SUM(amount) as amt
      FROM payments WHERE status = 'completed'
        AND created_at >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY day ORDER BY day
    `

    // 近14天每日新书趋势
    const booksTrend = await sql`
      SELECT DATE(created_at) as day, COUNT(*) as cnt
      FROM books WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY day ORDER BY day
    `

    // 总家长同意数（COPPA compliance）
    const consents = await sql`SELECT COUNT(*) as cnt FROM parental_consents`

    return NextResponse.json({
      users: {
        total: Number(userTotal[0]?.cnt ?? 0),
        paid: Number(userPaid[0]?.cnt ?? 0),
        free: Number(userFree[0]?.cnt ?? 0),
      },
      books: {
        total: Number(bookTotal[0]?.cnt ?? 0),
        status: (bookStatus as { status: string; cnt: number }[]).map(r => ({ status: r.status, count: Number(r.cnt) })),
      },
      subscriptionTiers: (tierDist as { subscription_tier: string; cnt: number }[]).map(r => ({
        tier: r.subscription_tier,
        count: Number(r.cnt),
      })),
      revenue: {
        total: Number(totalRevenue[0]?.total ?? 0) / 100, // cents -> dollars
        monthly: Number(monthlyRevenue[0]?.total ?? 0) / 100,
      },
      trends: {
        revenue: (revenueTrend as { day: string; amt: number }[]).map(r => ({
          day: r.day,
          amount: Number(r.amt) / 100,
        })),
        books: (booksTrend as { day: string; cnt: number }[]).map(r => ({ day: r.day, count: Number(r.cnt) })),
      },
      mau: {
        last30Days: Number(mau[0]?.cnt ?? 0),
        newToday: Number(newUsersToday[0]?.cnt ?? 0),
      },
      consents: Number(consents[0]?.cnt ?? 0),
    })
  } catch (err) {
    console.error('admin stats error:', err)
    return NextResponse.json({ error: 'Stats fetch failed' }, { status: 500 })
  }
}
