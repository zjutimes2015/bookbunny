'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
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

export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  className = '',
}: TurnstileWidgetProps) {
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  const initTurnstile = useCallback(() => {
    if (!window.turnstile || !containerRef.current || loadedRef.current) return

    loadedRef.current = true
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA', // invisible key for dev
      theme: 'light',
      callback: (token: string) => onVerify(token),
      'expired-callback': () => {
        if (onExpire) onExpire()
        loadedRef.current = false
      },
      'error-callback': () => {
        if (onError) onError()
        loadedRef.current = false
      },
    })
  }, [onVerify, onExpire, onError])

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = initTurnstile
      document.body.appendChild(script)
    } else if (window.turnstile) {
      initTurnstile()
    }

    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current)
        widgetRef.current = null
      }
    }
  }, [initTurnstile])

  return (
    <div
      ref={containerRef}
      className={`turnstile-widget min-h-[65px] flex items-center justify-center ${className}`}
    />
  )
}
