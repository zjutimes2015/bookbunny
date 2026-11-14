import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { normalizeThemeKey } from '@/lib/demand/normalize'
import { seedKeywordsForTheme } from '@/lib/demand/themes'
import { categoriesForTheme } from '@/lib/demand/categories'
import { cleanKeywords } from '@/lib/demand/keywords'
import { DEMAND_SCORE_VERSION } from '@/lib/demand/score'
import {
  DEMAND_SUGGESTIONS_DAILY_LIMIT,
  DEMAND_MARKETPLACE,
  DEMAND_LANGUAGE,
  demandMonthlyBudgetUsd,
  isDemandEnabled,
  isKdpTier,
} from '@/lib/demand/gates'
import {
  dataForSeoCredentials,
  fetchRelatedKeywords,
  DATAFORSEO_PRICE_VERSION,
} from '@/lib/demand/client'
import {
  demandCacheKey,
  readDemandCache,
  writeDemandCache,
  logDemandCall,
  getMonthlyDemandSpendUsd,
  type DemandListingPayload,
} from '@/lib/demand/store'

/** Related-keyword fan-out per lookup; cleaned down to 7 below. */
const RELATED_KEYWORD_LIMIT = 20

/**
 * POST /api/demand/listing-suggestions — R2 KDP listing suggestions.
 *
 * Login + Creator+ tier required; the tier check runs server-side (the
 * client only hides the block). Same degrade contract as /api/demand/score:
 * 200 + { available: false, reason } on any failure, never a 500.
 *
 * Success: { available: true, categories (3 paths or null), keywords (up to
 * 7), fetchedAt, stale }. Categories come from the hand-checked map; a null
 * means "no category suggestions for this theme yet" (never invented).
 * Keywords come only from the API response, cleaned and truncated — if fewer
 * than 7 survive cleaning, fewer are returned (never padded).
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Sign in required', code: 'unauthorized' }, { status: 401 })
  }
  if (!isKdpTier(user.tier)) {
    return NextResponse.json({ error: 'Creator plan or above required', code: 'forbidden' }, { status: 403 })
  }

  if (!isDemandEnabled(process.env.NEXT_PUBLIC_DEMAND_ENABLED)) {
    return NextResponse.json({ available: false, reason: 'disabled' })
  }

  let theme = ''
  let title = ''
  try {
    const body = await req.json()
    theme = String(body?.theme ?? '').trim().slice(0, 200)
    title = String(body?.title ?? '').trim().slice(0, 200)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  if (!theme) {
    return NextResponse.json({ error: 'Missing theme' }, { status: 400 })
  }

  const themeKey = normalizeThemeKey(theme)
  const titleKey = normalizeThemeKey(title)
  const cacheKey = demandCacheKey('listing', themeKey, titleKey)
  const cached = await readDemandCache<DemandListingPayload>(cacheKey)

  if (cached && !cached.stale) {
    await logDemandCall({
      route: 'listing-suggestions',
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

  const rate = await checkRateLimit(
    `demand:suggestions:user:${user.id}`,
    DEMAND_SUGGESTIONS_DAILY_LIMIT,
    86400,
  )
  if (!rate.allowed) {
    return serveStaleOr('rate_limited')
  }

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
    const { keywords, costUsd } = await fetchRelatedKeywords(seeds[0], RELATED_KEYWORD_LIMIT, creds)
    await logDemandCall({
      route: 'listing-suggestions',
      userId: user.id,
      themeKey,
      cacheHit: false,
      estimatedCostUsd: costUsd,
      priceVersion: DATAFORSEO_PRICE_VERSION,
    })

    const cleaned = cleanKeywords(keywords.map((k) => k.keyword))
    if (cleaned.length === 0) {
      return serveStaleOr('no_data')
    }

    const payload: DemandListingPayload = {
      version: DEMAND_SCORE_VERSION,
      categories: categoriesForTheme(theme),
      keywords: cleaned,
      fetchedAt: new Date().toISOString(),
      marketplace: DEMAND_MARKETPLACE,
      language: DEMAND_LANGUAGE,
    }
    await writeDemandCache(cacheKey, 'listing', themeKey, payload)
    return NextResponse.json({ available: true, ...payload, stale: false })
  } catch (err) {
    console.error('demand listing-suggestions lookup failed:', err)
    return serveStaleOr('unavailable')
  }
}
