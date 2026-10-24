import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'node:crypto'
import { getAffiliateByCode, isValidCode, normalizeCode } from '@/lib/affiliate'
import { getClientIp } from '@/lib/auth'

/** POST /api/affiliate/track — record a referral link click (once per IP per day). */
export async function POST(req: NextRequest) {
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = normalizeCode(body.code)
  if (!isValidCode(code)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const affiliate = await getAffiliateByCode(sql, code)
    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.json({ error: 'Unknown code' }, { status: 404 })
    }

    const ipHash = crypto
      .createHash('sha256')
      .update(`${getClientIp(req)}|${process.env.AFFILIATE_IP_SALT || 'sprouttales'}`)
      .digest('hex')
      .slice(0, 32)

    const recent = await sql`
      SELECT 1 FROM affiliate_clicks
      WHERE code = ${code} AND ip_hash = ${ipHash}
        AND created_at >= NOW() - INTERVAL '1 day'
      LIMIT 1
    `
    if (recent.length === 0) {
      await sql`
        INSERT INTO affiliate_clicks (code, ip_hash, user_agent)
        VALUES (${code}, ${ipHash}, ${(req.headers.get('user-agent') || '').slice(0, 300)})
      `
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('affiliate track error:', err)
    // Analytics must never break the page.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
