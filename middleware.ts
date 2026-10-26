import { NextRequest, NextResponse } from 'next/server'
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, isValidCode, normalizeCode } from '@/lib/affiliate'

/**
 * Paths that belong to a signed-in account, not to the site itself.
 * These are excluded from robots.txt and additionally carry a
 * `X-Robots-Tag` header, because a robots.txt Disallow only stops crawling —
 * it does not stop a page that was already linked from being indexed.
 */
const PRIVATE_PREFIXES = ['/create', '/progress', '/book/', '/admin']

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

/**
 * Capture `?ref=CODE` on any marketing page and remember it in a first-party cookie.
 * The cookie is read at signup (auth callback) to attribute the referral.
 */
export function middleware(req: NextRequest) {
  const response = NextResponse.next()

  if (isPrivatePath(req.nextUrl.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-touch-icon.png|robots.txt|sitemap.xml|llms.txt|llms-full.txt).*)'],
}
