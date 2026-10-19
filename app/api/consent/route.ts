import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  CONSENT_PURPOSES,
  VPC_METHODS,
  getActiveConsent,
  revokeConsent,
} from '@/lib/compliance/consent'
import { POLICY_VERSION } from '@/lib/site'

const sql = neon(process.env.NEON_DATABASE_URL!)

// Same cookie session lookup used by /api/auth/me and /api/books.
async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const result = await sql`
      SELECT u.id
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    return result[0]?.id || null
  } catch {
    return null
  }
}

/** Consent status for the signed-in parent. Drives the consent notice in the UI. */
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  const consent = userId ? await getActiveConsent(userId) : null
  const current = !!consent && consent.policyVersion === POLICY_VERSION

  return NextResponse.json({
    authenticated: !!userId,
    policyVersion: POLICY_VERSION,
    purposes: CONSENT_PURPOSES,
    methods: VPC_METHODS,
    consent,
    /** True when this parent may upload a child's photograph right now. */
    photoAllowed:
      current && !!consent?.purposes.includes('photo-processing'),
  })
}

/**
 * Withdraw consent. Pass `?include_content=1` to also delete the books and stories
 * we generated for this parent.
 */
export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  await revokeConsent(userId, 'parent-request')

  const includeContent = new URL(req.url).searchParams.get('include_content') === '1'
  if (!includeContent) {
    return NextResponse.json({ withdrawn: true, deletedBooks: 0 })
  }

  const owned = await sql`
    SELECT story_id FROM books WHERE user_id = ${userId} AND story_id IS NOT NULL
  `
  const storyIds = owned.map((row) => row.story_id).filter(Boolean) as string[]

  const deleted = await sql`DELETE FROM books WHERE user_id = ${userId} RETURNING id`

  if (storyIds.length > 0) {
    await sql`DELETE FROM stories WHERE id = ANY(${storyIds})`
  }

  return NextResponse.json({ withdrawn: true, deletedBooks: deleted.length })
}
