import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DemandScore from './DemandScore'

// Terms that must never appear in demand-feature copy (SPEC §5 ban list).
const BANNED = ['will sell', 'guaranteed', 'bestseller', 'make money', 'earn', 'sales', 'revenue', 'profit']

function assertNoBannedWords() {
  const text = (document.body.textContent || '').toLowerCase()
  for (const term of BANNED) {
    expect(text, `banned term "${term}" present`).not.toMatch(new RegExp(`\\b${term}\\b`))
  }
}

const SCORE_JSON = {
  available: true,
  score: 72,
  tier: 'High',
  competition: null,
  volume: 3400,
  volumeMax: 5000,
  fetchedAt: '2026-11-14T00:00:00.000Z',
  stale: false,
}

function mockFetchOk(json: unknown) {
  return vi.fn(async () => ({ ok: true, json: async () => json }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('DemandScore visibility', () => {
  it('renders nothing when the switch is off', () => {
    const { container } = render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn enabled={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for logged-out visitors', () => {
    const { container } = render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn={false} enabled />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for blank themes', () => {
    const { container } = render(<DemandScore theme="  " isLoggedIn enabled />)
    expect(container.firstChild).toBeNull()
  })
})

describe('DemandScore free text (button-triggered only)', () => {
  it('does not fetch on render; fetches once on "Check demand"', async () => {
    const fetchMock = mockFetchOk(SCORE_JSON)
    vi.stubGlobal('fetch', fetchMock)
    render(<DemandScore theme="A magical forest adventure" isLoggedIn enabled />)
    expect(screen.getByRole('button', { name: 'Check demand' })).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Check demand' }))
    expect(await screen.findByText('Theme demand')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ theme: 'A magical forest adventure' })
  })

  it('shows tier + small score + Estimated + data date + relative note', async () => {
    vi.stubGlobal('fetch', mockFetchOk(SCORE_JSON))
    render(<DemandScore theme="A magical forest adventure" isLoggedIn enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Check demand' }))
    expect(await screen.findByText('High')).toBeTruthy()
    expect(screen.getByText('72 / 100')).toBeTruthy()
    expect(screen.getByText('Estimated')).toBeTruthy()
    expect(screen.getByText(/Data from Nov 14, 2026/)).toBeTruthy()
    expect(screen.getByText(/relative score/)).toBeTruthy()
    expect(screen.getByText(/third-party estimates/)).toBeTruthy()
    assertNoBannedWords()
  })

  it('hides the competition tag when there is no competition data', async () => {
    vi.stubGlobal('fetch', mockFetchOk(SCORE_JSON))
    render(<DemandScore theme="A magical forest adventure" isLoggedIn enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Check demand' }))
    await screen.findByText('Theme demand')
    expect(screen.queryByText(/Competition:/)).toBeNull()
  })

  it('shows the competition tag when the payload carries one', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ ...SCORE_JSON, competition: 'Medium' }))
    render(<DemandScore theme="A magical forest adventure" isLoggedIn enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Check demand' }))
    expect(await screen.findByText(/Competition:/)).toBeTruthy()
    expect(screen.getByText('Medium')).toBeTruthy()
  })
})

describe('DemandScore tracked themes (automatic)', () => {
  it('checks automatically for a tracked theme (cache-hit path)', async () => {
    const fetchMock = mockFetchOk(SCORE_JSON)
    vi.stubGlobal('fetch', fetchMock)
    render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn enabled />)
    expect(await screen.findByText('Theme demand')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Check demand' })).toBeNull()
  })

  it('re-checks when the theme changes to another tracked theme', async () => {
    const fetchMock = mockFetchOk(SCORE_JSON)
    vi.stubGlobal('fetch', fetchMock)
    const { rerender } = render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn enabled />)
    await screen.findByText('Theme demand')
    rerender(<DemandScore theme="A personalized Christmas book" isLoggedIn enabled />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})

describe('DemandScore degradation', () => {
  it('hides the score area when the API call throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    const { container } = render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn enabled />)
    await waitFor(() => expect(container.firstChild).toBeNull())
    expect(screen.queryByText('Theme demand')).toBeNull()
  })

  it('hides the score area when the API reports unavailable', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ available: false, reason: 'unavailable' }))
    const { container } = render(<DemandScore theme="A dinosaur bedtime story" isLoggedIn enabled />)
    await waitFor(() => expect(container.firstChild).toBeNull())
  })

  it('shows the try-again-tomorrow line when rate limited', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ available: false, reason: 'rate_limited' }))
    render(<DemandScore theme="A magical forest adventure" isLoggedIn enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Check demand' }))
    expect(await screen.findByText(/try again tomorrow/)).toBeTruthy()
    expect(screen.queryByText('Theme demand')).toBeNull()
  })
})
