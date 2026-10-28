import { sanitizeBrief, type BookBrief, type Proposal } from '@/lib/assistant/brief'
import type { PersonaId } from '@/lib/assistant/personas'

export const BUDDY_DRAFT_KEY = 'sprouttales.buddy.draft'

/** 登录后回到伙伴页，OAuth 的 state 只接受站内相对路径 */
export const BUDDY_SIGN_IN_PATH = '/api/auth/google?next=/buddy'

export interface BuddyChatMessage {
  id: string
  role: 'buddy' | 'parent'
  text: string
}

export interface BuddyDraft {
  personaId: PersonaId
  messages: BuddyChatMessage[]
  brief: BookBrief
  proposal: Proposal | null
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function saveBuddyDraft(storage: Pick<DraftStorage, 'setItem'>, draft: BuddyDraft): void {
  storage.setItem(BUDDY_DRAFT_KEY, JSON.stringify(draft))
}

export function clearBuddyDraft(storage: Pick<DraftStorage, 'removeItem'>): void {
  storage.removeItem(BUDDY_DRAFT_KEY)
}

export function loadBuddyDraft(storage: Pick<DraftStorage, 'getItem'>): BuddyDraft | null {
  const raw = storage.getItem(BUDDY_DRAFT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<BuddyDraft>
    if (parsed.personaId !== 'lila' && parsed.personaId !== 'kai') return null
    if (!Array.isArray(parsed.messages)) return null
    const messages = parsed.messages.filter(isMessage)
    return {
      personaId: parsed.personaId,
      messages,
      brief: sanitizeBrief(parsed.brief),
      proposal: isProposal(parsed.proposal) ? parsed.proposal : null,
    }
  } catch {
    return null
  }
}

function isMessage(value: unknown): value is BuddyChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as BuddyChatMessage
  return (message.role === 'buddy' || message.role === 'parent')
    && typeof message.id === 'string'
    && typeof message.text === 'string'
}

function isProposal(value: unknown): value is Proposal {
  if (!value || typeof value !== 'object') return false
  const proposal = value as Proposal
  return typeof proposal.childName === 'string'
    && typeof proposal.theme === 'string'
    && typeof proposal.ageGroup === 'string'
    && typeof proposal.level === 'string'
    && typeof proposal.levelLabel === 'string'
    && typeof proposal.pages === 'number'
    && typeof proposal.costUnits === 'number'
    && typeof proposal.capped === 'boolean'
}
