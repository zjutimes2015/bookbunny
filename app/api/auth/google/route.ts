import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const CALLBACK_URL = `${process.env.SITE_URL || 'http://localhost:3000'}/api/auth/callback`

/** 仅允许站内相对路径，避免开放重定向 */
function safeNext(raw: string | null): string {
  if (!raw) return ''
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : ''
}

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get('next'))

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  if (next) params.set('state', next)

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
