import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  loadRemixSourceMock,
  insertEpisodeMock,
  generateStoryMock,
  consumeAllocationMock,
  requireHumanMock,
  getSessionUserMock,
  rateMock,
} = vi.hoisted(() => ({
  loadRemixSourceMock: vi.fn(),
  insertEpisodeMock: vi.fn(),
  generateStoryMock: vi.fn(),
  consumeAllocationMock: vi.fn(),
  requireHumanMock: vi.fn(),
  getSessionUserMock: vi.fn(),
  rateMock: vi.fn(),
}))

vi.mock('@/lib/series', () => ({
  loadRemixSource: loadRemixSourceMock,
  insertEpisode: insertEpisodeMock,
}))
vi.mock('@/lib/api/story', () => ({ generateStory: generateStoryMock }))
vi.mock('@/lib/allocation', () => ({
  consumeBookAllocation: consumeAllocationMock,
  // A4 画幅生图成本翻倍，扣 2 个额度单位
  bookCostUnits: (aspect?: string | null) => (aspect === 'a4' ? 2 : 1),
}))
vi.mock('@/lib/turnstile', () => ({
  requireHuman: requireHumanMock,
  attachPassCookie: (res: unknown) => res,
  humanCheckFailedResponse: () =>
    new Response(JSON.stringify({ error: 'Human verification required', code: 'bot_check_required' }), {
      status: 403,
    }),
}))
vi.mock('@/lib/auth', () => ({ getSessionUser: getSessionUserMock }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: rateMock }))

import { POST } from './route'

const OUTLINE = [
  {
    pageNumber: 1,
    pageFunction: 'cover',
    pageTheme: 'Cover',
    plotNode: 'n',
    characters: ['Mia'],
    characterAction: 'a',
    characterEmotion: 'e',
    pageText: 'Mia and the lantern.',
    wordCountHint: 4,
    visualStyle: '',
    colorMood: '',
    coreVisualElements: [],
    supportingVisualElements: [],
    composition: '',
    textWhitespace: '',
    forbiddenElements: [],
    imagePromptPoints: '',
    continuity: '',
  },
]

function makeSource(overrides: Record<string, unknown> = {}) {
  return {
    bookId: 'book-1',
    bookUserId: 'user-1',
    aspect: '1:1',
    storyId: 'story-1',
    storyTitle: 'Mia and the Lantern',
    storyTheme: 'brave',
    ageGroup: '3-5',
    level: 'B',
    content: ['page one', 'the light came on'],
    latestEpisode: 1,
    series: {
      id: 'series-1',
      userId: 'user-1',
      title: 'Mia and the Lantern',
      worldId: 'world-star-farm',
      worldSnapshot: {
        id: 'world-star-farm',
        name: '星星农场',
        ageRange: '3-5',
        theme: '勇敢',
        scene: '云上的小农场',
        artStyle: 'watercolor',
        characters: [{ name: '皮皮', role: '南瓜灯', personality: '胆小', catchphrase: '我试试。' }],
        moralPool: ['先深呼吸', '向朋友求助'],
        forbiddenZones: ['没有真正的坏人'],
      },
      protagonistName: 'Mia',
      protagonistCard: null,
      protagonistConsistencyLine: 'Mia, 4 years old, red raincoat',
      protagonistImageUrl: '/api/assets/characters/x/portrait.png',
      style: 'soft watercolor',
      styleLexicon: null,
      theme: 'brave',
      ageGroup: '3-5',
      level: 'B',
    },
    ...overrides,
  }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/remix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/remix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireHumanMock.mockResolvedValue({ ok: true, issued: false })
    getSessionUserMock.mockResolvedValue({ id: 'user-1', tier: 'creator', isPaid: true })
    rateMock.mockResolvedValue({ allowed: true })
    consumeAllocationMock.mockResolvedValue({ ok: true })
    generateStoryMock.mockResolvedValue({
      title: 'Mia and the Storm Lantern',
      outline: OUTLINE,
      level: 'B',
      quiz: { questions: [] },
    })
    insertEpisodeMock.mockResolvedValue({ storyId: 'story-2', bookId: 'book-2' })
    loadRemixSourceMock.mockResolvedValue(makeSource())
  })

  it('rejects an unknown remix kind', async () => {
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'rewrite-world' }))
    expect(res.status).toBe(400)
  })

  it('requires a signed-in family account', async () => {
    getSessionUserMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(401)
  })

  it('refuses to continue another family’s book', async () => {
    loadRemixSourceMock.mockResolvedValue(makeSource({ bookUserId: 'someone-else' }))
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(403)
    expect(insertEpisodeMock).not.toHaveBeenCalled()
  })

  it('refuses when the series owner does not match', async () => {
    const source = makeSource()
    source.series.userId = 'someone-else'
    loadRemixSourceMock.mockResolvedValue(source)
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(403)
  })

  it('returns no_series for books without a saved protagonist', async () => {
    loadRemixSourceMock.mockResolvedValue(makeSource({ series: null }))
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('no_series')
  })

  it('returns 402 and writes nothing when the plan is exhausted', async () => {
    consumeAllocationMock.mockResolvedValue({ ok: false, reason: 'no_credits_or_allowance' })
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(402)
    expect(insertEpisodeMock).not.toHaveBeenCalled()
  })

  it('writes the next episode with the same protagonist and a rotated moral', async () => {
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'scene' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json).toMatchObject({
      bookId: 'book-2',
      episodeNumber: 2,
      moral: '向朋友求助', // 第 2 集 → 寓意池第二条
    })

    const brief = generateStoryMock.mock.calls[0][0].sequelBrief as string
    expect(brief).toContain('EPISODE 2')
    expect(brief).toContain('Mia')
    expect(brief).toContain('星星农场')
    expect(brief).toContain('向朋友求助')

    expect(insertEpisodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        seriesId: 'series-1',
        episodeNumber: 2,
        remixKind: 'scene',
        moral: '向朋友求助',
      }),
    )
  })

  it('charges the plan only after the episode is written', async () => {
    generateStoryMock.mockRejectedValue(new Error('LLM down'))
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(500)
    expect(consumeAllocationMock).not.toHaveBeenCalled()
  })

  it('caps the sequel at the plan page limit', async () => {
    // 上一集 32 页（高于付费档 16 页上限），续集必须被砍到 16 页
    loadRemixSourceMock.mockResolvedValue(
      makeSource({ content: Array.from({ length: 32 }, (_, i) => `page ${i + 1}`) }),
    )
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(200)
    expect(generateStoryMock.mock.calls[0][0].pages).toBe(16)
  })

  it('caps the sequel at 8 pages for the free tier', async () => {
    getSessionUserMock.mockResolvedValue({ id: 'user-1', tier: 'free', isPaid: false })
    loadRemixSourceMock.mockResolvedValue(
      makeSource({ content: Array.from({ length: 16 }, (_, i) => `page ${i + 1}`) }),
    )
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(200)
    expect(generateStoryMock.mock.calls[0][0].pages).toBe(8)
  })

  it('keeps the sequel the same length as the source book when it fits', async () => {
    const res = await POST(makeRequest({ bookId: 'book-1', kind: 'ending' }))
    expect(res.status).toBe(200)
    // 来源书 2 页 → 至少 4 页（生图下限），且不超过套餐上限
    expect(generateStoryMock.mock.calls[0][0].pages).toBe(4)
  })
})
