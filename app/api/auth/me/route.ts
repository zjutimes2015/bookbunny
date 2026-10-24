import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { isAdminEmail } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return NextResponse.json({ user: null })

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      SELECT u.id, u.name, u.email, u.image, u.is_paid, u.subscription_tier,
             u.credits, u.monthly_allowance_remaining, u.allowance_reset_at,
             u.created_at
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `

    if (result.length === 0) return NextResponse.json({ user: null })

    const u = result[0]
    return NextResponse.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        isPaid: u.is_paid,
        subscriptionTier: u.subscription_tier,
        isAdmin: isAdminEmail(u.email),
        credits: u.credits ?? 0,
        allowanceRemaining: u.monthly_allowance_remaining ?? null,
        allowanceResetAt: u.allowance_reset_at ?? null,
        createdAt: u.created_at,
      },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
