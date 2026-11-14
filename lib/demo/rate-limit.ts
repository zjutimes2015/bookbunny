// In-memory demo quota (item A5): 1 demo generation per IP+device per day.
//
// Pure function over an injected Map so it is unit-testable without a DB.
// The route owns one module-level Map. It resets on restart and is per
// serverless instance — the same caveat as the AdaptLane demo quota approach.
// Deliberately no DB table (per task spec); the illustration step reuses
// /api/generate-pages, which has its own DB-backed anonymous limit.

/** Rolling window: 24 hours from the first counted generation. */
export const DEMO_WINDOW_MS = 24 * 60 * 60 * 1000

export const DEMO_DAILY_LIMIT = 1

export interface DemoQuotaResult {
  allowed: boolean
  /** Epoch ms when the current window ends (first use + 24h), if counted. */
  resetAt: number | null
}

/**
 * Check-and-count in one call: a caller that passes the human check consumes
 * the day's sample whether generation later succeeds or not, matching the
 * existing DB rate limiter (which increments before generation).
 *
 * Entries older than the window are dropped opportunistically on each call.
 */
export function checkDemoQuota(
  store: Map<string, number>,
  key: string,
  nowMs: number = Date.now(),
): DemoQuotaResult {
  for (const [k, usedAt] of store) {
    if (nowMs - usedAt >= DEMO_WINDOW_MS) store.delete(k)
  }

  const usedAt = store.get(key)
  if (usedAt !== undefined && nowMs - usedAt < DEMO_WINDOW_MS) {
    return { allowed: false, resetAt: usedAt + DEMO_WINDOW_MS }
  }

  store.set(key, nowMs)
  return { allowed: true, resetAt: nowMs + DEMO_WINDOW_MS }
}

// The route's single module-level store. It lives here (not in route.ts)
// because Next.js route files may only export HTTP handlers and route
// config — a test-only export from a route file breaks `next build`.
const demoQuotaStore = new Map<string, number>()

export function getDemoQuotaStore(): Map<string, number> {
  return demoQuotaStore
}

/** Test-only reset so route tests can isolate quota state. */
export function __resetDemoQuotaStoreForTests(): void {
  demoQuotaStore.clear()
}
