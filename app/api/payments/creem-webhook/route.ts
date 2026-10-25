import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { VPC_METHODS, recordConsent, type VpcMethodId } from '@/lib/compliance/consent'
import { VPC_VERIFICATION } from '@/lib/payments/creem'

/**
 * Creem is used for exactly one thing in this product: the small card charge that
 * verifies a parent's identity before a child's photograph is accepted (VPC).
 * Subscriptions are sold through Waffo, so this handler never grants a plan and
 * never writes a payment row.
 *
 * Fail closed: without a configured secret we cannot tell a genuine event from a
 * forged one, so nothing is processed.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('creem-signature') || req.headers.get('x-creem-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const computed = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  const sigBuf = Buffer.from(signature)
  const compBuf = Buffer.from(computed)
  if (sigBuf.length !== compBuf.length || !crypto.timingSafeEqual(sigBuf, compBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)
    const obj = event?.object || {}
    const checkout = obj.checkout || obj
    const metadata = checkout.metadata || {}

    // Every other event type is ignored on purpose: plans are granted by Waffo.
    if (event.eventType !== 'checkout.completed' || metadata.purpose !== 'vpc') {
      return NextResponse.json({ received: true, ignored: true })
    }

    const userId = metadata.userId as string
    if (!userId) return NextResponse.json({ received: true, ignored: true })

    const rawMethod = metadata.method as string
    const vpcMethod: VpcMethodId = VPC_METHODS.some((m) => m.id === rawMethod)
      ? (rawMethod as VpcMethodId)
      : 'card-charge'

    await recordConsent({
      userId,
      vpcMethod,
      vpcReference: (obj.order?.id || obj.id || null) as string | null,
      vpcAmountCents: obj.order?.amount ?? VPC_VERIFICATION.priceCents,
      consentUserAgent: 'creem-webhook',
    })
    console.log(`✅ Parental consent verified for ${userId}`)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Creem VPC webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
