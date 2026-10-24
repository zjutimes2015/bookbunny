import { NextRequest, NextResponse } from 'next/server'
import { VPC_METHODS, recordConsent } from '@/lib/compliance/consent'
import { sql } from '@/lib/neon'
import { getCreem, isCreemConfigured, VPC_VERIFICATION } from '@/lib/payments/creem'

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

/**
 * Start a verifiable-parental-consent step.
 *
 * A parent cannot upload a child's photograph until this succeeds. Only methods that
 * are actually implemented are accepted; the rest are listed by GET /api/consent so
 * the chooser can explain what is planned rather than silently failing.
 */
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) {
    return NextResponse.json(
      { error: 'Sign in as the parent or guardian before verifying consent' },
      { status: 401 },
    )
  }

  const body = (await req.json().catch(() => ({}))) as { method?: string }
  const method = VPC_METHODS.find((m) => m.id === body.method)
  if (!method || !method.available) {
    return NextResponse.json({ error: 'Unsupported verification method' }, { status: 400 })
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000'

  // Production path: a real, refundable charge on the parent's own card.
  // The consent row is written by the Creem webhook once the charge settles.
  if (isCreemConfigured()) {
    const creem = getCreem()
    const checkout = await creem.checkouts.create({
      productId: VPC_VERIFICATION.productId,
      successUrl: `${siteUrl}/create?vpc=verified`,
      metadata: { purpose: 'vpc', userId, method: method.id },
    })
    return NextResponse.json({ url: checkout.checkoutUrl })
  }

  // Development path: no payment provider configured, so record the consent straight
  // away and mark the reference so simulated rows are obvious in the ledger.
  const record = await recordConsent({
    userId,
    vpcMethod: 'card-charge',
    vpcReference: 'dev-simulated',
    vpcAmountCents: VPC_VERIFICATION.priceCents,
    consentIp: req.headers.get('x-forwarded-for'),
    consentUserAgent: req.headers.get('user-agent'),
  })

  return NextResponse.json({ verified: true, consent: record })
}
