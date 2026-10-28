import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSql } = vi.hoisted(() => ({ mockSql: vi.fn() }))

vi.mock('@/lib/neon', () => ({ sql: mockSql }))

import { GET } from './route'

describe('GET /api/health', () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  it('reports ok when every required column exists', async () => {
    mockSql.mockResolvedValue([
      { table_name: 'bookbunny_users', column_name: 'allowance_rollover' },
      { table_name: 'bookbunny_users', column_name: 'billing_cycle' },
      { table_name: 'bookbunny_users', column_name: 'monthly_allowance_remaining' },
      { table_name: 'stories', column_name: 'outline' },
      { table_name: 'stories', column_name: 'level' },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.missing).toEqual([])
  })

  it('names the migration script for each missing column', async () => {
    mockSql.mockResolvedValue([
      { table_name: 'bookbunny_users', column_name: 'billing_cycle' },
    ])

    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.ok).toBe(false)
    const missing = body.missing as { table: string; column: string; fix: string }[]
    expect(missing.map((m) => m.column)).toContain('allowance_rollover')
    for (const m of missing) {
      expect(m.fix).toContain('node scripts/')
    }
  })

  it('never exposes a connection string', async () => {
    mockSql.mockResolvedValue([])
    const res = await GET()
    const raw = JSON.stringify(await res.json())
    expect(raw).not.toContain('postgresql://')
    expect(raw).not.toContain('NEON_DATABASE_URL')
  })

  it('fails closed when the database is unreachable', async () => {
    mockSql.mockRejectedValue(new Error('connection refused'))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })
})
