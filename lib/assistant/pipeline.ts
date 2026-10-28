import type { Proposal } from '@/lib/assistant/brief'
import type { CharacterCard, PageOutline, StoryResult } from '@/lib/types/book'

export interface CharacterDraft {
  name: string
  card?: CharacterCard
  consistencyLine?: string
  imageB64?: string
  refSeed?: number
}

/** 角色接口的表单字段。不包含照片。 */
export function characterFields(proposal: Proposal): Record<string, string> {
  return {
    name: proposal.childName,
    theme: proposal.theme,
    ageGroup: proposal.ageGroup,
    photoUsage: 'illustrated',
    language: 'en',
  }
}

export function storyPayload(proposal: Proposal, character: CharacterDraft, turnstileToken: string) {
  return {
    theme: proposal.theme,
    ageGroup: proposal.ageGroup,
    characterName: proposal.childName,
    pages: proposal.pages,
    level: proposal.level,
    language: 'en' as const,
    characterCards: character.card ? [character.card] : [],
    turnstileToken,
  }
}

export function bookPayload(proposal: Proposal, character: CharacterDraft, story: StoryResult) {
  return {
    title: story.title,
    outline: story.outline,
    ageGroup: proposal.ageGroup,
    theme: proposal.theme,
    level: story.level || proposal.level,
    quiz: story.quiz ?? null,
    aspect: '1:1',
    language: 'en' as const,
    character: {
      name: character.name || proposal.childName,
      card: character.card,
      consistencyLine: character.consistencyLine,
      imageB64: character.imageB64,
    },
  }
}

export function illustrationPayload(input: {
  title: string
  outline: PageOutline[]
  bookId: string
  character: CharacterDraft
  turnstileToken: string
}) {
  return {
    title: input.title,
    outline: input.outline,
    bookId: input.bookId,
    characterImageB64: input.character.imageB64 || null,
    refSeed: input.character.refSeed || null,
    consistencyLine: input.character.consistencyLine,
    aspect: '1:1',
    language: 'en' as const,
    turnstileToken: input.turnstileToken,
  }
}

/** 与创作页相同：每批最多 5 页，避免一次请求打满生图。 */
export function illustrationBatches<T>(outline: T[], size = 5): T[][] {
  if (size < 1) return []
  const batches: T[][] = []
  for (let i = 0; i < outline.length; i += size) {
    batches.push(outline.slice(i, i + size))
  }
  return batches
}
