import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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

import TermsPage from './page'

describe('TermsPage prohibited content', () => {
  it('prohibits NCII in its own clause, separate from deepfakes', () => {
    render(<TermsPage />)

    const items = screen.getAllByRole('listitem')
    const ncii = items.find((el) => /non-consensual intimate imagery \(NCII\)/i.test(el.textContent || ''))
    const deepfake = items.find((el) => /deepfakes and impersonation/i.test(el.textContent || ''))

    expect(ncii).toBeTruthy()
    expect(deepfake).toBeTruthy()
    expect(ncii).not.toBe(deepfake)
    expect(ncii?.textContent).toMatch(/private intimate images/i)
    expect(ncii?.textContent).toMatch(/synthetic or AI-generated intimate images/i)
    expect(ncii?.textContent).toMatch(/without that person's consent/i)
    expect(ncii?.textContent).not.toMatch(/deepfake/i)
    expect(deepfake?.textContent).not.toMatch(/non-consensual intimate imagery/i)
    expect(deepfake?.textContent).toMatch(/deceive others/i)
  })
})

describe('TermsPage refunds', () => {
  it('states eligibility, the time limit, the request path, and consumed credits', () => {
    render(<TermsPage />)

    const refundLinks = screen.getAllByRole('link', { name: 'Refund Policy' })
    expect(refundLinks.length).toBeGreaterThan(0)
    for (const link of refundLinks) {
      expect(link).toHaveAttribute('href', '/refunds')
    }
    expect(screen.getByRole('heading', { name: /Refund eligibility and time limit/ })).toBeInTheDocument()
    expect(screen.getByText(/within 30 days of the charge date/i)).toBeInTheDocument()
    expect(screen.getByText(/none of the credits in that pack have been used/i)).toBeInTheDocument()
    expect(
      screen.getByText(/a book that has already been generated is not refundable/i),
    ).toBeInTheDocument()
    const refundMail = screen
      .getAllByRole('link', { name: 'privacy@sprouttales.com' })
      .some((el) => el.getAttribute('href') === 'mailto:privacy@sprouttales.com?subject=Refund%20request')
    expect(refundMail).toBe(true)
    expect(
      screen.getAllByText(/subject line/i).some((el) => /Refund request/.test(el.textContent || '')),
    ).toBe(true)
  })
})
