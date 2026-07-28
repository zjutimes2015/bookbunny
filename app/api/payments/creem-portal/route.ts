import { NextRequest, NextResponse } from 'next/server'
import { getCreem, isCreemConfigured } from '@/lib/payments/creem'

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()

    if (!isCreemConfigured()) {
      return NextResponse.json({ url: '/pricing' })
    }

    const creem = getCreem()
    const portal = await creem.customers.generateBillingLinks({
      customerId,
    })

    return NextResponse.json({ url: portal.customerPortalLink })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Portal failed' },
      { status: 500 },
    )
  }
}
