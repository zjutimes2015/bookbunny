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

  // Google OAuth 没配好时，直接跳 Google 会撞上 Google 的
  // 「Missing required parameter: client_id」错误页 —— 用户看到的是一堵墙，
  // 完全不知道是站点的问题。这里拦下来，跳回站内并带上原因。
  if (!GOOGLE_CLIENT_ID) {
    console.error('GOOGLE_CLIENT_ID is not configured — Google sign-in is unavailable.')
    // 回到用户原本要去的页面（next 已经是过滤过的站内相对路径），没有就回首页
    const back = new URL(next || '/', req.url)
    back.searchParams.set('error', 'oauth_not_configured')
    return NextResponse.redirect(back)
  }

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
