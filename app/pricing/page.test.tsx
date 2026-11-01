import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

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

import PricingPage from './page'
import { REFUND_WINDOW_DAYS } from '@/lib/site'

describe('PricingPage refund policy', () => {
  it('publishes the refund rules at the point of purchase', () => {
    render(<PricingPage />)

    // The review asked for the refund policy to be visible on the pricing page,
    // not only inside the Terms.
    const heading = screen.getByRole('heading', { name: 'Refunds' })
    expect(heading).toBeInTheDocument()

    // Scope to the Refunds card: the FAQ answer repeats the same sentences,
    // so an unscoped getByText would match twice.
    const card = heading.closest('div.apple-card') as HTMLElement
    expect(card).toBeTruthy()

    expect(
      within(card).getByText(
        new RegExp(`within ${REFUND_WINDOW_DAYS} days of the charge date`, 'i'),
      ),
    ).toBeInTheDocument()
    expect(within(card).getByText(/none of its credits have been used/i)).toBeInTheDocument()
    expect(within(card).getByText(/not refundable/i)).toBeInTheDocument()
    expect(within(card).getByText(/do not\s+issue partial cash refunds/i)).toBeInTheDocument()
    expect(
      within(card).getByRole('link', { name: /read the full refund policy/i }),
    ).toHaveAttribute('href', '/refunds')
    expect(within(card).getByText(/Cancel anytime/i)).toBeInTheDocument()
  })

  it('links to the full refund policy page', () => {
    render(<PricingPage />)
    const links = screen.getAllByRole('link', { name: /read the full refund policy/i })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/refunds')
    }
  })

  it('answers the refund question in the pricing FAQ so search engines can quote it', () => {
    render(<PricingPage />)
    expect(screen.getByText(/What is your refund policy\?/i)).toBeInTheDocument()
    expect(screen.getByText(/used credits and books that have already been generated are not refundable/i)).toBeInTheDocument()
    expect(screen.getByText(/Refund request/i)).toBeInTheDocument()
  })

  it('still states that cancellation is available', () => {
    render(<PricingPage />)
    expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument()
  })
})
