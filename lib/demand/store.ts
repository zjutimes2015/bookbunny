/**
 * Demand persistence: `demand_cache` + `demand_calls` (R4#3, R5#2).
 *
 * Tables are created by `scripts/migrate-demand.cjs` (same convention as the
 * other `scripts/migrate-*.cjs` scripts). Every function here is fail-open:
 * a missing table or a DB error degrades to "no cache / zero spend" and logs,
 * never throws into the request path — the routes then fall back to a live
 * call or to silent hiding, and creation is never blocked.
 *
 * SERVER ONLY — imports the Neon client. Never import from client components.
 */

import { sql } from '@/lib/neon'
import { DEMAND_SCORE_VERSION, type DemandTier } from './score'
import { DEMAND_CACHE_TTL_DAYS } from './gates'
import type { KdpCategory } from './categories'

/** Minimal structural type for the Neon tagged-template client (injectable for tests). */
export type SqlTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Array<Record<string, unknown>>>

function defaultSql(): SqlTag {
  return sql as unknown as SqlTag
}

// ---------------------------------------------------------------------------
// Cached payloads (versioned; the score version travels with the payload)
// ---------------------------------------------------------------------------

export interface DemandScorePayload {
  version: typeof DEMAND_SCORE_VERSION
  volume: number
  volumeMax: number
  score: number
  tier: DemandTier
  /** Always null in v1.0: no official competition field exists (see score.ts). */
  competition: null
  seeds: string[]
  fetchedAt: string
  marketplace: string
  language: string
}

export interface DemandListingPayload {
  version: typeof DEMAND_SCORE_VERSION
  categories: KdpCategory[] | null
  keywords: string[]
  fetchedAt: string
  marketplace: string
  language: string
}

export interface CachedDemand<T> {
  payload: T
  fetchedAt: string
  stale: boolean
}

export type DemandCacheKind = 'score' | 'listing'

/** Cache key = kind + normalized theme (+ normalized title for listings) + market + language. */
export function demandCacheKey(
  kind: DemandCacheKind,
  themeKey: string,
  extraKey = '',
  marketplace = 'amazon.com',
  language = 'en',
): string {
  const parts = [kind, themeKey, extraKey, marketplace, language].filter(Boolean)
  return parts.join(':')
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function parsePayload<T>(raw: unknown): T | null {
  try {
    if (typeof raw === 'string') return JSON.parse(raw) as T
    if (raw && typeof raw === 'object') return raw as T
    return null
  } catch {
    return null
  }
}

/**
 * Read a cache row. Returns the row even when expired (stale: true) so routes
 * can serve stale data on API failure, labeled with its old date. Returns
 * null on a miss, a corrupt payload, or any DB error.
 */
export async function readDemandCache<T>(
  cacheKey: string,
  executor: SqlTag = defaultSql(),
): Promise<CachedDemand<T> | null> {
  try {
    const rows = await executor`
      SELECT payload, fetched_at, expires_at
      FROM demand_cache
      WHERE cache_key = ${cacheKey}
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    const payload = parsePayload<T>(row.payload)
    if (!payload) return null
    const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(String(row.expires_at))
    return { payload, fetchedAt: toIso(row.fetched_at), stale: expiresAt.getTime() <= Date.now() }
  } catch (err) {
    console.error('demand_cache read failed:', err)
    return null
  }
}

export async function writeDemandCache<T>(
  cacheKey: string,
  kind: DemandCacheKind,
  themeKey: string,
  payload: T,
  ttlDays: number = DEMAND_CACHE_TTL_DAYS,
  executor: SqlTag = defaultSql(),
): Promise<void> {
  try {
    await executor`
      INSERT INTO demand_cache (cache_key, kind, theme_key, marketplace, language, payload, fetched_at, expires_at)
      VALUES (${cacheKey}, ${kind}, ${themeKey}, 'amazon.com', 'en', ${JSON.stringify(payload)}::jsonb, NOW(), NOW() + make_interval(days => ${ttlDays}::int))
      ON CONFLICT (cache_key) DO UPDATE SET
        payload = EXCLUDED.payload,
        fetched_at = EXCLUDED.fetched_at,
        expires_at = EXCLUDED.expires_at
    `
  } catch (err) {
    // Cache write failure must not fail the request; the response is still served.
    console.error('demand_cache write failed:', err)
  }
}

/**
 * Reference maximum for the score formula: the largest volume among cached
 * score payloads of the current formula version. Null when nothing is cached
 * (the caller then scores against the theme's own volume).
 */
export async function getMaxCachedVolume(
  executor: SqlTag = defaultSql(),
): Promise<number | null> {
  try {
    const rows = await executor`
      SELECT MAX((payload ->> 'volume')::numeric) AS max_volume
      FROM demand_cache
      WHERE kind = 'score' AND payload ->> 'version' = ${DEMAND_SCORE_VERSION}
    `
    const raw = rows[0]?.max_volume
    const value = typeof raw === 'string' ? Number(raw) : (raw as number | null)
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
  } catch (err) {
    console.error('demand_cache max-volume read failed:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Call log + budget fuse (R5)
// ---------------------------------------------------------------------------

export interface DemandCallEntry {
  route: 'score' | 'listing-suggestions'
  userId: string
  themeKey: string
  cacheHit: boolean
  estimatedCostUsd: number
  priceVersion: string
}

export async function logDemandCall(
  entry: DemandCallEntry,
  executor: SqlTag = defaultSql(),
): Promise<void> {
  try {
    await executor`
      INSERT INTO demand_calls (route, user_id, theme_key, cache_hit, estimated_cost_usd, price_version)
      VALUES (${entry.route}, ${entry.userId}, ${entry.themeKey}, ${entry.cacheHit}, ${entry.estimatedCostUsd}, ${entry.priceVersion})
    `
  } catch (err) {
    console.error('demand_calls log failed:', err)
  }
}

/**
 * Estimated spend in the current calendar month. On any DB error returns 0
 * (fail-open, logged) — the budget fuse cannot count what it cannot read.
 */
export async function getMonthlyDemandSpendUsd(
  executor: SqlTag = defaultSql(),
): Promise<number> {
  try {
    const rows = await executor`
      SELECT COALESCE(SUM(estimated_cost_usd), 0) AS total
      FROM demand_calls
      WHERE created_at >= date_trunc('month', NOW())
    `
    const raw = rows[0]?.total
    const value = typeof raw === 'string' ? Number(raw) : (raw as number)
    return Number.isFinite(value) ? value : 0
  } catch (err) {
    console.error('demand_calls monthly spend read failed:', err)
    return 0
  }
}

export interface DemandStats {
  calls: number
  cacheHits: number
  estimatedSpendUsd: number
}

/** Current-month stats for /admin/analytics. Null when the table is unreadable. */
export async function getDemandStats(
  executor: SqlTag = defaultSql(),
): Promise<DemandStats | null> {
  try {
    const rows = await executor`
      SELECT COUNT(*) AS calls,
             COALESCE(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END), 0) AS cache_hits,
             COALESCE(SUM(estimated_cost_usd), 0) AS spend
      FROM demand_calls
      WHERE created_at >= date_trunc('month', NOW())
    `
    const row = rows[0]
    if (!row) return null
    const num = (v: unknown) => {
      const n = typeof v === 'string' ? Number(v) : (v as number)
      return Number.isFinite(n) ? n : 0
    }
    return { calls: num(row.calls), cacheHits: num(row.cache_hits), estimatedSpendUsd: num(row.spend) }
  } catch (err) {
    console.error('demand_calls stats read failed:', err)
    return null
  }
}
