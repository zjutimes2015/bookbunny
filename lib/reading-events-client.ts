'use client'

import type { ReadingEventInput } from '@/lib/analytics'

/**
 * 阅读事件上报：fire-and-forget，失败绝不打断阅读。
 * 只发行为与数值，不发任何孩子身份信息。
 */
export function sendReadingEvents(bookId: string, events: ReadingEventInput[]) {
  if (!bookId || events.length === 0) return
  try {
    void fetch('/api/reading-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, events }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 埋点失败不影响阅读
  }
}
