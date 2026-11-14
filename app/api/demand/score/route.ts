import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeThemeKey } from '@/lib/demand/normalize'
import { seedKeywordsForTheme } from '@/lib/demand/themes'
import {
  computeDemandScore,
  demandTier,
  volumeFromVolumes,
  DEMAND_SCORE_VERSION,
} from '@/lib/demand/score'
import {
  DEMAND_SCORE_DAILY_LIMIT,
  DEMAND_MARKETPLACE,
  DEMAND_LANGUAGE,
  demandMonthlyBudgetUsd,
  isDemandEnabled,
} from '@/lib/demand/gates'
import {
  dataForSeoCredentials,
  fetchBulkSearchVolumes,
  DATAFORSEO_PRICE_VERSION,
} from '@/lib/demand/client'
import {
  demandCacheKey,
  readDemandCache,
  writeDemandCache,
  getMaxCachedVolume,
  logDemandCall,
  getMonthlyDemandSpendUsd,
  type DemandScorePayload,
} from '@/lib/demand/store'

/**
 * POST /api/demand/score — R1 theme demand score (login required).
 *
 * Response shapes (always 200 once authenticated; failures degrade, never 500):
 * - { available: true, score, tier, competition, volume, volumeMax, seeds,
 *     fetchedAt, stale } — fresh or stale cache, or a fresh API result.
 * - { available: false, reason } — reason: 'disabled' | 'rate_limited' |
 *   'budget_exceeded' | 'no_data' | 'unavailable'. The UI hides the score
 *   area for all of these except 'rate_limited' ("try again tomorrow").
 *
 * Cost order: fresh cache (free, no quota) -> per-user daily limit -> monthly
 * budget fuse -> one API call. A stale cache row is served on any failure,
 * labeled with its old date.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Sign in required', code: 'unauthorized' }, { status: 401 })
  }

  if (!isDemandEnabled(process.env.NEXT_PUBLIC_DEMAND_ENABLED)) {
    return NextResponse.json({ available: false, reason: 'disabled' })
  }

  let theme = ''
  try {
    const body = await req.json()
    theme = String(body?.theme ?? '').trim().slice(0, 200)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!theme) {
    return NextResponse.json({ error: 'Missing theme' }, { status: 400 })
  }

  const themeKey = normalizeThemeKey(theme)
  const cacheKey = demandCacheKey('score', themeKey)
  const cached = await readDemandCache<DemandScorePayload>(cacheKey)

  // Fresh cache: zero API calls, zero quota. Log the hit for observability.
  if (cached && !cached.stale) {
    await logDemandCall({
      route: 'score',
      userId: user.id,
      themeKey,
      cacheHit: true,
      estimatedCostUsd: 0,
      priceVersion: DATAFORSEO_PRICE_VERSION,
    })
    return NextResponse.json({ available: true, ...cached.payload, fetchedAt: cached.fetchedAt, stale: false })
  }
  const stale = cached && cached.stale ? cached : null
  const serveStaleOr = (reason: string) =>
    stale
      ? NextResponse.json({ available: true, ...stale.payload, fetchedAt: stale.fetchedAt, stale: true })
      : NextResponse.json({ available: false, reason })

  // Per-user daily limit on fresh lookups (R5#4; rate-limit infra fails open).
  const rate = await checkRateLimit(`demand:score:user:${user.id}`, DEMAND_SCORE_DAILY_LIMIT, 86400)
  if (!rate.allowed) {
    return serveStaleOr('rate_limited')
  }

  // Monthly budget fuse (R5#1): at/over budget, serve cache/empty, log, recover next month.
  const budget = demandMonthlyBudgetUsd(process.env.DEMAND_MONTHLY_BUDGET_USD)
  const spent = await getMonthlyDemandSpendUsd()
  if (spent >= budget) {
    console.error(`demand budget fuse tripped: spent $${spent.toFixed(2)} of $${budget}`)
    return serveStaleOr('budget_exceeded')
  }

  const creds = dataForSeoCredentials()
  if (!creds) {
    return serveStaleOr('unavailable')
  }

  try {
    const seeds = seedKeywordsForTheme(theme)
    const { volumes, costUsd } = await fetchBulkSearchVolumes(seeds, creds)
    await logDemandCall({
      route: 'score',
      userId: user.id,
      themeKey,
      cacheHit: false,
      estimatedCostUsd: costUsd,
      priceVersion: DATAFORSEO_PRICE_VERSION,
    })

    const volume = volumeFromVolumes(volumes.map((v) => v.searchVolume))
    if (volume === null || volume <= 0) {
      // No data: hide, never show 0 or a placeholder.
      return serveStaleOr('no_data')
    }

    const cachedMax = await getMaxCachedVolume()
    const volumeMax = Math.max(volume, cachedMax ?? 0)
    const score = computeDemandScore(volume, volumeMax)
    if (score === null) {
      return serveStaleOr('no_data')
    }

    const payload: DemandScorePayload = {
      version: DEMAND_SCORE_VERSION,
      volume,
      volumeMax,
      score,
      tier: demandTier(score),
      competition: null,
      seeds,
      fetchedAt: new Date().toISOString(),
      marketplace: DEMAND_MARKETPLACE,
      language: DEMAND_LANGUAGE,
    }
    await writeDemandCache(cacheKey, 'score', themeKey, payload)
    return NextResponse.json({ available: true, ...payload, stale: false })
  } catch (err) {
    // Failure isolation: API timeout/error never blocks creation.
    console.error('demand score lookup failed:', err)
    return serveStaleOr('unavailable')
  }
}
