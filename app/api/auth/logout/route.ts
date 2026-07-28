import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (token) {
    try {
      const sql = neon(process.env.NEON_DATABASE_URL!)
      await sql`DELETE FROM auth_sessions WHERE token = ${token}`
    } catch {}
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
  return res
}
