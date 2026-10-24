'use client'

import { useEffect } from 'react'
import { REFERRAL_COOKIE } from '@/lib/affiliate'

/**
 * Records one click per session for the stored referral cookie.
 * The cookie itself is set by middleware; this only feeds the affiliate's click stats.
 */
export default function ReferralCapture() {
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE}=([^;]+)`))
    if (!match) return

    const code = decodeURIComponent(match[1])
    const key = `ref_tracked_${code}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // Private mode: still send, just without session dedupe.
    }

    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}
