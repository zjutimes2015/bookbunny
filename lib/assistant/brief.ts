import { bookCostUnits } from '@/lib/allocation'
import { grlFromAgeGroup, pickLevel } from '@/lib/reading-levels'
import { maxPagesFor } from '@/lib/tier-limits'

export const AGE_GROUPS = ['0-3', '3-5', '5-7', '7-10'] as const
export const LEVELS = ['A', 'B', 'C', 'D', 'E'] as const

export type AgeGroup = (typeof AGE_GROUPS)[number]
export type LevelId = (typeof LEVELS)[number]
export type BriefFocus = 'childName' | 'theme' | 'age'

export interface BookBrief {
  childName: string | null
  ageGroup: AgeGroup | null
  theme: string | null
  level: LevelId | null
  /** 家长点名的页数；没说就留空，确认时按套餐给默认值 */
  pages: number | null
}

export interface Proposal {
  childName: string
  ageGroup: AgeGroup
  theme: string
  level: LevelId
  pages: number
  costUnits: number
  levelLabel: string
  /** 家长要的页数超过了当前套餐 */
  capped: boolean
}

const NAME_STOP = new Set([
  'book', 'story', 'page', 'pages', 'level', 'grl', 'please', 'make', 'create',
  'a', 'an', 'the', 'my', 'about',
])

export function emptyBrief(): BookBrief {
  return { childName: null, ageGroup: null, theme: null, level: null, pages: null }
}

export function sanitizeBrief(input: unknown): BookBrief {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const age = typeof raw.ageGroup === 'string' && isAgeGroup(raw.ageGroup) ? raw.ageGroup : null
  const level = typeof raw.level === 'string' && isLevel(raw.level.toUpperCase())
    ? (raw.level.toUpperCase() as LevelId)
    : null
  const pages = typeof raw.pages === 'number' && Number.isFinite(raw.pages)
    ? clampRequestedPages(raw.pages)
    : null
  return {
    childName: cleanName(typeof raw.childName === 'string' ? raw.childName : ''),
    ageGroup: age,
    theme: cleanTheme(typeof raw.theme === 'string' ? raw.theme : ''),
    level,
    pages,
  }
}

export function nextFocus(brief: BookBrief): BriefFocus | null {
  if (!brief.childName) return 'childName'
  if (!brief.theme) return 'theme'
  if (!brief.ageGroup && !brief.level) return 'age'
  return null
}

/**
 * 把家长这一句话并进已有草稿。
 * 先抓整句里已经说清的名字、主题、年龄、级别、页数；
 * 还缺的那一项，再用整句本身去补（多轮对话）。
 */
export function absorb(prev: BookBrief, message: string, focus: BriefFocus | null): BookBrief {
  const text = message.replace(/\s+/g, ' ').trim()
  if (!text) return prev

  const picked = extract(text)
  const next: BookBrief = {
    childName: prev.childName ?? picked.childName,
    ageGroup: prev.ageGroup ?? picked.ageGroup,
    theme: prev.theme ?? picked.theme,
    level: prev.level ?? picked.level,
    pages: prev.pages ?? picked.pages,
  }

  if (focus === 'childName' && !next.childName) {
    next.childName = nameFromUtterance(text)
  }
  if (focus === 'theme' && !next.theme) {
    next.theme = cleanTheme(text.replace(/^(?:a|an|the)\s+book\s+about\s+/i, ''))
  }
  if (focus === 'age' && !next.ageGroup && !next.level) {
    next.ageGroup = ageGroupFromUtterance(text) ?? bareAge(text)
    next.level = levelFromUtterance(text)
  }

  if (next.ageGroup && !next.level) {
    const mapped = grlFromAgeGroup(next.ageGroup)
    next.level = isLevel(mapped) ? mapped : null
  }
  if (next.level && !next.ageGroup) {
    next.ageGroup = ageGroupForLevel(next.level)
  }

  return next
}

export function toProposal(brief: BookBrief, maxPages: number): Proposal | null {
  if (!brief.childName || !brief.theme) return null
  const level = brief.level ?? (brief.ageGroup ? asLevel(grlFromAgeGroup(brief.ageGroup)) : null)
  const ageGroup = brief.ageGroup ?? (level ? ageGroupForLevel(level) : null)
  if (!level || !ageGroup) return null

  const cap = Math.min(Math.max(maxPages, 4), 24)
  const requested = brief.pages ?? Math.min(8, cap)
  const pages = Math.min(Math.max(requested, 4), cap)
  const info = pickLevel(level)

  return {
    childName: brief.childName,
    ageGroup,
    theme: brief.theme,
    level,
    pages,
    costUnits: bookCostUnits('1:1', pages),
    levelLabel: info ? `${info.grl} · ${info.label}` : `GRL ${level}`,
    capped: brief.pages != null && brief.pages > pages,
  }
}

