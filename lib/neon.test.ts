import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as saveBook } from '@/app/api/books/route'
import { POST as startProAnimation } from '@/app/api/animate-pro/route'
import { sql } from '@/lib/neon'

const { neonMock } = vi.hoisted(() => ({
  neonMock: vi.fn(),
}))

vi.mock('@neondatabase/serverless', () => ({
  neon: neonMock,
}))

/** Captured after the route modules finish evaluating, before any test resets the mock. */
const callsDuringImport = neonMock.mock.calls.length

describe('lazy Neon client', () => {
  beforeEach(() => {
    neonMock.mockReset()
  })

  it('does not call neon() while /api/books and /api/animate-pro load', () => {
    expect(typeof saveBook).toBe('function')
    expect(typeof startProAnimation).toBe('function')
    expect(callsDuringImport).toBe(0)
  })

  it('opens the connection with NEON_DATABASE_URL on the first query only', async () => {
    const query = vi.fn(async () => [{ ok: 1 }])
    neonMock.mockReturnValue(query)
    process.env.NEON_DATABASE_URL = 'postgresql://user:pass@ep.neon.tech/db?sslmode=require'

    await expect(sql`select 1`).resolves.toEqual([{ ok: 1 }])
    await sql`select 2`

    expect(neonMock).toHaveBeenCalledTimes(1)
    expect(neonMock).toHaveBeenCalledWith(process.env.NEON_DATABASE_URL)
    expect(query).toHaveBeenCalledTimes(2)
  })
})
