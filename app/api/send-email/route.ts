import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { sendEmail, type EmailTemplate } from '@/lib/email/send'

const TEMPLATES: EmailTemplate[] = ['welcome', 'book-published', 'morning-digest']

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000
const recentSends = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (recentSends.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    recentSends.set(key, recent)
    return true
  }
  recent.push(now)
  recentSends.set(key, recent)
  return false
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const rows = await sql`
      SELECT u.email
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const userEmail = rows.length > 0 ? String(rows[0].email) : null
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const template = body?.template
    if (!TEMPLATES.includes(template)) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }

    if (isRateLimited(userEmail)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const result = await sendEmail(template, userEmail, body.props || {})
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 },
    )
  }
}
