import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolvePageCount, generateStory } from './story'
import { pickLevel } from '@/lib/reading-levels'

describe('resolvePageCount', () => {
  const levelC = pickLevel('C')

  it('keeps the plan allowance when the caller passes a page count', () => {
    // Free plan caps at 8 pages, even though level C targets 14
    expect(resolvePageCount(8, levelC)).toBe(8)
    expect(resolvePageCount(20, levelC)).toBe(20)
    expect(resolvePageCount(24, levelC)).toBe(24)
  })

  it('falls back to the level target only when no page count is given', () => {
    expect(levelC).not.toBeNull()
    expect(resolvePageCount(undefined, levelC)).toBe(levelC!.pageCount)
  })

  it('falls back to 20 when neither a plan cap nor a level is available', () => {
    expect(resolvePageCount(undefined, null)).toBe(20)
  })
})

/** 构造一个只返回大纲的假模型响应 */
function mockModelResponse(pageCount: number) {
  const outline = Array.from({ length: pageCount }, (_, i) => ({
    pageNumber: i + 1,
    pageFunction: i === 0 ? 'cover' : 'body',
    pageText: `page ${i + 1}`,
  }))
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ title: 'T', outline }) } }],
    }),
  } as unknown as Response
}

describe('generateStory — page count enforcement', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('truncates an over-long outline to the requested page count', async () => {
    // 模型多吐了 6 页（14 页）——但套餐只买了 8 页，多出来的页会被整本送去生图
    const fetchMock = vi.fn(async () => mockModelResponse(14))
    vi.stubGlobal('fetch', fetchMock)

    const story = await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
    })

    expect(story.outline).toHaveLength(8)
    expect(story.outline[7].pageNumber).toBe(8)
  })

  it('asks the model for the plan page count, not the reading level target', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
    })

    // @ts-ignore vi.fn() mock calls tuple type is loose in test context
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    const prompt: string = body.messages[1].content
    // C 级自带 14 页目标，若 prompt 里仍写 14 页，模型就会按 14 页产出
    expect(prompt).toContain('Number of pages: 8')
    expect(prompt).toContain('Page count: EXACTLY 8 pages')
    expect(prompt).not.toContain('EXACTLY 14 pages')
  })
})

/** 取出发送给模型的 prompt 文本 */
function promptOf(fetchMock: ReturnType<typeof vi.fn>): string {
  // @ts-ignore vi.fn() mock calls tuple type is loose in test context
  const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
  return body.messages[1].content as string
}

describe('generateStory — ELL mode', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('injects the ELL constraints into the prompt', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
      ell: { enabled: true, homeLanguage: 'Spanish' },
    })

    const prompt = promptOf(fetchMock)
    expect(prompt).toContain('English language learners')
    expect(prompt).toContain('Illustration support')
    expect(prompt).toContain('Do NOT use Spanish')
  })

  it('forces the book language to English even when another language was requested', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
      language: 'zh',
      ell: { enabled: true },
    })

    const prompt = promptOf(fetchMock)
    // ELL 读物教的是英语，不能写成中文
    expect(prompt).toContain('written in English')
    expect(prompt).not.toContain('written in Simplified Chinese')
  })

  it('keeps the requested language when ELL is off', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
      language: 'zh',
    })

    const prompt = promptOf(fetchMock)
    expect(prompt).toContain('written in Simplified Chinese')
    expect(prompt).not.toContain('English language learners')
  })

  it('does not inject ELL constraints when the option is absent', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a brave fox',
      ageGroup: '3-5',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
    })

    expect(promptOf(fetchMock)).not.toContain('English language learners')
  })
})

describe('generateStory — age art direction', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('asks for an illustrated chapter when the reader is 7–10', async () => {
    const fetchMock = vi.fn(async () => mockModelResponse(8))
    vi.stubGlobal('fetch', fetchMock)

    await generateStory({
      theme: 'a radio signal on a ridge',
      ageGroup: '7-10',
      characterName: 'Nora',
      pages: 8,
      level: 'E',
    })

    const prompt = promptOf(fetchMock)
    expect(prompt).toContain('Age band 7-10')
    expect(prompt).toContain('not a toddler')
    expect(prompt).toContain('Only ages 0-3 use toddler proportions')
  })
})
