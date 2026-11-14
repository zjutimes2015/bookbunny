import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

// --- Mock auth context ---
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', subscriptionTier: 'free', credits: 5 } }),
}))

// --- Mock heavy child components ---
vi.mock('@/components/BunnyMascot', () => ({ default: () => null }))
vi.mock('@/components/ParentalConsentGate', () => ({ default: () => <div data-testid="consent-gate" /> }))

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

// MultiCharacterManager: auto-add one character so the generate button is enabled
vi.mock('@/components/MultiCharacterManager', () => ({
  default: ({ onAdd }: { onAdd: (name: string) => void }) => {
    if (typeof window !== 'undefined') {
      // 延后于人机校验 token 就绪，避免角色创建因人机门槛被拒
      setTimeout(() => onAdd('Luna'), 150)
    }
    return <div data-testid="char-manager" />
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

// --- Mock fetch for API calls ---
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import CreatePage from './page'

function makeStoryResponse() {
  return {
    title: 'Luna and the Moon',
    level: 'C',
    levelLabel: 'Level C',
    outline: [
      { pageNumber: 0, pageFunction: 'cover', pageText: '' },
      { pageNumber: 1, pageFunction: 'body', pageText: 'Once upon a time, Luna the rabbit looked up at the moon.' },
      { pageNumber: 2, pageFunction: 'body', pageText: 'She wanted to visit the shiny silver orb in the sky.' },
      { pageNumber: 3, pageFunction: 'body', pageText: '' },
    ],
  }
}

describe('CreatePage — audio narration & comic export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()

    // Default fetch responses
    mockFetch.mockImplementation(async (url: string, opts?: any) => {
      if (url === '/api/verify-turnstile') {
        return { ok: true, json: async () => ({ success: true }) }
      }
      if (url === '/api/create-character') {
        return { ok: true, json: async () => ({ card: { name: 'Luna' }, consistencyLine: '', imageB64: '', refSeed: 1 }) }
      }
      if (url === '/api/create-story') {
        return { ok: true, json: async () => makeStoryResponse() }
      }
      if (url === '/api/books') {
        return { ok: true, json: async () => ({ bookId: 'b1', storyId: 's1' }) }
      }
      if (url === '/api/generate-pages' && (!opts || opts.method !== 'GET')) {
        return { ok: true, json: async () => ({ genId: 'g1' }) }
      }
      if (typeof url === 'string' && url.startsWith('/api/generate-pages?')) {
        return { ok: true, json: async () => ({ status: 'done', pages: [] }) }
      }
      return { ok: true, json: async () => ({}) }
    })

    // Reset speechSynthesis mock
    ;(window.speechSynthesis.speak as any).mockClear?.()
    ;(window.speechSynthesis.cancel as any).mockClear?.()
  })

  it('renders the setup step by default', async () => {
    render(<CreatePage />)
    // Generate button appears once a character is added (mock auto-adds
    // after a 150ms timer, then the human-pass exchange + re-render).
    // That chain measures ~1s under contention on main too, so the
    // default 1s waitFor budget flakes; wait up to 5s for the same assertion.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate outline/i })).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('calls speechSynthesis.speak when Listen is clicked', async () => {
    render(<CreatePage />)

    // Enter a theme first
    const themeInput = await waitFor(() => screen.getByTestId('theme-input')) as HTMLInputElement
    fireEvent.change(themeInput, { target: { value: 'A magical forest' } })

    // Wait for character to be added (mock auto-adds) and button to enable
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /generate outline/i })
      expect(btn).not.toBeDisabled()
    })

    // Click Generate Outline
    fireEvent.click(screen.getByRole('button', { name: /generate outline/i }))

    // Wait for outline step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start illustrating/i })).toBeInTheDocument()
    })

    // Click Start Illustrating to reach illustrate step
    fireEvent.click(screen.getByRole('button', { name: /start illustrating/i }))

    // Wait for Listen button (trial poll runs on a 1.5s interval)
    const listenBtn = await waitFor(() => screen.getByRole('button', { name: /listen/i }), { timeout: 8000 })
    fireEvent.click(listenBtn)

    // speechSynthesis.speak should have been called for each body page with text
    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalled()
    })

    // Pages 1 and 2 have text, page 3 is empty (skipped), cover has no text
    // So speak should be called twice
    expect((window.speechSynthesis.speak as any).mock.calls.length).toBe(2)
  }, 20000)

  it('cancels previous speech synthesis before speaking', async () => {
    render(<CreatePage />)

    const themeInput = await waitFor(() => screen.getByTestId('theme-input')) as HTMLInputElement
    fireEvent.change(themeInput, { target: { value: 'A magical forest' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate outline/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /generate outline/i }))

    await waitFor(() => screen.getByRole('button', { name: /start illustrating/i }))
    fireEvent.click(screen.getByRole('button', { name: /start illustrating/i }))

    const listenBtn = await waitFor(() => screen.getByRole('button', { name: /listen/i }), { timeout: 8000 })
    fireEvent.click(listenBtn)

    await waitFor(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalled()
    })

    // handleListen calls cancel() before speaking
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  }, 20000)
})

