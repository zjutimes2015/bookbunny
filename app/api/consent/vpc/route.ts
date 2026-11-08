import { NextRequest, NextResponse } from 'next/server'
import { VPC_METHODS, recordConsent, type VpcMethodId } from '@/lib/compliance/consent'
import { sql } from '@/lib/neon'
import { getWaffo, getPlan, isWaffoConfigured, VPC_PRICE_CENTS } from '@/lib/payments/waffo'

async function getUser(req: NextRequest): Promise<{ id: string; email: string | null } | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const result = await sql`
      SELECT u.id, u.email
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    const row = result[0]
    return row ? { id: row.id as string, email: (row.email as string | null) ?? null } : null
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
 *
 * The $1.00 card charge runs through Waffo (the same provider as subscriptions):
 * the checkout carries metadata { plan: 'vpc_verification', userId, method }, and
 * the Waffo webhook records the consent once the charge settles. Waffo takes a
 * $0.50 fixed fee per transaction, so $0.50 would lose money — $1.00 is the floor.
 */
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) {
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
  const vpcPlan = getPlan('vpc_verification')

  // Production path: a real $1.00 charge on the parent's own card.
  // The consent row is written by the Waffo webhook once the charge settles.
  if (isWaffoConfigured() && vpcPlan?.productId) {
    const result = await getWaffo().checkout.authenticated.create({
      productId: vpcPlan.productId,
      currency: vpcPlan.currency,
      buyerIdentity: user.id,
      buyerEmail: user.email || undefined,
      metadata: {
        plan: 'vpc_verification',
        tier: 'vpc',
        userId: user.id,
        method: method.id,
        purpose: 'vpc',
      },
      successUrl: `${siteUrl}/create?vpc=verified`,
    })
    return NextResponse.json({ url: result.checkoutUrl })
  }

  // No payment provider configured. In production this must fail closed: a consent
  // record is a legal authorisation to process a child's photograph, so it can only
  // be written after the parent actually cleared a verification step.
  if (process.env.NODE_ENV === 'production') {
    if (!isWaffoConfigured()) {
      console.error('VPC requested but WAFFO_MERCHANT_ID/WAFFO_PRIVATE_KEY are missing')
    } else {
      console.error('VPC requested but WAFFO_VPC_PRODUCT_ID is not configured')
    }
    return NextResponse.json(
      {
        error:
          'Photo verification is unavailable right now. You can still create a book without a photograph.',
        code: 'vpc_unavailable',
      },
      { status: 503 },
    )
  }

  // Development path: no payment provider configured, so record the consent straight
  // away and mark the reference so simulated rows are obvious in the ledger.
  const record = await recordConsent({
    userId: user.id,
    vpcMethod: method.id as VpcMethodId,
    vpcReference: 'dev-simulated',
    vpcAmountCents: VPC_PRICE_CENTS,
    consentIp: req.headers.get('x-forwarded-for'),
    consentUserAgent: req.headers.get('user-agent'),
  })

  return NextResponse.json({ verified: true, consent: record })
}
