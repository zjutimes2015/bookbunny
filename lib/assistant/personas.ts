/**
 * 站内故事伙伴。形象沿用首页样书里的 Lila 与 Kai，
 * 画成面对家长的聊天肖像：大头、正视、一个固定道具。
 * 两个角色共用同一条创作管线，只是说话方式不同。
 */

export type PersonaId = 'lila' | 'kai'

export interface Persona {
  id: PersonaId
  name: string
  role: 'girl' | 'boy'
  /** 一句话，给家长看 */
  blurb: string
  greeting: string
}

export const PERSONAS: readonly Persona[] = [
  {
    id: 'lila',
    name: 'Lila',
    role: 'girl',
    blurb: 'Warm and quick. She asks one thing at a time, then makes the book.',
    greeting:
      'Hi, I’m Lila. Tell me who the book is for and what it should be about — a name, an age, and an idea is enough.',
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'boy',
    blurb: 'Quiet and exact. He matches the reading level before any pages are drawn.',
    greeting:
      'I’m Kai. Say the child’s name, age, and the story you want. I’ll match a reading level and wait for you to confirm.',
  },
] as const

export function personaById(id: string | null | undefined): Persona | null {
  if (id === 'lila' || id === 'kai') {
    return PERSONAS.find((p) => p.id === id) ?? null
  }
  return null
}

export function personaName(id: PersonaId): string {
  switch (id) {
    case 'lila':
      return 'Lila'
    case 'kai':
      return 'Kai'
    default: {
      const unknown: never = id
      return unknown
    }
  }
}
