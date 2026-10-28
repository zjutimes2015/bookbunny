import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BUDDY_DRAFT_KEY, BUDDY_SIGN_IN_PATH } from '@/lib/assistant/draft'

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null, loading: false, login: vi.fn(), logout: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/components/TurnstileWidget', () => ({ default: () => null }))

import StoryBuddy from './StoryBuddy'

describe('StoryBuddy', () => {
  afterEach(() => {
    cleanup()
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('opens with Kai’s own greeting', () => {
    render(<StoryBuddy />)
    fireEvent.click(screen.getByRole('button', { name: /Kai/ }))
    expect(screen.getByText(/I’m Kai/)).toBeTruthy()
  })

  it('shows a confirmation card and keeps it for sign-in', async () => {
    const hrefs: string[] = []
    vi.stubGlobal('location', {
      ...window.location,
      set href(value: string) { hrefs.push(value) },
      get href() { return hrefs.at(-1) ?? 'http://localhost/buddy' },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      reply: 'Ready: “dinosaurs” for Mia. Press “Make this book”.',
      brief: {
        childName: 'Mia',
        ageGroup: '5-7',
        theme: 'dinosaurs',
        level: 'C',
        pages: 8,
      },
      proposal: {
        childName: 'Mia',
        ageGroup: '5-7',
        theme: 'dinosaurs',
        level: 'C',
        pages: 8,
        costUnits: 1,
        levelLabel: 'C · Early',
        capped: false,
      },
      signedIn: false,
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    render(<StoryBuddy />)
    fireEvent.click(screen.getByRole('button', { name: /Lila/ }))
    fireEvent.change(screen.getByLabelText(/Message Lila/), {
      target: { value: 'Make an 8-page GRL C book about dinosaurs for Mia, age 6.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText(/Mia · 8 pages/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to make this book' }))

    expect(hrefs).toContain(BUDDY_SIGN_IN_PATH)
    const saved = JSON.parse(sessionStorage.getItem(BUDDY_DRAFT_KEY) || '{}')
    expect(saved.personaId).toBe('lila')
    expect(saved.proposal.childName).toBe('Mia')
  })

  it('restores the confirmation after login returns', () => {
    sessionStorage.setItem(BUDDY_DRAFT_KEY, JSON.stringify({
      personaId: 'kai',
      messages: [{ id: 'hello', role: 'buddy', text: 'Still here.' }],
      brief: { childName: 'Mia', ageGroup: '5-7', theme: 'dinosaurs', level: 'C', pages: 8 },
      proposal: {
        childName: 'Mia',
        ageGroup: '5-7',
        theme: 'dinosaurs',
        level: 'C',
        pages: 8,
        costUnits: 1,
        levelLabel: 'C · Early',
        capped: false,
      },
    }))
    render(<StoryBuddy />)
    expect(screen.getByText('Still here.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign in to make this book' })).toBeTruthy()
  })
})