describe('CreatePage — English learner (ELL) mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()

    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/verify-turnstile') {
        return { ok: true, json: async () => ({ success: true }) }
      }
      if (url === '/api/create-character') {
        return { ok: true, json: async () => ({ card: { name: 'Luna' }, consistencyLine: '', imageB64: '', refSeed: 1 }) }
      }
      if (url === '/api/create-story') {
        return { ok: true, json: async () => makeStoryResponse() }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  it('shows the ELL toggle once a character exists', async () => {
    render(<CreatePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate outline/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/English learner mode/i)).toBeInTheDocument()
  })

  it('sends the ELL payload and forces English when enabled', async () => {
    render(<CreatePage />)

    const themeInput = await waitFor(() => screen.getByTestId('theme-input')) as HTMLInputElement
    fireEvent.change(themeInput, { target: { value: 'A magical forest' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate outline/i })).not.toBeDisabled()
    })

    const toggle = screen.getByRole('checkbox') as HTMLInputElement
    fireEvent.click(toggle)
    await waitFor(() => expect(toggle.checked).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: /generate outline/i }))

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(([url]) => url === '/api/create-story')
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.ell).toMatchObject({ enabled: true, support: 'full' })
      expect(body.language).toBe('en')
    })
  }, 20000)

  it('does not send an ELL payload when the toggle is off', async () => {
    render(<CreatePage />)

    const themeInput = await waitFor(() => screen.getByTestId('theme-input')) as HTMLInputElement
    fireEvent.change(themeInput, { target: { value: 'A magical forest' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate outline/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /generate outline/i }))

    await waitFor(() => {
      const call = mockFetch.mock.calls.find(([url]) => url === '/api/create-story')
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body.ell).toBeUndefined()
    })
  }, 20000)
})

describe('CreatePage — character path order & consent gate timing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/api/verify-turnstile') {
        return { ok: true, json: async () => ({ success: true }) }
      }
      if (url === '/api/create-character') {
        return { ok: true, json: async () => ({ card: { name: 'Luna' }, consistencyLine: '', imageB64: '', refSeed: 1 }) }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  it('offers the free describe path first and selected by default', () => {
    render(<CreatePage />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveTextContent(/Describe your character/i)
    expect(radios[1]).toHaveTextContent(/Use a photo/i)
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('does not render the consent gate before the user opts into photos', () => {
    render(<CreatePage />)
    expect(screen.queryByTestId('consent-gate')).not.toBeInTheDocument()
  })

  it('renders the consent gate only after the photo path is chosen, and hides it again on switching back', async () => {
    render(<CreatePage />)

    fireEvent.click(screen.getByRole('radio', { name: /Use a photo/i }))
    await waitFor(() => {
      expect(screen.getByTestId('consent-gate')).toBeInTheDocument()
    })
    expect(screen.getByRole('radio', { name: /Use a photo/i })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: /Describe your character/i }))
    await waitFor(() => {
      expect(screen.queryByTestId('consent-gate')).not.toBeInTheDocument()
    })
  })
})
