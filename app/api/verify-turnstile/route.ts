import { NextRequest, NextResponse } from 'next/server'
import { attachPassCookie, isTurnstileConfigured, verifyTurnstileToken } from '@/lib/turnstile'

/**
 * 校验 Turnstile token 并下发短时通行证（bb_human）。
 * 三个生成接口随后只认这张通行证，避免一次性 token 被复用。
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const valid = await verifyTurnstileToken(token, ip)
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: isTurnstileConfigured() ? 'Verification failed' : 'Verification is not configured',
        },
        { status: 403 },
      )
    }

    return attachPassCookie(NextResponse.json({ success: true }))
  } catch (err) {
    console.error('Turnstile verify error:', err)
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
  }
}
