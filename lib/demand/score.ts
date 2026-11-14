/**
 * Demand score formula, versioned (SPEC §4.1, `demand-score-v1`).
 *
 *   volume(theme)      = max(search volume of the theme's seed keywords)
 *   volume_max         = max volume across all tracked themes on record
 *   demand_score       = round(100 * log(1 + volume) / log(1 + volume_max))
 *   tier: score >= 67 -> High; 34–66 -> Medium; <= 33 -> Low
 *
 * The version string travels with every cached payload; changing the formula
 * requires bumping the version and recomputing the cache.
 *
 * No-data rule: a zero / empty volume set yields NO score (null), never 0 —
 * the UI hides the score area instead of showing a placeholder number.
 *
 * Client-safe pure functions: no secrets, no Node APIs.
 */

export const DEMAND_SCORE_VERSION = 'demand-score-v1'

export type DemandTier = 'High' | 'Medium' | 'Low'

export const DEMAND_TIER_HIGH_MIN = 67
export const DEMAND_TIER_MEDIUM_MIN = 34

/**
 * Max of the seed volumes. Returns null when there are no usable values at
 * all (empty set / all missing); returns 0 when every reported volume is 0.
 * Callers treat 0 as "no score" via `computeDemandScore`.
 */
export function volumeFromVolumes(
  values: ReadonlyArray<number | null | undefined>,
): number | null {
  let max: number | null = null
  for (const v of values) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) continue
    if (max === null || v > max) max = v
  }
  return max
}

/**
 * Log-normalized relative score, 0–100. Returns null when there is nothing
 * to score (volume 0/unknown, or no reference maximum). A theme at the
 * reference maximum scores exactly 100.
 */
export function computeDemandScore(
  volume: number | null | undefined,
  volumeMax: number | null | undefined,
): number | null {
  if (typeof volume !== 'number' || !Number.isFinite(volume) || volume <= 0) return null
  if (typeof volumeMax !== 'number' || !Number.isFinite(volumeMax) || volumeMax <= 0) return null
  const ref = Math.max(volumeMax, volume)
  const score = Math.round((100 * Math.log1p(volume)) / Math.log1p(ref))
  return Math.min(100, Math.max(0, score))
}

export function demandTier(score: number): DemandTier {
  if (score >= DEMAND_TIER_HIGH_MIN) return 'High'
  if (score >= DEMAND_TIER_MEDIUM_MIN) return 'Medium'
  return 'Low'
}

// ---------------------------------------------------------------------------
// Competition label (UNVERIFIED data source — see note below)
// ---------------------------------------------------------------------------

export type CompetitionTier = 'High' | 'Medium' | 'Low'

/**
 * Competition is a SEPARATE label, never folded into the demand score (D7).
 *
 * UNVERIFIED (checked 2026-11-14): neither Amazon Labs endpoint used here
 * (bulk_search_volume, related_keywords) returns a competition or difficulty
 * field in its documented response, so there is currently no official field
 * to feed this label. Callers pass null and the UI hides the tag. This pure
 * function exists so the label can be wired later without touching the UI:
 * it maps a 0–1 mean competition value to the same 67/34 cut points.
 * Do not feed it invented values.
 */
export function competitionTier(
  avgCompetition: number | null | undefined,
): CompetitionTier | null {
  if (typeof avgCompetition !== 'number' || !Number.isFinite(avgCompetition)) return null
  const clamped = Math.min(1, Math.max(0, avgCompetition))
  if (clamped * 100 >= DEMAND_TIER_HIGH_MIN) return 'High'
  if (clamped * 100 >= DEMAND_TIER_MEDIUM_MIN) return 'Medium'
  return 'Low'
}
