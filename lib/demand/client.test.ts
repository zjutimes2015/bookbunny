import { describe, it, expect, vi } from 'vitest'
import {
  parseBulkSearchVolume,
  parseRelatedKeywords,
  estimateCallCostUsd,
  dataForSeoCredentials,
  fetchBulkSearchVolumes,
  fetchRelatedKeywords,
  DATAFORSEO_BULK_SEARCH_VOLUME_PATH,
  DATAFORSEO_RELATED_KEYWORDS_PATH,
  DATAFORSEO_PRICE_PER_TASK_USD,
  DATAFORSEO_PRICE_PER_ITEM_USD,
} from './client'

// Fixtures shaped after the documented responses (docs.dataforseo.com).
// Synthetic test data only — never production measurements.
const BULK_BODY = {
  version: '0.1.20220216',
  status_code: 20000,
  status_message: 'Ok.',
  cost: 0.0126,
  tasks: [
    {
      id: 'task-1',
      status_code: 20000,
      status_message: 'Ok.',
      cost: 0.0126,
      result_count: 1,
      result: [
        {
          se_type: 'amazon',
          location_code: 2840,
          language_code: 'en',
          total_count: 3,
          items_count: 3,
          items: [
            { se_type: 'amazon', keyword: 'dinosaur bedtime story', search_volume: 1200 },
            { se_type: 'amazon', keyword: 'dinosaur book for kids', search_volume: 3400 },
            { se_type: 'amazon', keyword: 'missing keyword', search_volume: null },
          ],
        },
      ],
    },
  ],
}

const RELATED_BODY = {
  status_code: 20000,
  cost: 0.0132,
  tasks: [
    {
      status_code: 20000,
      cost: 0.0132,
      result: [
        {
          seed_keyword: 'dinosaur bedtime story',
          items: [
            {
              keyword_data: {
                keyword: 'dinosaur books for toddlers',
                keyword_info: { search_volume: 800, last_updated_time: '2026-11-01 00:00:00 +00:00' },
              },
              depth: 1,
              related_keywords: null,
            },
            {
              keyword_data: {
                keyword: 'dinosaur bedtime story book',
                keyword_info: { search_volume: 500 },
              },
              depth: 1,
            },
            { keyword_data: { keyword: 'no info keyword' }, depth: 1 },
          ],
        },
      ],
    },
  ],
}

describe('parseBulkSearchVolume', () => {
  it('reads keyword + search_volume items', () => {
    expect(parseBulkSearchVolume(BULK_BODY)).toEqual([
      { keyword: 'dinosaur bedtime story', searchVolume: 1200 },
      { keyword: 'dinosaur book for kids', searchVolume: 3400 },
      { keyword: 'missing keyword', searchVolume: null },
    ])
  })
  it('throws on a task-level error status', () => {
    const failed = { tasks: [{ status_code: 40400, status_message: 'Not found.' }] }
    expect(() => parseBulkSearchVolume(failed)).toThrow()
  })
  it('returns empty for malformed bodies', () => {
    expect(parseBulkSearchVolume(null)).toEqual([])
    expect(parseBulkSearchVolume({})).toEqual([])
    expect(parseBulkSearchVolume({ tasks: [] })).toEqual([])
  })
})

describe('parseRelatedKeywords', () => {
  it('reads nested keyword_data items', () => {
    expect(parseRelatedKeywords(RELATED_BODY)).toEqual([
      { keyword: 'dinosaur books for toddlers', searchVolume: 800 },
      { keyword: 'dinosaur bedtime story book', searchVolume: 500 },
      { keyword: 'no info keyword', searchVolume: null },
    ])
  })
  it('throws on a task-level error status', () => {
    expect(() => parseRelatedKeywords({ tasks: [{ status_code: 50000 }] })).toThrow()
  })
})

describe('estimateCallCostUsd', () => {
  it('uses the verified Labs Amazon price table ($0.012 + $0.00012/item)', () => {
    expect(DATAFORSEO_PRICE_PER_TASK_USD).toBe(0.012)
    expect(DATAFORSEO_PRICE_PER_ITEM_USD).toBe(0.00012)
    expect(estimateCallCostUsd(5)).toBeCloseTo(0.0126, 10)
    expect(estimateCallCostUsd(0)).toBe(0.012)
  })
})

describe('dataForSeoCredentials', () => {
  it('reads server env only', () => {
    expect(
      dataForSeoCredentials({ DATAFORSEO_LOGIN: 'login', DATAFORSEO_PASSWORD: 'pw' } as NodeJS.ProcessEnv),
    ).toEqual({ login: 'login', password: 'pw' })
  })
  it('returns null when either credential is missing', () => {
    expect(dataForSeoCredentials({} as NodeJS.ProcessEnv)).toBeNull()
    expect(dataForSeoCredentials({ DATAFORSEO_LOGIN: 'login' } as NodeJS.ProcessEnv)).toBeNull()
    expect(
      dataForSeoCredentials({ DATAFORSEO_LOGIN: ' ', DATAFORSEO_PASSWORD: 'pw' } as NodeJS.ProcessEnv),
    ).toBeNull()
  })
})

function mockFetch(body: unknown, ok = true) {
  return vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => body }))
}

describe('fetchBulkSearchVolumes', () => {
  it('POSTs one task with US location + English, Basic auth, and prefers the response cost', async () => {
    const fetchImpl = mockFetch(BULK_BODY)
    const res = await fetchBulkSearchVolumes(
      ['dinosaur bedtime story'],
      { login: 'login', password: 'pw' },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(res.volumes).toHaveLength(3)
    expect(res.costUsd).toBe(0.0126) // response cost, not the formula
    expect(fetchImpl).toHaveBeenCalledOnce()
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`https://api.dataforseo.com${DATAFORSEO_BULK_SEARCH_VOLUME_PATH}`)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from('login:pw').toString('base64')}`,
    )
    expect(JSON.parse(String(init.body))).toEqual([
      { keywords: ['dinosaur bedtime story'], location_code: 2840, language_code: 'en' },
    ])
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('falls back to the formula cost when the response carries no cost', async () => {
    const noCost = { ...BULK_BODY, cost: undefined, tasks: [{ ...BULK_BODY.tasks[0], cost: undefined }] }
    const fetchImpl = mockFetch(noCost)
    const res = await fetchBulkSearchVolumes(
      ['k'],
      { login: 'l', password: 'p' },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(res.costUsd).toBeCloseTo(0.012 + 3 * 0.00012, 10)
  })

  it('throws on HTTP errors (routes isolate the failure)', async () => {
    const fetchImpl = mockFetch({}, false)
    await expect(
      fetchBulkSearchVolumes(['k'], { login: 'l', password: 'p' }, { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow('HTTP 500')
  })
})

describe('fetchRelatedKeywords', () => {
  it('POSTs the seed keyword with limit + seed exclusion', async () => {
    const fetchImpl = mockFetch(RELATED_BODY)
    const res = await fetchRelatedKeywords(
      'dinosaur bedtime story',
      20,
      { login: 'l', password: 'p' },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    expect(res.keywords).toHaveLength(3)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`https://api.dataforseo.com${DATAFORSEO_RELATED_KEYWORDS_PATH}`)
    expect(JSON.parse(String(init.body))).toEqual([
      {
        keyword: 'dinosaur bedtime story',
        location_code: 2840,
        language_name: 'English',
        limit: 20,
        include_seed_keyword: false,
      },
    ])
  })
})
