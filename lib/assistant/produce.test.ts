import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Proposal } from '@/lib/assistant/brief'
import { produceConfirmedBook, ProduceError } from '@/lib/assistant/produce'

const proposal: Proposal = {
  childName: 'Mia',
  ageGroup: '5-7',
  theme: 'dinosaurs',
  level: 'C',
  pages: 8,
  costUnits: 1,
  levelLabel: 'C · Early',
  capped: false,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('produceConfirmedBook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the saved book id when illustration fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/verify-turnstile')) return json({ success: true })
      if (url.includes('/api/create-character')) return json({ name: 'Mia', card: { name: 'Mia' } })
      if (url.includes('/api/create-story')) {
        return json({
          title: 'Mia and the Dinosaurs',
          outline: [{ pageNumber: 1, pageText: 'Mia sees a dinosaur.' }],
          level: 'C',
        })
      }
      if (url.includes('/api/books')) return json({ bookId: 'book-1' })
      if (url.includes('/api/generate-pages')) return json({ error: 'draw failed' }, 500)
      return json({ error: `unexpected ${url}` }, 500)
    }))

    await expect(produceConfirmedBook({
      proposal,
      turnstileToken: 'token',
      onProgress: () => {},
    })).rejects.toMatchObject({ bookId: 'book-1', code: 'failed' })
  })

  it('does not attach a book id when the save itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/verify-turnstile')) return json({ success: true })
      if (url.includes('/api/create-character')) return json({ name: 'Mia' })
      if (url.includes('/api/create-story')) {
        return json({
          title: 'Mia and the Dinosaurs',
          outline: [{ pageNumber: 1, pageText: 'Mia sees a dinosaur.' }],
        })
      }
      if (url.includes('/api/books')) return json({ error: 'no credits', code: 'no_allocation' }, 402)
      return json({ error: `unexpected ${url}` }, 500)
    }))

    try {
      await produceConfirmedBook({
        proposal,
        turnstileToken: 'token',
        onProgress: () => {},
      })
      throw new Error('expected failure')
    } catch (err) {
      expect(err).toBeInstanceOf(ProduceError)
      expect((err as ProduceError).bookId).toBeUndefined()
      expect((err as ProduceError).code).toBe('allowance')
    }
  })
})
