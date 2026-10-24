/**
 * Remix 规则层（纯函数，无 IO）。
 *
 * 三种改写都建立在同一条地基上：世界（舞台）不变，主角（孩子）不变。
 * 变的只有这一幕怎么演 —— 换结局、换场景、换主角位。
 */

export type RemixKind = 'ending' | 'scene' | 'sidekick'

export interface RemixOption {
  id: RemixKind
  label: string
  hint: string
}

export const REMIX_KINDS: RemixOption[] = [
  {
    id: 'ending',
    label: 'A different ending',
    hint: 'Same place, same friends — this time it ends another way.',
  },
  {
    id: 'scene',
    label: 'A new place',
    hint: 'Move to another corner of the same world.',
  },
  {
    id: 'sidekick',
    label: 'A friend takes the lead',
    hint: 'A sidekick becomes the hero for one episode.',
  },
]

export function isRemixKind(value: unknown): value is RemixKind {
  return value === 'ending' || value === 'scene' || value === 'sidekick'
}

/**
 * 寓意轮换：每一集换一条，避免连续两集教同一件事。
 * 没有寓意池时返回 null（沿用上一集的主题）。
 */
export function pickMoral(pool: string[] | null | undefined, episodeNumber: number): string | null {
  if (!pool || pool.length === 0) return null
  const index = Math.max(0, episodeNumber - 1) % pool.length
  return pool[index]
}

/**
 * 下一集的寓意：优先顺着上一集在池子里的位置往后走。
 * 这样第 1 集由家长挑的寓意会被尊重，第 2 集从他挑的那条往后轮，而不是从池子第一条重来。
 */
export function nextMoral(
  pool: string[] | null | undefined,
  previousMoral: string | null | undefined,
  episodeNumber: number,
): string | null {
  if (!pool || pool.length === 0) return null
  if (previousMoral) {
    const index = pool.indexOf(previousMoral)
    if (index >= 0) return pool[(index + 1) % pool.length]
  }
  return pickMoral(pool, episodeNumber)
}

/** 每种改写对剧情的硬性要求 */
const KIND_DIRECTIVE: Record<RemixKind, string> = {
  ending:
    'Replay the SAME final beat of the previous episode with a DIFFERENT resolution. ' +
    'Same place, same characters, same small problem — the protagonist chooses differently this time.',
  scene:
    'Move the SAME protagonist to another spot inside the same world. New backdrop, same cast, same moral. ' +
    'Open with the walk or the move so the reader feels the new place.',
  sidekick:
    'Let a supporting character lead this episode while the protagonist helps. ' +
    'That sidekick opens the story with their catchphrase and gets the final line.',
}

export interface SequelCastMember {
  name: string
  role: string
  catchphrase?: string
}

export interface SequelBriefInput {
  kind: RemixKind
  episodeNumber: number
  protagonistName: string
  previousTitle: string
  /** 上一集最后一页的文字，用来接住"接着讲"的手感 */
  previousEnding?: string | null
  worldName?: string | null
  worldScene?: string | null
  cast?: SequelCastMember[]
  moral?: string | null
  forbidden?: string[]
}

/**
 * 拼装续集简报，注入 generateStory 的 prompt。
 * 只描述舞台与规则，绝不包含任何孩子身份信息（照片、真实姓名、账户 ID）。
 */
export function buildSequelBrief(input: SequelBriefInput): string {
  const lines: string[] = [
    `SEQUEL CONTRACT — this is EPISODE ${input.episodeNumber} of the same family series, not a new book.`,
    `- Previous episode: "${input.previousTitle}".`,
    `- Protagonist: ${input.protagonistName} — the SAME child, identical look, clothes and age on every page.`,
  ]

  if (input.previousEnding) {
    lines.push(`- Where the last episode left off: "${input.previousEnding}"`)
  }

  if (input.worldName || input.worldScene) {
    const stage = [input.worldName, input.worldScene].filter(Boolean).join(' — ')
    lines.push(`- Stage (shared world, unchanged): ${stage}`)
  }

  if (input.cast?.length) {
    const cast = input.cast
      .map((c) => `${c.name} (${c.role}${c.catchphrase ? `, says “${c.catchphrase}”` : ''})`)
      .join('; ')
    lines.push(`- Supporting cast (same names and traits): ${cast}`)
  }

  lines.push(`- This episode's moral: ${input.moral || 'the same gentle lesson as the previous episode'}`)
  lines.push(`- Remix move: ${KIND_DIRECTIVE[input.kind]}`)
  lines.push(
    '- Hard rules: no villain, no peril, no frightening imagery, no losing home or friends; ' +
      'the same art direction as the previous episode so both books sit on one shelf.',
  )

  if (input.forbidden?.length) {
    lines.push(`- Forbidden in this world: ${input.forbidden.join(' ')}`)
  }

  lines.push('- Open on a familiar moment, move forward, and close on a calm, warm beat.')
  return lines.join('\n')
}

/** 从上一集的页面文字里取结尾，供续集简报接住上下文 */
export function endingLine(pages: string[] | null | undefined): string | null {
  if (!pages || pages.length === 0) return null
  const last = pages[pages.length - 1]
  return last?.trim() || null
}

export interface WorldBriefInput {
  worldName: string
  worldScene: string
  artStyle: string
  ageRange: string
  cast: SequelCastMember[]
  moral?: string | null
  forbidden?: string[]
}

/**
 * 第 1 集的世界简报：官方世界 = 舞台，孩子 = 主角。
 * 家长挑的是这一集要教的寓意，不是「买一套设定」。
 */
export function buildWorldBrief(input: WorldBriefInput): string {
  const lines: string[] = [
    `STAGE BRIEF — this episode takes place inside the official world "${input.worldName}".`,
    `- Setting (keep every page inside it): ${input.worldScene}`,
    `- Art direction (must hold on every page): ${input.artStyle}`,
    `- Target age: ${input.ageRange}.`,
  ]

  if (input.cast.length) {
    const cast = input.cast
      .map((c) => `${c.name} (${c.role}${c.catchphrase ? `, says “${c.catchphrase}”` : ''})`)
      .join('; ')
    lines.push(`- Official cast (keep their roles, personalities and catchphrases): ${cast}`)
  }

  lines.push(
    `- The child protagonist is the hero of this episode; the official cast supports them and never replaces them.`,
  )
  lines.push(`- This episode's moral: ${input.moral || 'a gentle, age-appropriate lesson'}`)
  lines.push('- Write every name, place and line of dialogue in English, transliterating original names naturally.')
  lines.push('- No villain, no peril, no frightening imagery; exactly one plot point per page.')

  if (input.forbidden?.length) {
    lines.push(`- Forbidden in this world: ${input.forbidden.join(' ')}`)
  }

  return lines.join('\n')
}
