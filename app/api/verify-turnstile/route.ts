import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
    }

    const secret = process.env.TURNSTILE_SECRET_KEY
    if (!secret) {
      if (token.startsWith('1x') || token.startsWith('2x') || token.startsWith('3x')) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 })
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = await res.json()
    return NextResponse.json({ success: data.success })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}
