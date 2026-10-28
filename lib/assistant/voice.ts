import type { BookBrief, BriefFocus, Proposal } from '@/lib/assistant/brief'
import { nextFocus } from '@/lib/assistant/brief'
import type { PersonaId } from '@/lib/assistant/personas'
import { personaName } from '@/lib/assistant/personas'

const QUESTIONS: Record<PersonaId, Record<BriefFocus, string>> = {
  lila: {
    childName: 'I’d love to. What’s your child’s name?',
    theme: 'What should the story be about?',
    age: 'How old are they? I’ll pick a reading level from that.',
  },
  kai: {
    childName: 'What is the child’s name?',
    theme: 'What is the story about?',
    age: 'How old is the child? I need that to choose the reading level.',
  },
}

export function scriptedReply(
  persona: PersonaId,
  brief: BookBrief,
  proposal: Proposal | null,
  signedIn: boolean,
): string {
  if (!proposal) {
    const focus = nextFocus(brief)
    if (!focus) return QUESTIONS[persona].age
    return QUESTIONS[persona][focus]
  }

  const credit = proposal.costUnits === 1 ? '1 book credit' : `${proposal.costUnits} book credits`
  const cap = proposal.capped
    ? ` Your plan allows ${proposal.pages} pages, so I set it to ${proposal.pages}.`
    : ''
  const signIn = signedIn ? '' : ' Sign in first so the book is saved to your library.'
  const lead = persona === 'lila'
    ? `I can make “${proposal.theme}” for ${proposal.childName}.`
    : `Ready: “${proposal.theme}” for ${proposal.childName}.`

  return [
    lead,
    `${proposal.pages} pages, ${proposal.levelLabel}, ages ${proposal.ageGroup}.`,
    `That uses ${credit}.${cap}`,
    `I’ll draw ${proposal.childName} — no photo is used.`,
    `Press “Make this book” and I’ll write it, save it, then illustrate every page.${signIn}`,
  ].join(' ')
}

/**
 * 确认卡上的数字以脚本为准。模型只负责把「还缺什么」说得像这个角色，
 * 失败或没有密钥时退回固定问句。
 */
export async function replyFor(input: {
  persona: PersonaId
  brief: BookBrief
  proposal: Proposal | null
  signedIn: boolean
  message: string
}): Promise<string> {
  const script = scriptedReply(input.persona, input.brief, input.proposal, input.signedIn)
  if (input.proposal) return script

  const key = process.env.OPENROUTER_API_KEY
  if (!key) return script

  const focus = nextFocus(input.brief)
  if (!focus) return script

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        temperature: 0.4,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: [
              `You are ${personaName(input.persona)}, a story buddy on SproutTales.`,
              'Speak to a parent, in English, in one or two short sentences.',
              `You still need this and nothing else: ${focus}.`,
              'Do not claim a book has been created. Do not ask for a photo.',
              'Return only the sentences, no JSON.',
            ].join(' '),
          },
          { role: 'user', content: input.message.slice(0, 500) },
        ],
      }),
    })
    clearTimeout(timer)
    if (!res.ok) return script
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string') return script
    const say = text.replace(/\s+/g, ' ').trim()
    if (say.length < 2 || say.length > 280) return script
    return say
  } catch {
    return script
  }
}
