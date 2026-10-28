'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * 登录失败时的站内提示。
 *
 * 之前所有登录错误都直接把用户扔到 Google 的错误页（"Missing required parameter:
 * client_id"），用户看到的是一堵墙，不知道发生了什么、也不知道下一步做什么。
 * 这里把 /api/auth/google 回跳时带的 error 参数翻译成一句能行动的话。
 */

const MESSAGES: Record<string, { title: string; body: string }> = {
  oauth_not_configured: {
    title: 'Sign-in is temporarily unavailable',
    body: 'We could not start the Google sign-in just now. Please try again in a minute — if it keeps happening, email us and we will fix it.',
  },
  auth_failed: {
    title: 'Sign-in did not complete',
    body: 'Google sign-in failed before we could sign you in. Please try again.',
  },
  no_code: {
    title: 'Sign-in did not complete',
    body: 'The sign-in link was incomplete. Please start again from the sign-in button.',
  },
}

export default function AuthNotice() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('error')
    if (!code) return
    setError(code)

    // 清理地址栏，避免刷新时重复弹提示
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }, [])

  if (!error) return null
  const msg = MESSAGES[error] || {
    title: 'Sign-in did not complete',
    body: 'Something went wrong while signing in. Please try again.',
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-4" role="alert">
        <p className="text-sm font-semibold text-amber-900">{msg.title}</p>
        <p className="mt-1 text-sm text-amber-800">{msg.body}</p>
        <Link
          href="/create"
          className="mt-3 inline-block text-sm font-medium text-amber-900 underline decoration-amber-400 underline-offset-4"
        >
          Continue without signing in
        </Link>
      </div>
    </div>
  )
}
