'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  /** Parent bumps this to force a fresh challenge after a failure (retry button). */
  resetKey?: number
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  resetKey = 0,
  className = '',
}: TurnstileWidgetProps) {
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  // Callbacks are inline arrows in the parent, so their identity changes on
  // every parent render. Keep the latest ones in refs and give the widget
  // lifecycle stable (empty-deps) effects: previously the mount effect
  // re-ran on every parent render, its cleanup removed the widget, and the
  // re-init bailed out on loadedRef — the widget vanished mid-challenge and
  // never produced a token.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onVerifyRef.current = onVerify
    onExpireRef.current = onExpire
    onErrorRef.current = onError
  })

  const initTurnstile = useCallback(() => {
    if (!window.turnstile || !containerRef.current || loadedRef.current) return

    loadedRef.current = true
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA', // invisible key for dev
      theme: 'light',
      callback: (token: string) => onVerifyRef.current(token),
      'expired-callback': () => {
        onExpireRef.current?.()
        loadedRef.current = false
      },
      'error-callback': () => {
        onErrorRef.current?.()
        loadedRef.current = false
      },
    })
  }, [])

  const loadScript = useCallback(() => {
    const existing = document.querySelector('script[src*="turnstile"]')
    if (existing) {
      // Script tag is present but the library is not ready yet (e.g. a remount
      // raced the download): wait for it instead of silently never rendering.
      if (window.turnstile) {
        initTurnstile()
      } else {
        existing.addEventListener('load', initTurnstile, { once: true })
        existing.addEventListener('error', () => onErrorRef.current?.(), { once: true })
      }
      return
    }
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = initTurnstile
    // A failed download used to leave an empty box with no recourse; surface
    // it as an error so the page can offer a retry.
    script.onerror = () => onErrorRef.current?.()
    document.body.appendChild(script)
  }, [initTurnstile])

  // Mount once: the widget must survive parent re-renders (typing, consent
  // checks, token state) — removing it mid-challenge loses the token.
  useEffect(() => {
    loadScript()

    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current)
        widgetRef.current = null
      }
      loadedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Retry path: the parent increments resetKey from its "重新验证" button.
  // If a widget exists, reset it (fresh challenge, same widget). Otherwise
  // (script failed / never rendered) try loading/rendering again.
  useEffect(() => {
    if (resetKey === 0) return
    if (widgetRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetRef.current)
        return
      } catch {
        // Fall through to a full re-init below.
      }
    }
    loadedRef.current = false
    loadScript()
  }, [resetKey, loadScript])

  return (
    <div
      ref={containerRef}
      className={`turnstile-widget min-h-[65px] flex items-center justify-center ${className}`}
    />
  )
}
