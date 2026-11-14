import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(async () => null),
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, count: 1, limit: 10 })),
}))

vi.mock('@/lib/demand/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/demand/store')>()
  return {
    ...actual,
    readDemandCache: vi.fn(async () => null),
    writeDemandCache: vi.fn(async () => {}),
    getMaxCachedVolume: vi.fn(async () => null),
    logDemandCall: vi.fn(async () => {}),
    getMonthlyDemandSpendUsd: vi.fn(async () => 0),
  }
})

vi.mock('@/lib/demand/client', () => ({
  dataForSeoCredentials: vi.fn(() => ({ login: 'login', password: 'pw' })),
  fetchBulkSearchVolumes: vi.fn(async () => ({
    volumes: [
      { keyword: 'dinosaur bedtime story', searchVolume: 1200 },
      { keyword: 'dinosaur book for kids', searchVolume: 3400 },
    ],
    costUsd: 0.0126,
    itemCount: 2,
  })),
  DATAFORSEO_PRICE_VERSION: 'labs-amazon-2026-11-14',
}))

import { POST } from './route'
import { getSessionUser } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { readDemandCache, writeDemandCache, getMonthlyDemandSpendUsd, logDemandCall } from '@/lib/demand/store'
import { fetchBulkSearchVolumes, dataForSeoCredentials } from '@/lib/demand/client'

const USER = {
  id: 'u1',
  email: 'a@example.com',
  tier: 'free',
  isPaid: false,
  credits: 0,
  proCredits: 0,
  allowanceRemaining: null,
  allowanceResetAt: null,
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/demand/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.mocked(getSessionUser).mockReset().mockResolvedValue(null)
  vi.mocked(checkRateLimit).mockReset().mockResolvedValue({ allowed: true, count: 1, limit: 10 })
  vi.mocked(readDemandCache).mockReset().mockResolvedValue(null)
  vi.mocked(writeDemandCache).mockReset().mockResolvedValue(undefined)
  vi.mocked(getMonthlyDemandSpendUsd).mockReset().mockResolvedValue(0)
  vi.mocked(logDemandCall).mockReset().mockResolvedValue(undefined)
  vi.mocked(fetchBulkSearchVolumes).mockReset().mockResolvedValue({
    volumes: [
      { keyword: 'dinosaur bedtime story', searchVolume: 1200 },
      { keyword: 'dinosaur book for kids', searchVolume: 3400 },
    ],
    costUsd: 0.0126,
    itemCount: 2,
  })
  vi.mocked(dataForSeoCredentials).mockReset().mockReturnValue({ login: 'login', password: 'pw' })
})

describe('POST /api/demand/score', () => {
  it('requires login', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    const res = await POST(makeReq({ theme: 'dinosaurs' }))
    expect(res.status).toBe(401)
    expect(fetchBulkSearchVolumes).not.toHaveBeenCalled()
  })

  it('returns unavailable (not an error) when the switch is off', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    const res = await POST(makeReq({ theme: 'dinosaurs' }))
    expect(res.status).toBe(200)
    expect((await res.json()).reason).toBe('disabled')
    expect(fetchBulkSearchVolumes).not.toHaveBeenCalled()
  })

  it('serves a fresh cache hit without calling the API or the rate limiter', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    vi.mocked(readDemandCache).mockResolvedValue({
      payload: {
        version: 'demand-score-v1',
        volume: 3400,
        volumeMax: 5000,
        score: 72,
        tier: 'High',
        competition: null,
        seeds: ['dinosaur bedtime story'],
        fetchedAt: '2026-11-14T00:00:00.000Z',
        marketplace: 'amazon.com',
        language: 'en',
      },
      fetchedAt: '2026-11-14T00:00:00.000Z',
      stale: false,
    })
    const res = await POST(makeReq({ theme: 'A dinosaur bedtime story' }))
    const json = await res.json()
    expect(json.available).toBe(true)
    expect(json.score).toBe(72)
    expect(json.stale).toBe(false)
    expect(fetchBulkSearchVolumes).not.toHaveBeenCalled()
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(logDemandCall).toHaveBeenCalledWith(
      expect.objectContaining({ cacheHit: true, estimatedCostUsd: 0 }),
    )
  })

  it('fetches, scores, caches, and logs on a cache miss', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    const res = await POST(makeReq({ theme: 'A dinosaur bedtime story' }))
    const json = await res.json()
    expect(json.available).toBe(true)
    expect(json.volume).toBe(3400) // max of the seed volumes
    expect(json.score).toBe(100) // sole theme on record scores against itself
    expect(json.tier).toBe('High')
    expect(json.competition).toBeNull()
    expect(writeDemandCache).toHaveBeenCalledOnce()
    expect(logDemandCall).toHaveBeenCalledWith(
      expect.objectContaining({ cacheHit: false, estimatedCostUsd: 0.0126 }),
    )
  })

  it('scores against the cached reference maximum when other themes exist', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    const { getMaxCachedVolume } = await import('@/lib/demand/store')
    vi.mocked(getMaxCachedVolume).mockResolvedValue(100000)
    const json = await (await POST(makeReq({ theme: 'A dinosaur bedtime story' }))).json()
    expect(json.volumeMax).toBe(100000)
    expect(json.score).toBeLessThan(100)
  })

  it('returns stale cache when the API throws (failure isolation, no 500)', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    vi.mocked(readDemandCache).mockResolvedValue({
      payload: {
        version: 'demand-score-v1',
        volume: 100,
        volumeMax: 100,
        score: 100,
        tier: 'High',
        competition: null,
        seeds: [],
        fetchedAt: '2026-10-01T00:00:00.000Z',
        marketplace: 'amazon.com',
        language: 'en',
      },
      fetchedAt: '2026-10-01T00:00:00.000Z',
      stale: true,
    })
    vi.mocked(fetchBulkSearchVolumes).mockRejectedValue(new Error('timeout'))
    const res = await POST(makeReq({ theme: 'dinosaurs' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.available).toBe(true)
    expect(json.stale).toBe(true)
  })

  it('returns no_data (hidden, never 0) when every volume is zero', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    vi.mocked(fetchBulkSearchVolumes).mockResolvedValue({
      volumes: [{ keyword: 'x', searchVolume: 0 }],
      costUsd: 0.012,
      itemCount: 1,
    })
    const json = await (await POST(makeReq({ theme: 'dinosaurs' }))).json()
    expect(json).toEqual({ available: false, reason: 'no_data' })
    expect(writeDemandCache).not.toHaveBeenCalled()
  })

  it('rate limit returns rate_limited without calling the API', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, count: 11, limit: 10 })
    const json = await (await POST(makeReq({ theme: 'dinosaurs' }))).json()
    expect(json).toEqual({ available: false, reason: 'rate_limited' })
    expect(fetchBulkSearchVolumes).not.toHaveBeenCalled()
  })

  it('budget fuse returns budget_exceeded without calling the API', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.stubEnv('DEMAND_MONTHLY_BUDGET_USD', '50')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    vi.mocked(getMonthlyDemandSpendUsd).mockResolvedValue(50)
    const json = await (await POST(makeReq({ theme: 'dinosaurs' }))).json()
    expect(json).toEqual({ available: false, reason: 'budget_exceeded' })
    expect(fetchBulkSearchVolumes).not.toHaveBeenCalled()
  })

  it('rejects a missing theme', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMAND_ENABLED', 'true')
    vi.mocked(getSessionUser).mockResolvedValue(USER)
    const res = await POST(makeReq({ theme: '  ' }))
    expect(res.status).toBe(400)
  })
})
