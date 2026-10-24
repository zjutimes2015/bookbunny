import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// next/link 在 jsdom 中无 Router 上下文，替换为普通 <a>
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

import SafetyPage, { metadata } from './page'

describe('SafetyPage (COPPA)', () => {
  it('renders the core safety promise in the hero', () => {
    render(<SafetyPage />)
    expect(screen.getByText('CHILD SAFETY · COPPA ALIGNED')).toBeInTheDocument()
    expect(
      screen.getByText(/never reaches an AI endpoint without verifiable parental consent/i)
    ).toBeInTheDocument()
  })

  it('renders the four non-negotiable commitments', () => {
    render(<SafetyPage />)
    expect(screen.getByText('Four non-negotiable commitments')).toBeInTheDocument()
    expect(screen.getByText('Verifiable parental consent — always first')).toBeInTheDocument()
    expect(screen.getByText('Data minimization by design')).toBeInTheDocument()
    expect(screen.getByText('A consent record you can request')).toBeInTheDocument()
    expect(screen.getByText('No photo — still make a book')).toBeInTheDocument()
  })

  it('renders all four consent flow steps', () => {
    render(<SafetyPage />)
    expect(screen.getByText('Parent initiates consent')).toBeInTheDocument()
    expect(screen.getByText('Verified consent stored securely')).toBeInTheDocument()
    expect(screen.getByText('Processing proceeds only after confirmation')).toBeInTheDocument()
    expect(screen.getByText('Withdraw anytime')).toBeInTheDocument()
  })

  it('links the primary CTA to /create', () => {
    render(<SafetyPage />)
    const cta = screen.getByRole('link', { name: /start a safe picture book/i })
    expect(cta).toHaveAttribute('href', '/create')
  })

  it('links the audit request CTA to a mailto address', () => {
    render(<SafetyPage />)
    const audit = screen.getByRole('link', { name: /request an audit report/i })
    expect(audit.getAttribute('href')).toMatch(/^mailto:/)
  })

  it('links to privacy policy and terms', () => {
    render(<SafetyPage />)
    expect(screen.getByRole('link', { name: /read our full privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy'
    )
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms')
  })

  it('renders the comparison table with our consent advantage', () => {
    render(<SafetyPage />)
    expect(screen.getByText('How we compare')).toBeInTheDocument()
    expect(
      screen.getByText(/Verifiable parental consent before any child image processing/i)
    ).toBeInTheDocument()
    expect(screen.getByText('✓ Built in')).toBeInTheDocument()
  })

  it('ships COPPA-oriented SEO metadata', () => {
    expect(metadata.title).toMatch(/COPPA/i)
    expect(metadata.description).toMatch(/verifiable parental consent/i)
    expect(metadata.alternates?.canonical).toContain('/safety')
  })
})
