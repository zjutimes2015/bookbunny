import { NextRequest, NextResponse } from 'next/server'
import {
  CONSENT_PURPOSES,
  VPC_METHODS,
  getActiveConsent,
  revokeConsent,
} from '@/lib/compliance/consent'
import { deleteFiles, keyFromAssetUrl } from '@/lib/r2'
import { isCreemConfigured } from '@/lib/payments/creem'
import { sql } from '@/lib/neon'
import { POLICY_VERSION } from '@/lib/site'

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
    /** True when a new verification can actually be started in this environment. */
    vpcAvailable: isCreemConfigured() || process.env.NODE_ENV !== 'production',
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
    SELECT id, story_id, page_image_urls
    FROM books
    WHERE user_id = ${userId}
  `
  const storyIds = owned.map((row) => row.story_id).filter(Boolean) as string[]

  // 先删对象存储里的插画，再删数据库记录：顺序反了就拿不到 key 了
  const assetKeys: string[] = []
  for (const row of owned) {
    const urls = (row.page_image_urls || []) as string[]
    for (const url of urls) {
      const key = keyFromAssetUrl(url)
      if (key) assetKeys.push(key)
    }
  }
  const deletedImages = await deleteFiles(assetKeys)

  const deleted = await sql`DELETE FROM books WHERE user_id = ${userId} RETURNING id`

  if (storyIds.length > 0) {
    await sql`DELETE FROM stories WHERE id = ANY(${storyIds})`
  }

  return NextResponse.json({ withdrawn: true, deletedBooks: deleted.length, deletedImages })
}
