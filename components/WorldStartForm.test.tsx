import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/components/BunnyMascot', () => ({ default: () => null }))
vi.mock('@/components/TurnstileWidget', () => ({ default: () => null }))

import WorldStartForm, { type StartWorld } from './WorldStartForm'

const WORLD: StartWorld = {
  id: 'world-star-farm',
  name: '星星农场',
  ageRange: '3-5',
  theme: '勇敢',
  scene: '云端上的小农场，夜里是深蓝的天空加黄色星光。',
  artStyle: 'soft watercolor',
  characters: [
    { name: '皮皮', role: '南瓜灯', personality: '胆小', catchphrase: '我试试。' },
    { name: '咕咕博士', role: '母鸡发明家', personality: '爱动脑', catchphrase: '让我想想办法。' },
  ],
  moralPool: ['先深呼吸再试一次', '向朋友求助不丢人', '慢一点也能到'],
  forbiddenZones: ['没有真正的坏人'],
  sampleTitle: '皮皮第一次独自守夜',
}

describe('WorldStartForm', () => {
  afterEach(cleanup)

  it('shows the world stage and its official cast', () => {
    render(<WorldStartForm world={WORLD} />)
    expect(screen.getByText('Episode 1 in 星星农场')).toBeTruthy()
    expect(screen.getByText(/云端上的小农场/)).toBeTruthy()
    expect(screen.getByText(/皮皮, 咕咕博士/)).toBeTruthy()
  })

  it('lists every moral in the world pool as a choice', () => {
    render(<WorldStartForm world={WORLD} />)
    for (const moral of WORLD.moralPool) {
      expect(screen.getByText(moral)).toBeTruthy()
    }
  })

  it('keeps generation blocked until a name, consent and verification are in place', () => {
    render(<WorldStartForm world={WORLD} />)
    const button = screen.getByRole('button', { name: /Generate Episode 1/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)

    fireEvent.change(screen.getByPlaceholderText("Your child's first name"), { target: { value: 'Mia' } })
    fireEvent.click(screen.getByRole('checkbox'))
    // Turnstile 被 mock 掉，没有 token → 仍然不能生成
    expect(button.disabled).toBe(true)
  })

  it('states the privacy promise with the child name', () => {
    render(<WorldStartForm world={WORLD} />)
    fireEvent.change(screen.getByPlaceholderText("Your child's first name"), { target: { value: 'Mia' } })
    expect(screen.getByText(/Mia's character is only used in our own books/)).toBeTruthy()
    expect(screen.getByText(/never shared with world authors/)).toBeTruthy()
  })
})
