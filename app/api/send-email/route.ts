import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'

export async function POST(req: NextRequest) {
  try {
    const { template, to, props } = await req.json()

    if (!template || !to) {
      return NextResponse.json({ error: 'Missing template or recipient' }, { status: 400 })
    }

    const result = await sendEmail(template, to, props || {})
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 },
    )
  }
}
