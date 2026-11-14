import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'

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
import { readPricingGates, isGateOn } from './gates'
import { REFUND_WINDOW_DAYS } from '@/lib/site'

// Gate env vars: tests toggle them per case; save/restore around every test so
// the gate-OFF cases always see the unset default.
const GATE_ENV_KEYS = [
  'NEXT_PUBLIC_ANNUAL_BILLING_ENABLED',
  'NEXT_PUBLIC_BOOK_PACKS_ENABLED',
] as const
let savedGateEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedGateEnv = {}
  for (const key of GATE_ENV_KEYS) {
    savedGateEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of GATE_ENV_KEYS) {
    if (savedGateEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedGateEnv[key]
  }
})

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

describe('pricing gates', () => {
  it('isGateOn only accepts the exact string "true"', () => {
    expect(isGateOn('true')).toBe(true)
    expect(isGateOn(undefined)).toBe(false)
    expect(isGateOn('')).toBe(false)
    expect(isGateOn('false')).toBe(false)
    expect(isGateOn('1')).toBe(false)
    expect(isGateOn('TRUE')).toBe(false)
  })

  it('readPricingGates defaults both gates off when unset', () => {
    expect(readPricingGates({})).toEqual({ annualBilling50: false, bookPacks: false })
  })

  it('readPricingGates reads each gate independently', () => {
    expect(readPricingGates({ annualBillingEnabled: 'true' })).toEqual({
      annualBilling50: true,
      bookPacks: false,
    })
    expect(readPricingGates({ bookPacksEnabled: 'true' })).toEqual({
      annualBilling50: false,
      bookPacks: true,
    })
  })
})

describe('PricingPage gates OFF (default)', () => {
  it("renders today's page: monthly default, 25% annual badge, no book packs", () => {
    render(<PricingPage />)
    expect(screen.getByText('Save up to 25%')).toBeInTheDocument()
    expect(screen.queryByText('Save 50%')).not.toBeInTheDocument()
    // Monthly is the default selection.
    expect(screen.getByText('$29')).toBeInTheDocument()
    expect(screen.queryByText(/\/mo · \$261\/year/)).not.toBeInTheDocument()
    expect(screen.queryByText('Book packs')).not.toBeInTheDocument()
    expect(screen.queryByText('Single book')).not.toBeInTheDocument()
  })

  it('shows the existing 25% annual totals after switching to Annual', () => {
    render(<PricingPage />)
    fireEvent.click(screen.getByRole('button', { name: /Annual/ }))
    expect(screen.getByText(/\/mo · \$261\/year/)).toBeInTheDocument()
    expect(screen.getByText(/\/mo · \$711\/year/)).toBeInTheDocument()
    expect(screen.getByText(/\/mo · \$891\/year/)).toBeInTheDocument()
    expect(screen.getByText('$87 saved per year')).toBeInTheDocument()
    // Annual checkout stays available: the existing 25% products are the live ones.
    expect(screen.getByRole('button', { name: 'Choose Creator' })).toBeEnabled()
  })

  it('states the existing annual totals in the cost FAQ', () => {
    render(<PricingPage />)
    expect(screen.getByText(/or \$261\/year/)).toBeInTheDocument()
    expect(screen.queryByText(/or \$174\/year/)).not.toBeInTheDocument()
  })
})

describe('PricingPage annual gate ON', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ANNUAL_BILLING_ENABLED = 'true'
  })

  it('defaults to Yearly with 50% prices computed from the monthly prices', () => {
    render(<PricingPage />)
    expect(screen.getByText('Save 50%')).toBeInTheDocument()
    expect(screen.getByText(/\/mo · \$174\/year/)).toBeInTheDocument()
    expect(screen.getByText(/\/mo · \$474\/year/)).toBeInTheDocument()
    expect(screen.getByText(/\/mo · \$594\/year/)).toBeInTheDocument()
    // Per-month equivalents: monthly x 0.5.
    expect(screen.getByText('$14.50')).toBeInTheDocument()
    expect(screen.getByText('$39.50')).toBeInTheDocument()
    expect(screen.getByText('$49.50')).toBeInTheDocument()
    expect(screen.getByText('$174 saved per year')).toBeInTheDocument()
  })

  it('disables annual checkout while the 50% products do not exist', () => {
    render(<PricingPage />)
    const comingSoon = screen.getAllByRole('button', { name: 'Coming soon' })
    expect(comingSoon.length).toBe(3) // Creator, Studio, Teacher
    for (const button of comingSoon) expect(button).toBeDisabled()
    expect(
      screen.getAllByText(/New 50%-off annual billing is coming soon/i).length,
    ).toBe(3)
  })

  it('keeps monthly checkout available when switching back to Monthly', () => {
    render(<PricingPage />)
    fireEvent.click(screen.getByRole('button', { name: /Monthly/ }))
    expect(screen.getByRole('button', { name: 'Choose Creator' })).toBeEnabled()
    expect(
      screen.queryByText(/New 50%-off annual billing is coming soon/i),
    ).not.toBeInTheDocument()
  })

  it('states the 50% annual totals in the cost FAQ', () => {
    render(<PricingPage />)
    expect(screen.getByText(/or \$174\/year/)).toBeInTheDocument()
    expect(screen.queryByText(/or \$261\/year/)).not.toBeInTheDocument()
  })
})

describe('PricingPage book-pack gate', () => {
  it('shows coming-soon pack cards with no prices when the gate is on', () => {
    process.env.NEXT_PUBLIC_BOOK_PACKS_ENABLED = 'true'
    render(<PricingPage />)
    expect(screen.getByText('Book packs')).toBeInTheDocument()
    expect(screen.getByText('Single book')).toBeInTheDocument()
    expect(screen.getByText('3-book pack')).toBeInTheDocument()
    expect(screen.getByText(/pricing is not final/i)).toBeInTheDocument()
    // No checkout: both pack buttons are disabled "Coming soon" buttons.
    // (Annual gate is off, so no plan button shows "Coming soon" here.)
    const comingSoon = screen.getAllByRole('button', { name: 'Coming soon' })
    expect(comingSoon.length).toBe(2)
    for (const button of comingSoon) expect(button).toBeDisabled()
  })
})

describe('PricingPage rights ladder', () => {
  it('is always visible and states only the verified export behavior', () => {
    render(<PricingPage />)
    expect(
      screen.getByRole('heading', { name: 'What you can do with your books' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Read your books in the app.')).toBeInTheDocument()
    expect(screen.getByText('Export a watermarked preview PDF.')).toBeInTheDocument()
    expect(screen.getByText('PDF export with no watermark.')).toBeInTheDocument()
    expect(
      screen.getByText('KDP interior + full cover PDFs, ready for Amazon KDP.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Commercial license included.')).toBeInTheDocument()
  })

  it('stays visible when the annual gate is on', () => {
    process.env.NEXT_PUBLIC_ANNUAL_BILLING_ENABLED = 'true'
    render(<PricingPage />)
    expect(
      screen.getByRole('heading', { name: 'What you can do with your books' }),
    ).toBeInTheDocument()
  })
})
