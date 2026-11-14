import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ListingSuggestions from './ListingSuggestions'

const BANNED = ['will sell', 'guaranteed', 'bestseller', 'make money', 'earn', 'sales', 'revenue', 'profit']

function assertNoBannedWords() {
  const text = (document.body.textContent || '').toLowerCase()
  for (const term of BANNED) {
    expect(text, `banned term "${term}" present`).not.toMatch(new RegExp(`\\b${term}\\b`))
  }
}

const LISTING_JSON = {
  available: true,
  categories: [
    { path: 'Juvenile Fiction / Animals / Dinosaurs & Prehistoric Creatures', bisac: 'JUV002060' },
    { path: 'Juvenile Fiction / Bedtime & Dreams', bisac: 'JUV010000' },
    { path: 'Juvenile Fiction / Action & Adventure / General', bisac: 'JUV001000' },
  ],
  keywords: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'],
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

describe('ListingSuggestions gating (canKdp)', () => {
  it('does not exist for non-Creator tiers (not a disabled state)', () => {
    const { container } = render(
      <ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp={false} enabled />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('does not exist when the switch is off', () => {
    const { container } = render(
      <ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled={false} />,
    )
    expect(container.firstChild).toBeNull()
  })
})

describe('ListingSuggestions results', () => {
  it('loads only on the explicit button press', async () => {
    const fetchMock = mockFetchOk(LISTING_JSON)
    vi.stubGlobal('fetch', fetchMock)
    render(<ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled />)
    expect(fetchMock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    expect(await screen.findByText('Listing suggestions')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ theme: 'A dinosaur bedtime story', title: 'Sleepy Rex' })
  })

  it('shows exactly 3 categories + 7 keywords + Estimated + verify-in-KDP note', async () => {
    vi.stubGlobal('fetch', mockFetchOk(LISTING_JSON))
    render(<ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    await screen.findByText('Listing suggestions')
    expect(screen.getByText('Juvenile Fiction / Animals / Dinosaurs & Prehistoric Creatures')).toBeTruthy()
    expect(screen.getByText('Juvenile Fiction / Bedtime & Dreams')).toBeTruthy()
    expect(screen.getByText('Juvenile Fiction / Action & Adventure / General')).toBeTruthy()
    for (const kw of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7']) {
      expect(screen.getByRole('button', { name: `Copy keyword ${kw}` })).toBeTruthy()
    }
    expect(screen.getByText('Estimated')).toBeTruthy()
    expect(
      screen.getByText(/Suggestions based on estimated search demand\. Verify categories and keywords in KDP before publishing\./),
    ).toBeTruthy()
    expect(screen.getByText(/Data from Nov 14, 2026/)).toBeTruthy()
    assertNoBannedWords()
  })

  it('shows the fallback line when no categories are mapped', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ ...LISTING_JSON, categories: null }))
    render(<ListingSuggestions theme="A picture book adventure" title="T" canKdp enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    expect(await screen.findByText('No category suggestions for this theme yet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copy keyword k1' })).toBeTruthy()
  })
})

describe('ListingSuggestions copy + degradation', () => {
  it('copies one keyword and shows the copied state', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    vi.stubGlobal('fetch', mockFetchOk(LISTING_JSON))
    render(<ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    await screen.findByText('Listing suggestions')
    fireEvent.click(screen.getByRole('button', { name: 'Copy keyword k3' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('k3'))
    expect(await screen.findByText('Copied ✓')).toBeTruthy()
  })

  it('Copy all copies categories + keywords together', async () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    vi.stubGlobal('fetch', mockFetchOk(LISTING_JSON))
    render(<ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled />)
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    await screen.findByText('Listing suggestions')
    fireEvent.click(screen.getByRole('button', { name: 'Copy all' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const copied = (writeText.mock.calls[0] as unknown as [string])[0]
    expect(copied).toContain('Juvenile Fiction / Animals / Dinosaurs & Prehistoric Creatures')
    expect(copied).toContain('k7')
  })

  it('hides the whole block when the lookup fails', async () => {
    vi.stubGlobal('fetch', mockFetchOk({ available: false, reason: 'unavailable' }))
    const { container } = render(
      <ListingSuggestions theme="A dinosaur bedtime story" title="Sleepy Rex" canKdp enabled />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Get listing suggestions' }))
    await waitFor(() => expect(container.firstChild).toBeNull())
  })
})
