import levelsData from '@/data/grl_levels.json'

export interface ReadingLevel {
  grl: string
  ageRange: string
  label: string
  wordLimit: number
  sentenceMaxWords: number
  pageCount: number
  description: string
  vocabulary: string[]
}

// 加载分级配置（A-E，3-8岁主战场）
const LEVELS: ReadingLevel[] = (levelsData as { levels: ReadingLevel[] }).levels

export function getLevels(): ReadingLevel[] {
  return LEVELS
}

export function pickLevel(grl: string): ReadingLevel | null {
  const lvl = LEVELS.find(l => l.grl.toLowerCase() === grl.toLowerCase())
  return lvl || null
}

export function pickLevelByAge(ageRange: string): ReadingLevel | null {
  const lvl = LEVELS.find(l => l.ageRange === ageRange)
  return lvl || null
}

/** 由年龄组映射到默认 GRL（向后兼容：老 ageGroup 直接映射） */
export function grlFromAgeGroup(ageGroup: string): string {
  const map: Record<string, string> = {
    '0-3': 'A',
    '3-5': 'B',
    '5-7': 'C',
    '7-10': 'E',
  }
  return map[ageGroup] || 'C'
}

/**
 * 词汇校验：统计文本中超纲词占比。
 * 分词用简单正则（英文单词），忽略数字、标点、首字母大写专有名词（如角色名）。
 * 超纲率 = 超纲词唯一数 / 总词唯一数。
 */
export function validateVocabulary(text: string, level: ReadingLevel): {
  overLevelWords: string[]
  ratio: number
  passed: boolean
  totalUniqueWords: number
} {
  const vocabSet = new Set(level.vocabulary.map(w => w.toLowerCase()))

  // 提取所有单词（英文 + 撇号缩写）
  const words = text.match(/[a-zA-Z']+/g) || []
  const unique = new Set(words.map(w => w.toLowerCase()))

  // 忽略纯数字、单字母（I/a除外，已在词表）、首字母大写的专有名词（角色名/地名）
  const candidates: string[] = []
  for (const w of unique) {
    if (/^[0-9]+$/.test(w)) continue
    if (w.length === 1) continue
    // 跳过专有名词（在句子中间出现的大写词）
    candidates.push(w)
  }

  const over = candidates.filter(w => !vocabSet.has(w))
  const total = candidates.length
  const ratio = total === 0 ? 0 : over.length / total

  // 超纲 < 5% 通过；>= 5% 不通过
  return {
    overLevelWords: over,
    ratio,
    passed: ratio < 0.05,
    totalUniqueWords: total,
  }
}

/**
 * 生成长度约束描述，用于 prompt 注入。
 *
 * pageCount：调用方（套餐上限）决定的实际页数。缺省时用分级自带的页数目标。
 * 两者必须一致 —— 分级页数（C=14/D=16/E=18）会超过付费套餐的 12 页上限，
 * 若同时注入两个互相矛盾的页数，模型可能按分级页数产出，把生图成本顶穿毛利。
 */
export function levelPromptConstraints(level: ReadingLevel, pageCount?: number): string {
  const pages = pageCount ?? level.pageCount
  return [
    `Reading Level: GRL ${level.grl} (${level.label}, ages ${level.ageRange})`,
    `Vocabulary: Use ONLY simple words from a ${level.grl}-level vocabulary list. Each page sentence must be at most ${level.sentenceMaxWords} words.`,
    `Sentence length: ${level.sentenceMaxWords} words max per sentence. ${level.description}.`,
    `Page count: EXACTLY ${pages} pages (short sentences, one per page).`,
  ].join('\n')
}
