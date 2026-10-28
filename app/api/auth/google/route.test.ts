import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(next?: string): NextRequest {
  const url = next
    ? `http://localhost/api/auth/google?next=${encodeURIComponent(next)}`
    : 'http://localhost/api/auth/google'
  return new NextRequest(url)
}

describe('GET /api/auth/google', () => {
  const ORIGINAL_ID = process.env.GOOGLE_CLIENT_ID
  const ORIGINAL_SITE = process.env.SITE_URL

  beforeEach(() => {
    vi.resetModules()
    process.env.GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'
    process.env.SITE_URL = 'https://sprouttales.com'
  })

  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = ORIGINAL_ID
    process.env.SITE_URL = ORIGINAL_SITE
  })

  it('redirects to Google with the configured client id', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest())
    const location = res.headers.get('location') || ''
    expect(location).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(location).toContain('client_id=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com')
    expect(location).toContain(encodeURIComponent('https://sprouttales.com/api/auth/callback'))
  })

  it('carries the next target through as state', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest('/pricing'))
    expect(res.headers.get('location')).toContain('state=%2Fpricing')
  })

  it('drops an off-site next target', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest('https://evil.example/steal'))
    expect(res.headers.get('location')).not.toContain('state=')
  })

  it('redirects back to the site instead of Google when the client id is missing', async () => {
    process.env.GOOGLE_CLIENT_ID = ''
    const { GET } = await import('./route')
    const res = await GET(makeRequest())
    const location = res.headers.get('location') || ''
    expect(location).not.toContain('accounts.google.com')
    expect(location).toContain('error=oauth_not_configured')
  })

  it('keeps the next target when falling back to the site', async () => {
    process.env.GOOGLE_CLIENT_ID = ''
    const { GET } = await import('./route')
    const res = await GET(makeRequest('/pricing'))
    const location = res.headers.get('location') || ''
    expect(location).toContain('error=oauth_not_configured')
    expect(location).toContain('/pricing')
  })
})
