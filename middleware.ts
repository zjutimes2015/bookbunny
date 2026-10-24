import { NextRequest, NextResponse } from 'next/server'
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, isValidCode, normalizeCode } from '@/lib/affiliate'

/**
 * Capture `?ref=CODE` on any marketing page and remember it in a first-party cookie.
 * The cookie is read at signup (auth callback) to attribute the referral.
 */
export function middleware(req: NextRequest) {
  const response = NextResponse.next()
  const raw = req.nextUrl.searchParams.get('ref')
  if (!raw) return response

  const code = normalizeCode(raw)
  if (!isValidCode(code)) return response

  response.cookies.set(REFERRAL_COOKIE, code, {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png).*)'],
}
