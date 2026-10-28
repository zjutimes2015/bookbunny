import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, getSessionUser } from '@/lib/auth'
import { absorb, nextFocus, planPageCap, sanitizeBrief, toProposal } from '@/lib/assistant/brief'
import { personaById } from '@/lib/assistant/personas'
import { replyFor } from '@/lib/assistant/voice'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * 家长对话。这一步只整理书的规格，不写大纲、不扣额度、不生图。
 * 确认之后由浏览器按顺序调用现有的四个创作接口。
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = (body ?? {}) as Record<string, unknown>
  const persona = personaById(typeof raw.persona === 'string' ? raw.persona : null)
  if (!persona) {
    return NextResponse.json({ error: 'Choose Lila or Kai.' }, { status: 400 })
  }

  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  if (!message || message.length > 1000) {
    return NextResponse.json({ error: 'Say a little about the book you want.' }, { status: 400 })
  }

  const prev = sanitizeBrief(raw.brief)
  const focus = nextFocus(prev)
  const brief = absorb(prev, message, focus)
  const user = await getSessionUser(req)
  const rateKey = user
    ? `assistant:user:${user.id}:hour`
    : `assistant:ip:${getClientIp(req)}:hour`
  const rate = await checkRateLimit(rateKey, user ? 60 : 20, 3600)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Try again in a little while.', code: 'rate_limited' },
      { status: 429 },
    )
  }
  const proposal = toProposal(brief, planPageCap(user?.tier, user?.isPaid ?? false))
  const reply = await replyFor({
    persona: persona.id,
    brief,
    proposal,
    signedIn: Boolean(user),
    message,
  })

  return NextResponse.json({
    persona: persona.id,
    reply,
    brief,
    proposal,
    signedIn: Boolean(user),
  })
}
