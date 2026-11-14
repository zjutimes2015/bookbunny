import { describe, it, expect, vi } from 'vitest'
import {
  demandCacheKey,
  readDemandCache,
  writeDemandCache,
  getMaxCachedVolume,
  logDemandCall,
  getMonthlyDemandSpendUsd,
  getDemandStats,
  type SqlTag,
} from './store'

function fakeSql(rows: Array<Record<string, unknown>>, onCall?: (strings: TemplateStringsArray, values: unknown[]) => void): SqlTag {
  const fn = vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    onCall?.(strings, values)
    return rows
  })
  return fn as unknown as SqlTag
}

const PAYLOAD = { version: 'demand-score-v1', score: 72, volume: 500 }

describe('demandCacheKey', () => {
  it('combines kind + theme + market + language', () => {
    expect(demandCacheKey('score', 'dinosaur bedtime story')).toBe('score:dinosaur bedtime story:amazon.com:en')
  })
  it('includes the title key for listings', () => {
    expect(demandCacheKey('listing', 'dinosaur bedtime story', 'sleepy rex')).toBe(
      'listing:dinosaur bedtime story:sleepy rex:amazon.com:en',
    )
  })
})

describe('readDemandCache', () => {
  it('returns a fresh row as not stale', async () => {
    const sql = fakeSql([
      { payload: PAYLOAD, fetched_at: new Date('2026-11-14T00:00:00Z'), expires_at: new Date(Date.now() + 86400000) },
    ])
    const hit = await readDemandCache('k', sql)
    expect(hit?.payload).toEqual(PAYLOAD)
    expect(hit?.stale).toBe(false)
  })
  it('returns an expired row as stale (fallback path)', async () => {
    const sql = fakeSql([
      { payload: PAYLOAD, fetched_at: new Date('2026-10-01T00:00:00Z'), expires_at: new Date('2026-10-31T00:00:00Z') },
    ])
    const hit = await readDemandCache('k', sql)
    expect(hit?.stale).toBe(true)
    expect(hit?.fetchedAt).toBe('2026-10-01T00:00:00.000Z')
  })
  it('parses string payloads', async () => {
    const sql = fakeSql([
      { payload: JSON.stringify(PAYLOAD), fetched_at: '2026-11-14T00:00:00Z', expires_at: new Date(Date.now() + 1000) },
    ])
    expect((await readDemandCache('k', sql))?.payload).toEqual(PAYLOAD)
  })
  it('returns null on a miss', async () => {
    expect(await readDemandCache('k', fakeSql([]))).toBeNull()
  })
  it('returns null on corrupt payloads and DB errors (fail-open)', async () => {
    const corrupt = fakeSql([{ payload: '{nope', fetched_at: new Date(), expires_at: new Date() }])
    expect(await readDemandCache('k', corrupt)).toBeNull()
    const failing = (async () => {
      throw new Error('relation "demand_cache" does not exist')
    }) as unknown as SqlTag
    expect(await readDemandCache('k', failing)).toBeNull()
  })
})

describe('writeDemandCache', () => {
  it('upserts the payload as JSON', async () => {
    const seen: unknown[][] = []
    const sql = fakeSql([], (_s, values) => seen.push(values))
    await writeDemandCache('score:x:amazon.com:en', 'score', 'x', PAYLOAD, 30, sql)
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain(JSON.stringify(PAYLOAD))
    expect(seen[0]).toContain(30)
  })
  it('never throws on DB errors', async () => {
    const failing = (async () => {
      throw new Error('db down')
    }) as unknown as SqlTag
    await expect(writeDemandCache('k', 'score', 'x', PAYLOAD, 30, failing)).resolves.toBeUndefined()
  })
})

describe('getMaxCachedVolume', () => {
  it('reads the numeric max', async () => {
    expect(await getMaxCachedVolume(fakeSql([{ max_volume: '5000' }]))).toBe(5000)
    expect(await getMaxCachedVolume(fakeSql([{ max_volume: 250 }]))).toBe(250)
  })
  it('returns null when nothing is cached', async () => {
    expect(await getMaxCachedVolume(fakeSql([{ max_volume: null }]))).toBeNull()
    expect(await getMaxCachedVolume(fakeSql([]))).toBeNull()
  })
})

describe('logDemandCall / getMonthlyDemandSpendUsd / getDemandStats', () => {
  it('inserts one log row per call', async () => {
    const seen: unknown[][] = []
    const sql = fakeSql([], (_s, values) => seen.push(values))
    await logDemandCall(
      { route: 'score', userId: 'u1', themeKey: 'x', cacheHit: false, estimatedCostUsd: 0.0126, priceVersion: 'v' },
      sql,
    )
    expect(seen[0]).toEqual(['score', 'u1', 'x', false, 0.0126, 'v'])
  })
  it('sums the current-month spend, 0 on error', async () => {
    expect(await getMonthlyDemandSpendUsd(fakeSql([{ total: '12.5' }]))).toBe(12.5)
    const failing = (async () => {
      throw new Error('db down')
    }) as unknown as SqlTag
    expect(await getMonthlyDemandSpendUsd(failing)).toBe(0)
  })
  it('returns monthly stats, null on error', async () => {
    expect(await getDemandStats(fakeSql([{ calls: '10', cache_hits: '7', spend: '0.05' }]))).toEqual({
      calls: 10,
      cacheHits: 7,
      estimatedSpendUsd: 0.05,
    })
    const failing = (async () => {
      throw new Error('db down')
    }) as unknown as SqlTag
    expect(await getDemandStats(failing)).toBeNull()
  })
})
