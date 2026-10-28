import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { REFERRAL_COOKIE, attributeReferral } from '@/lib/affiliate'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const CALLBACK_URL = `${process.env.SITE_URL || 'http://localhost:3000'}/api/auth/callback`

export async function GET(req: NextRequest) {
  // 凭据缺失时直接换 token 一定失败，且错误信息毫无指向性。
  // 这里先拦下来，跳回站内并带上可读的原因。
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is not configured — Google sign-in is unavailable.')
    return NextResponse.redirect(new URL('/?error=oauth_not_configured', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/?error=no_code', req.url))

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) throw new Error('Failed to get access token')

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()

    // Upsert user in database
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const existing = await sql`SELECT * FROM bookbunny_users WHERE email = ${googleUser.email}`

    let userId: string
    let isNewUser = false
    if (existing.length > 0) {
      userId = existing[0].id
      await sql`
        UPDATE bookbunny_users 
        SET name = ${googleUser.name}, image = ${googleUser.picture}, google_id = ${googleUser.id}, updated_at = NOW()
        WHERE id = ${userId}
      `
    } else {
      const result = await sql`
        INSERT INTO bookbunny_users (name, email, image, google_id, is_paid, subscription_tier)
        VALUES (${googleUser.name}, ${googleUser.email}, ${googleUser.picture}, ${googleUser.id}, FALSE, 'free')
        RETURNING id
      `
      userId = result[0].id
      isNewUser = true
    }

    // Affiliate attribution only applies to brand-new signups, never to existing accounts.
    const refCode = req.cookies.get(REFERRAL_COOKIE)?.value
    if (isNewUser && refCode) {
      await attributeReferral(sql, { userId, code: refCode })
    }

    // Create session (simple token-based)
    const sessionToken = crypto.randomUUID()
    await sql`
      INSERT INTO auth_sessions (token, user_id, expires_at)
      VALUES (${sessionToken}, ${userId}, NOW() + INTERVAL '7 days')
    `

    // Redirect with session cookie（state 带回登录前的站内目标，如 /pricing）
    const rawNext = req.nextUrl.searchParams.get('state') || ''
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/?welcome=true'
    const response = NextResponse.redirect(new URL(next, req.url))
    response.cookies.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Auth callback error:', err)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}
