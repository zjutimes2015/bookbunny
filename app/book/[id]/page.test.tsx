import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'book-1' }),
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('@/components/BunnyMascot', () => ({ default: () => null }))
vi.mock('@/components/ReadAloudPlayer', () => ({ default: () => null }))
vi.mock('@/components/ReadAlongPlayer', () => ({ default: () => null }))
vi.mock('@/components/TurnstileWidget', () => ({ default: () => null }))

import BookDetailPage from './page'

const BOOK_BASE = {
  id: 'book-1',
  title: 'Mia and the Lantern',
  pages: ['Mia and the lantern.', 'The path lit up.'],
  outline: null,
  ageGroup: '3-5',
  theme: 'brave',
  level: 'B',
  aspect: '1:1',
  quiz: null,
  pageImageUrls: [],
  createdAt: '2026-10-24T00:00:00.000Z',
}

function mockBook(payload: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...BOOK_BASE, ...payload }),
    }),
  )
}

describe('book page — remix entry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the next-episode choices to the owning family', async () => {
    mockBook({ canContinue: true, episodeNumber: 1, protagonistName: 'Mia' })
    render(<BookDetailPage />)

    expect(await screen.findByText('Episode 2?')).toBeTruthy()
    expect(screen.getByText('A different ending')).toBeTruthy()
    expect(screen.getByText('A new place')).toBeTruthy()
    expect(screen.getByText('A friend takes the lead')).toBeTruthy()
    expect(screen.getByText(/Same hero, same world/)).toBeTruthy()
  })

  it('hides the remix entry for other families and anonymous readers', async () => {
    mockBook({ canContinue: false, episodeNumber: 1, protagonistName: null })
    render(<BookDetailPage />)

    // 等页面加载完成
    expect(await screen.findByText('Mia and the Lantern')).toBeTruthy()
    expect(screen.queryByText('Episode 2?')).toBeNull()
    expect(screen.queryByText('A new place')).toBeNull()
  })

  it('numbers the next episode from the current one', async () => {
    mockBook({ canContinue: true, episodeNumber: 3, protagonistName: 'Mia' })
    render(<BookDetailPage />)

    expect(await screen.findByText('Episode 4?')).toBeTruthy()
  })
})
