import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { COMMISSION_HOLD_DAYS } from '@/lib/affiliate'
import { REFUND_WINDOW_DAYS } from '@/lib/site'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname?: string }
    children: React.ReactNode
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}))

import RefundsPage from './page'
import Footer from '@/components/Footer'

describe('RefundsPage', () => {
  it('keeps the public window aligned with the affiliate commission hold', () => {
    expect(REFUND_WINDOW_DAYS).toBe(COMMISSION_HOLD_DAYS)
    expect(REFUND_WINDOW_DAYS).toBe(30)
  })

  it('publishes eligibility, the time limit, the request path, and consumed credits', () => {
    render(<RefundsPage />)

    expect(screen.getByRole('heading', { name: /refund policy/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Refund eligibility and time limit/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Consumed credits and generated books/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /How to request a refund/ })).toBeInTheDocument()
    expect(screen.getByText(/within 30 days of the charge date/i)).toBeInTheDocument()
    expect(screen.getByText(/none of the credits in that pack have been used/i)).toBeInTheDocument()
    expect(
      screen.getByText(/a book that has already been generated is not refundable/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/a credit that has already been used is not refundable/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'privacy@sprouttales.com' }).length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('link', { name: 'Terms of Service' }).some((el) => el.getAttribute('href') === '/terms'),
    ).toBe(true)
  })
})

describe('Footer legal links', () => {
  it('links to the refund policy', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Refund Policy' })).toHaveAttribute('href', '/refunds')
  })
})
