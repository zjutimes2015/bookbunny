import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { PRO_CREDITS_PER_BOOK, STUDIO_PRO_BOOKS_PER_PERIOD } from '@/lib/payments/waffo'

// ⚠️ Protected: called by Vercel Cron (Authorization: Bearer $CRON_SECRET)
// Studio 年付用户按月补发 Pro 动画额度（月付由续费 webhook 直接发放）
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token =
      url.searchParams.get('token') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      ''
    const expectedToken = process.env.CRON_SECRET

    // 该任务会发放付费权益，未配置密钥时拒绝执行
    if (!expectedToken) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
    }
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const credits = STUDIO_PRO_BOOKS_PER_PERIOD * PRO_CREDITS_PER_BOOK

    const due = (await sql`
      SELECT id FROM bookbunny_users
      WHERE subscription_tier = 'studio'
        AND pro_grant_next_at IS NOT NULL
        AND pro_grant_next_at <= NOW()
      LIMIT 100
    `) as { id: string }[]

    let granted = 0
    for (const row of due) {
      // 先原子推进发放时点，同一用户只被一个实例命中
      const updated = await sql`
        UPDATE bookbunny_users
        SET pro_animation_credits = COALESCE(pro_animation_credits, 0) + ${credits},
            pro_grant_next_at = pro_grant_next_at + INTERVAL '1 month',
            updated_at = NOW()
        WHERE id = ${row.id}
          AND subscription_tier = 'studio'
          AND pro_grant_next_at IS NOT NULL
          AND pro_grant_next_at <= NOW()
        RETURNING id
      `
      if (Array.isArray(updated) && updated.length > 0) granted++
    }

    return NextResponse.json({
      success: true,
      due: due.length,
      granted,
      creditsEach: credits,
      time: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Pro grants cron error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Cron failed' },
      { status: 500 },
    )
  }
}
