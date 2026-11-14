import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, count: 1, limit: 5 })),
}))

vi.mock('@/lib/demand/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/demand/store')>()
  return {
    ...actual,
    readDemandCache: vi.fn(async () => null),
    writeDemandCache: vi.fn(async () => {}),
    logDemandCall: vi.fn(async () => {}),
    getMonthlyDemandSpendUsd: vi.fn(async () => 0),
  }
})

vi.mock('@/lib/demand/client', () => ({
  dataForSeoCredentials: vi.fn(() => ({ login: 'login', password: 'pw' })),
  fetchRelatedKeywords: vi.fn(async () => ({
    keywords: [
      { keyword: 'dinosaur books for toddlers', searchVolume: 800 },
      { keyword: 'Dinosaur Books For Toddlers', searchVolume: 800 },
      { keyword: 'disney dinosaur book', searchVolume: 900 },
      { keyword: 'dinosaur bedtime story book', searchVolume: 500 },
      { keyword: 'dinosaur picture book ages 3 5', searchVolume: 400 },
      { keyword: 'dinosaur story for kids', searchVolume: 300 },
      { keyword: 'toddler dinosaur book', searchVolume: 200 },
      { keyword: 'dinosaur book gift', searchVolume: 100 },
      { keyword: 'dinosaur bedtime book', searchVolume: 90 },
    ],
    costUsd: 0.0132,
    itemCount: 9,
  })),
  DATAFORSEO_PRICE_VERSION: 'labs-amazon-2026-11-14',
}))

import { POST } from './route'
import { getSessionUser } from '@/lib/auth'
import { readDemandCache, writeDemandCache, logDemandCall } from '@/lib/demand/store'
import { fetchRelatedKeywords } from '@/lib/demand/client'

function userWithTier(tier: string) {
  return {
    id: 'u1',
    email: 'a@example.com',
    tier,
    isPaid: tier !== 'free',
    credits: 0,
    proCredits: 0,
    allowanceRemaining: null,
    allowanceResetAt: null,
  }
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/demand/listing-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getSessionUser).mockReset().mockResolvedValue(null)
  vi.mocked(readDemandCache).mockReset().mockResolvedValue(null)
  vi.mocked(writeDemandCache).mockReset().mockResolvedValue(undefined)
  vi.mocked(logDemandCall).mockReset().mockResolvedValue(undefined)
  vi.mocked(fetchRelatedKeywords).mockClear()
})

describe('POST /api/demand/listing-suggestions', () => {
  it('requires login', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    const res = await POST(makeReq({ theme: 'dinosaurs', title: 'T' }))
    expect(res.status).toBe(401)
  })

  it('enforces the Creator+ tier server-side (403 for Free)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(userWithTier('free'))
    const res = await POST(makeReq({ theme: 'dinosaurs', title: 'T' }))
    expect(res.status).toBe(403)
    expect(fetchRelatedKeywords).not.toHaveBeenCalled()
  })

  it('admits creator / studio / teacher / commercial', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    for (const tier of ['creator', 'studio', 'teacher', 'commercial']) {
      vi.mocked(getSessionUser).mockResolvedValue(userWithTier(tier))
      const res = await POST(makeReq({ theme: 'A dinosaur bedtime story', title: 'T' }))
      expect(res.status).toBe(200)
      expect((await res.json()).available).toBe(true)
    }
  })

  it('returns 3 mapped categories + 7 cleaned keywords, and caches', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(userWithTier('creator'))
    const json = await (await POST(makeReq({ theme: 'A dinosaur bedtime story', title: 'Sleepy Rex' }))).json()
    expect(json.available).toBe(true)
    expect(json.categories).toHaveLength(3)
    expect(json.categories[0].path).toContain('Dinosaurs & Prehistoric Creatures')
    // Deduped (case-insensitive), brand term dropped, truncated to 7:
    expect(json.keywords).toEqual([
      'dinosaur books for toddlers',
      'dinosaur bedtime story book',
      'dinosaur picture book ages 3 5',
      'dinosaur story for kids',
      'toddler dinosaur book',
      'dinosaur book gift',
      'dinosaur bedtime book',
    ])
    expect(writeDemandCache).toHaveBeenCalledOnce()
    expect(logDemandCall).toHaveBeenCalledWith(
      expect.objectContaining({ route: 'listing-suggestions', cacheHit: false }),
    )
  })

  it('returns null categories for unmapped themes (fallback, never invented)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(userWithTier('creator'))
    const json = await (await POST(makeReq({ theme: 'A picture book adventure', title: 'T' }))).json()
    expect(json.available).toBe(true)
    expect(json.categories).toBeNull()
    expect(json.keywords.length).toBeGreaterThan(0)
  })

  it('serves a fresh cache hit without calling the API', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(userWithTier('creator'))
    vi.mocked(readDemandCache).mockResolvedValue({
      payload: {
        version: 'demand-score-v1',
        categories: null,
        keywords: ['cached kw'],
        fetchedAt: '2026-11-14T00:00:00.000Z',
        marketplace: 'amazon.com',
        language: 'en',
      },
      fetchedAt: '2026-11-14T00:00:00.000Z',
      stale: false,
    })
    const json = await (await POST(makeReq({ theme: 'dinosaurs', title: 'T' }))).json()
    expect(json.keywords).toEqual(['cached kw'])
    expect(fetchRelatedKeywords).not.toHaveBeenCalled()
  })

  it('degrades to unavailable (200, no 500) when the API throws', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(userWithTier('creator'))
    vi.mocked(fetchRelatedKeywords).mockRejectedValue(new Error('timeout'))
    const res = await POST(makeReq({ theme: 'dinosaurs', title: 'T' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ available: false, reason: 'unavailable' })
  })
})