export function planPageCap(tier: string | undefined, isPaid: boolean): number {
  return maxPagesFor(tier, isPaid)
}

function extract(text: string): BookBrief {
  return {
    childName: nameFromSentence(text),
    ageGroup: ageGroupFromUtterance(text),
    theme: themeFromSentence(text),
    level: levelFromUtterance(text),
    pages: pagesFromUtterance(text),
  }
}

function nameFromSentence(text: string): string | null {
  const patterns = [
    /(?:named|called)\s+([A-Z][\p{L}'-]{1,24})/u,
    /\bfor\s+([A-Z][\p{L}'-]{1,24})\b/u,
    /\b(?:son|daughter|child|kid)\s+([A-Z][\p{L}'-]{1,24})\b/u,
    /给\s*([\p{Script=Han}]{1,8}?)(?:做|的|想)/u,
    /([\p{Script=Han}]{1,8})想要/u,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const name = match ? cleanName(match[1]) : null
    if (name) return name
  }
  return null
}

function nameFromUtterance(text: string): string | null {
  if (/about|页|page|level|grl|岁|year/i.test(text)) return null
  const words = text.split(' ').filter(Boolean)
  if (words.length > 3) return null
  return cleanName(text)
}

function themeFromSentence(text: string): string | null {
  const about = text.match(/\babout\s+(.+?)(?:\s+for\b|,|\.|$)/i)
  if (about) return cleanTheme(about[1])
  const zh = text.match(/关于\s*(.+?)(?:的书|的故事|，|。|$)/)
  if (zh) return cleanTheme(zh[1])
  return null
}

function ageGroupFromUtterance(text: string): AgeGroup | null {
  const range = text.match(/\b(0-3|3-5|5-7|7-10)\b/)
  if (range && isAgeGroup(range[1])) return range[1]
  const age = text.match(/(\d{1,2})\s*(?:years?\s*old|year-old|yo|岁)|(?:age|aged)\s*(\d{1,2})/i)
  const n = Number(age?.[1] ?? age?.[2])
  if (!Number.isFinite(n)) return null
  return ageToGroup(n)
}

function levelFromUtterance(text: string): LevelId | null {
  const match = text.match(/(?:GRL|level)\s*([A-Ea-e])\b/i)
  if (!match) return null
  const id = match[1].toUpperCase()
  return isLevel(id) ? id : null
}

function pagesFromUtterance(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*-?\s*(?:pages?|页)\b/i)
  if (!match) return null
  return clampRequestedPages(Number(match[1]))
}

function bareAge(text: string): AgeGroup | null {
  if (/pages?|页/i.test(text)) return null
  const match = text.match(/\b(\d{1,2})\b/)
  if (!match) return null
  return ageToGroup(Number(match[1]))
}

function ageToGroup(age: number): AgeGroup | null {
  if (age < 0 || age > 12) return null
  if (age <= 3) return '0-3'
  if (age <= 5) return '3-5'
  if (age <= 7) return '5-7'
  return '7-10'
}

export function ageGroupForLevel(level: LevelId): AgeGroup {
  switch (level) {
    case 'A':
    case 'B':
      return '3-5'
    case 'C':
    case 'D':
      return '5-7'
    case 'E':
      return '7-10'
    default: {
      const unknown: never = level
      return unknown
    }
  }
}

function asLevel(value: string): LevelId | null {
  return isLevel(value) ? value : null
}

function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value)
}

function isLevel(value: string): value is LevelId {
  return (LEVELS as readonly string[]).includes(value)
}

function clampRequestedPages(n: number): number | null {
  if (!Number.isFinite(n)) return null
  const pages = Math.round(n)
  if (pages < 4 || pages > 24) return null
  return pages
}

function cleanName(raw: string): string | null {
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ')
  if (!trimmed || trimmed.length > 40) return null
  if (!/^[\p{L}][\p{L}\s'.-]{0,39}$/u.test(trimmed)) return null
  if (NAME_STOP.has(trimmed.toLowerCase())) return null
  if (/[A-Za-z]/.test(trimmed) && trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase())
  }
  return trimmed
}

function cleanTheme(raw: string): string | null {
  const theme = raw
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/\b(?:please|thanks|thank you)\b/gi, '')
    .replace(/[。.！!？?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (theme.length < 2 || theme.length > 160) return null
  if (NAME_STOP.has(theme.toLowerCase())) return null
  return theme
}
