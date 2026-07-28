import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendEmail } from '@/lib/email/send'

// ⚠️ Protected: should only be called by cron-job.org
// Add CRON_SECRET to .env.local for security
export async function GET(req: Request) {
  try {
    // Verify cron secret
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch users from database
    // Note: When Better Auth is set up, query the user table
    // For now, use the characters table as a proxy for active users
    const sql = neon(process.env.NEON_DATABASE_URL!)

    // Try to get users - fallback to characters if user table doesn't exist yet
    let users: { email: string; name: string; book_count: number }[] = []

    try {
      const result = await sql`
        SELECT 
          u.email,
          COALESCE(u.name, 'there') as name,
          (SELECT COUNT(*) FROM books b WHERE b.character_id IN 
            (SELECT c.id FROM characters c WHERE c.name = u.name)) as book_count
        FROM "user" u
        WHERE u.email IS NOT NULL
        LIMIT 100
      `
      users = result as typeof users
    } catch {
      // Fallback: read from characters as registered users proxy
      const result = await sql`
        SELECT DISTINCT ON (c.name)
          LOWER(REPLACE(c.name, ' ', '.')) || '@bookbunny.app' as email,
          c.name,
          0 as book_count
        FROM characters c
        LIMIT 10
      `
      users = result as typeof users
    }

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No users found to email',
      })
    }

    // Send morning digest to each user
    const results = await Promise.allSettled(
      users.map((user) =>
        sendEmail('morning-digest', user.email, {
          userName: user.name,
          bookCount: user.book_count,
        }),
      ),
    )

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter((r) => r.status === 'rejected' || !r.value.success).length

    return NextResponse.json({
      success: true,
      total: users.length,
      sent,
      failed,
      time: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Daily digest cron error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Cron failed' },
      { status: 500 },
    )
  }
}
