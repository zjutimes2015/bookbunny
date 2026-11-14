import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// --- Mock auth context ---
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', subscriptionTier: 'free', credits: 5 } }),
}))

// --- Mock heavy child components ---
vi.mock('@/components/BunnyMascot', () => ({ default: () => null }))

// Consent gate: render a marker so tests can assert presence/absence.
vi.mock('@/components/ParentalConsentGate', () => ({
  default: () => <div data-testid="consent-gate" />,
}))

// AIPromptBox: render an input that forwards value/onChange
vi.mock('@/components/AIPromptBox', () => ({
  default: ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      data-testid="theme-input"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// MultiCharacterManager: expose the kind wiring as data attributes and auto-add
// one character (as in page.test.tsx) so the character-dependent sections render.
vi.mock('@/components/MultiCharacterManager', () => ({
  default: ({ onAdd, defaultKind, showKindSelector }: {
    onAdd: (name: string) => void
    defaultKind?: string
    showKindSelector?: boolean
  }) => {
    if (typeof window !== 'undefined') {
      setTimeout(() => onAdd('Luna'), 150)
    }
    return (
      <div
        data-testid="char-manager"
        data-default-kind={defaultKind ?? 'child'}
        data-show-kind-selector={String(!!showKindSelector)}
      />
    )
  },
}))

// TurnstileWidget: auto-verify with a token
vi.mock('@/components/TurnstileWidget', () => ({
  default: ({ onVerify }: { onVerify: (token: string) => void }) => {
    if (typeof window !== 'undefined') {
      setTimeout(() => onVerify('mock-turnstile-token'), 0)
    }
    return <div data-testid="turnstile" />
  },
}))

// --- Mock KDP export ---
vi.mock('@/lib/kdp/export', () => ({
  buildInteriorPdf: vi.fn(),
  buildCoverPdf: vi.fn(),
}))

// --- Mock fetch: human-pass exchange succeeds; character creation returns empty ---
vi.stubGlobal('fetch', vi.fn(async (url: unknown) => {
  const u = String(url)
  if (u.includes('/api/verify-turnstile')) {
    return { ok: true, json: async () => ({ success: true }) }
  }
  return { ok: true, json: async () => ({}) }
}))

import CreatePage from './page'

afterEach(() => {
  window.history.pushState({}, '', '/')
})

describe('CreatePage — book type selection', () => {
  // Merged consent-gate semantics: the gate renders only when BOTH hold —
  // the photo character path is selected AND the book type can include a
  // child photo (child / child-pet). Pet-only books never show it.
  it('defaults to the child flow: consent gate, age group and reading level shown', async () => {
    render(<CreatePage />)

    expect(screen.queryByTestId('consent-gate')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))

    expect(screen.getByTestId('consent-gate')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('Age Group')).toBeTruthy())
    expect(screen.getByText('Reading Level (GRL)')).toBeTruthy()
    expect(screen.getByTestId('char-manager').getAttribute('data-default-kind')).toBe('child')
    expect(screen.getByTestId('char-manager').getAttribute('data-show-kind-selector')).toBe('false')
  })

  it('hides the consent gate, age group and reading level for pet-only books', async () => {
    render(<CreatePage />)

    fireEvent.click(screen.getByRole('button', { name: /pet story/i }))

    expect(screen.queryByTestId('consent-gate')).toBeNull()
    // Even on the photo path, a pet-only book never shows the consent gate.
    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    expect(screen.queryByTestId('consent-gate')).toBeNull()
    await waitFor(() => expect(screen.getByText(/Pet-only books are written for grown-ups/)).toBeTruthy())
    expect(screen.queryByText('Age Group')).toBeNull()
    expect(screen.queryByText('Reading Level (GRL)')).toBeNull()
    expect(screen.getByTestId('char-manager').getAttribute('data-default-kind')).toBe('pet')
    expect(screen.getByTestId('char-manager').getAttribute('data-show-kind-selector')).toBe('false')
  })

  it('keeps the consent gate and age controls for child + pet books, with the kind selector on', async () => {
    render(<CreatePage />)

    fireEvent.click(screen.getByRole('button', { name: /child \+ pet/i }))

    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    expect(screen.getByTestId('consent-gate')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('Age Group')).toBeTruthy())
    expect(screen.getByText('Reading Level (GRL)')).toBeTruthy()
    expect(screen.getByTestId('char-manager').getAttribute('data-default-kind')).toBe('child')
    expect(screen.getByTestId('char-manager').getAttribute('data-show-kind-selector')).toBe('true')
  })

  it('preselects the pet flow from ?type=pet', () => {
    window.history.pushState({}, '', '/create?type=pet')
    render(<CreatePage />)

    expect(screen.queryByTestId('consent-gate')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    expect(screen.queryByTestId('consent-gate')).toBeNull()
    expect(screen.getByTestId('char-manager').getAttribute('data-default-kind')).toBe('pet')
  })

  it('preselects the child + pet flow from ?type=child-pet', () => {
    window.history.pushState({}, '', '/create?type=child-pet')
    render(<CreatePage />)

    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    expect(screen.getByTestId('consent-gate')).toBeTruthy()
    expect(screen.getByTestId('char-manager').getAttribute('data-show-kind-selector')).toBe('true')
  })

  it('ignores an unknown ?type= value and stays on the child flow', () => {
    window.history.pushState({}, '', '/create?type=dragon')
    render(<CreatePage />)

    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    expect(screen.getByTestId('consent-gate')).toBeTruthy()
    expect(screen.getByTestId('char-manager').getAttribute('data-default-kind')).toBe('child')
  })
})
