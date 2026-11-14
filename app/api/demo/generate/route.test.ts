import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/api/story', () => ({
  generateStory: vi.fn(async () => ({
    title: 'Pip and the Lost Star',
    outline: [{ pageNumber: 1, pageText: 'Pip found a star.' }],
    level: 'B',
    levelLabel: 'B · Beginning',
  })),
}))

vi.mock('@/lib/auth', () => ({
  getClientIp: vi.fn(() => '1.2.3.4'),
}))

import { POST } from './route'
import { __resetDemoQuotaStoreForTests } from '@/lib/demo/rate-limit'
import { generateStory } from '@/lib/api/story'
import { getClientIp } from '@/lib/auth'
import { HUMAN_COOKIE, issuePassValue } from '@/lib/turnstile'
import { DEMO_CHARACTER } from '@/lib/demo/presets'

function makeRequest(body: Record<string, unknown>, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/demo/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

function passCookie(): string {
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
  return `${HUMAN_COOKIE}=${issuePassValue()}`
}

beforeEach(() => {
  vi.mocked(generateStory).mockClear()
  vi.mocked(getClientIp).mockReturnValue('1.2.3.4')
  __resetDemoQuotaStoreForTests()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/demo/generate — personal-data rejection', () => {
  it.each([
    { label: 'name', extra: { name: 'Emma' } },
    { label: 'childName', extra: { childName: 'Emma' } },
    { label: 'characterName', extra: { characterName: 'Emma' } },
    { label: 'photo', extra: { photo: 'data:image/png;base64,xxx' } },
    { label: 'photoDataUri', extra: { photoDataUri: 'data:image/png;base64,xxx' } },
    { label: 'email', extra: { email: 'a@example.com' } },
    { label: 'free-text theme', extra: { theme: 'A story about my daughter Emma' } },
    { label: 'prompt', extra: { prompt: 'Emma goes to school' } },
    { label: 'story', extra: { story: 'Emma...' } },
  ])('rejects a request carrying $label without generating', async ({ extra }) => {
    const res = await POST(makeRequest({ presetId: 'moon-star', ...extra }, passCookie()))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.code).toBe('personal_data_rejected')
    expect(generateStory).not.toHaveBeenCalled()
  })

  it('rejects personal-data fields even without a human pass (validation first)', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const res = await POST(makeRequest({ presetId: 'moon-star', name: 'Emma' }))
    expect(res.status).toBe(400)
    expect(generateStory).not.toHaveBeenCalled()
  })

  it('rejects an unknown preset', async () => {
    const res = await POST(makeRequest({ presetId: 'nope' }, passCookie()))
    expect(res.status).toBe(400)
    expect(generateStory).not.toHaveBeenCalled()
  })
})

describe('POST /api/demo/generate — human gate + fixed pipeline', () => {
  it('requires a human pass before generating', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret')
    const res = await POST(makeRequest({ presetId: 'moon-star', ageGroup: '3-5' }))
    expect(res.status).toBe(403)
    expect(generateStory).not.toHaveBeenCalled()
  })

  it('generates with the fixed demo character and preset theme only', async () => {
    const res = await POST(
      makeRequest({ presetId: 'moon-star', ageGroup: '3-5' }, passCookie()),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.title).toBe('Pip and the Lost Star')
    expect(json.characterName).toBe(DEMO_CHARACTER.name)
    expect(json.watermarkedPreview).toBe(true)
    expect(json.consistencyLine).toContain(DEMO_CHARACTER.name)

    expect(generateStory).toHaveBeenCalledTimes(1)
    const opts = vi.mocked(generateStory).mock.calls[0][0]
    expect(opts.characterName).toBe('Pip')
    expect(opts.theme).toBe('Pip the bunny carries a lost, tired little star home before bedtime')
    expect(opts.pages).toBe(8)
    expect(opts.characterCards).toEqual([DEMO_CHARACTER])
    expect(opts.language).toBe('en')
  })
})

describe('POST /api/demo/generate — daily quota', () => {
  it('returns 429 on the second generation from the same IP+device', async () => {
    const body = { presetId: 'moon-star', ageGroup: '3-5', deviceId: 'demo-device-1' }
    const first = await POST(makeRequest(body, passCookie()))
    expect(first.status).toBe(200)

    const second = await POST(makeRequest(body, passCookie()))
    expect(second.status).toBe(429)
    const json = await second.json()
    expect(json.code).toBe('demo_daily_limit')
    expect(typeof json.resetAt).toBe('number')
    expect(generateStory).toHaveBeenCalledTimes(1)
  })

  it('allows a different device on the same IP', async () => {
    const cookie = passCookie()
    const first = await POST(
      makeRequest({ presetId: 'moon-star', deviceId: 'demo-device-1' }, cookie),
    )
    const second = await POST(
      makeRequest({ presetId: 'moon-star', deviceId: 'demo-device-2' }, cookie),
    )
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
  })

  it('allows a different IP with the same device id', async () => {
    const cookie = passCookie()
    const body = { presetId: 'moon-star', deviceId: 'demo-device-1' }
    expect((await POST(makeRequest(body, cookie))).status).toBe(200)
    vi.mocked(getClientIp).mockReturnValue('5.6.7.8')
    expect((await POST(makeRequest(body, cookie))).status).toBe(200)
  })
})
