/**
 * Feature gates and cost-guard constants for the demand feature (R5).
 *
 * Client-safe: pure functions over raw env values, following the
 * `app/pricing/gates.ts` convention (only the explicit string 'true' enables
 * a NEXT_PUBLIC_ gate; anything else is off).
 */


/** R1 active lookups per user per day (D8). Cache hits do not consume quota. */
export const DEMAND_SCORE_DAILY_LIMIT = 10

/** R2 listing-suggestion lookups per user per day (D8). */
export const DEMAND_SUGGESTIONS_DAILY_LIMIT = 5

/** Monthly budget fuse default in USD (D8). Overridden by DEMAND_MONTHLY_BUDGET_USD. */
export const DEFAULT_DEMAND_MONTHLY_BUDGET_USD = 50

/** Cache TTL in days for both scores and listing suggestions (D3). */
export const DEMAND_CACHE_TTL_DAYS = 30

/** Only marketplace/language in v1.0 (D9): amazon.com, English. */
export const DEMAND_MARKETPLACE = 'amazon.com'
export const DEMAND_LANGUAGE = 'en'

/**
 * Creator+ tiers, reusing the exact `canKdp` caliber from
 * `app/create/page.tsx`: creator / studio / teacher / commercial.
 * The server route re-checks this; the client only hides the block.
 */
export const KDP_TIERS = ['creator', 'studio', 'teacher', 'commercial'] as const

export function isKdpTier(tier: string | null | undefined): boolean {
  return !!tier && (KDP_TIERS as readonly string[]).includes(tier)
}

/** Feature master switch: only explicit 'true' enables (default off). Same rule as `isGateOn` in `app/pricing/gates.ts`, restated here so lib/demand stays self-contained. */
export function isDemandEnabled(value: string | undefined): boolean {
  return value === 'true'
}

/** Parse DEMAND_MONTHLY_BUDGET_USD; unparseable / negative values fall back to the $50 default. */
export function demandMonthlyBudgetUsd(value: string | undefined): number {
  const parsed = Number(value)
  if (value === undefined || value === '' || !Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DEMAND_MONTHLY_BUDGET_USD
  }
  return parsed
}
