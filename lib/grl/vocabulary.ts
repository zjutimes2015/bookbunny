import { getLevels, pickLevel, type ReadingLevel } from '../reading-levels'
import { pickWordsToPreTeach } from './ell'

/**
 * 一本书专属的词汇表（Teacher 档可导出）。
 *
 * 现有的 validateVocabulary 只回答「有多少超纲词」，不回答
 * 「这本书教了哪些词、哪些词是孩子还不会的」。
 * 教师要的是后者：一张按难度分组的词表，能直接印成课堂讲义或家庭练习单。
 */
export interface VocabularyEntry {
  word: string
  /** 出现次数 */
  count: number
  /** 该词所属的 GRL 档位（A–E），'above' 表示超出目标档位 */
  level: string
  /** 是否属于目标档位的核心词表 */
  atLevel: boolean
}

export interface BookVocabulary {
  /** 目标 GRL 档位 */
  grl: string
  levelLabel: string
  /** 目标档位词表里出现过的词（孩子应该学会的） */
  atLevelWords: VocabularyEntry[]
  /** 超纲词（超出目标档位，需要教或改写） */
  aboveLevelWords: VocabularyEntry[]
  /** 全书出现过的全部词 */
  allWords: VocabularyEntry[]
  totalUniqueWords: number
  totalTokens: number
  /** 目标档位覆盖率（0-100） */
  coverage: number
}

/** 单词提取：英文单词 + 撇号缩写，去掉纯数字 */
function tokenize(text: string): string[] {
  return (text.match(/[a-zA-Z']+/g) || []).map(w => w.toLowerCase())
}

/**
 * 建立「词 → 最低 GRL 档位」的映射。
 *
 * 同一个词如果出现在多个档位的词表里，取最低档（最容易的档位），
 * 因为教师关心的是「这个词最早在哪个级别出现」。
 */
function buildWordLevels(): Map<string, string> {
  const map = new Map<string, string>()
  for (const level of getLevels()) {
    for (const word of level.vocabulary) {
      const key = word.toLowerCase()
      if (!map.has(key)) map.set(key, level.grl)
    }
  }
  return map
}

/**
 * 生成一本书的词汇表。
 *
 * @param text 全书正文（拼接各页文本）
 * @param grl 目标分级（A–E）
 */
export function buildBookVocabulary(text: string, grl: string): BookVocabulary {
  const level = pickLevel(grl)
  const words = tokenize(text)
  const counts = new Map<string, number>()
  for (const w of words) {
    if (/^[0-9]+$/.test(w)) continue
    counts.set(w, (counts.get(w) || 0) + 1)
  }

  const wordLevels = buildWordLevels()
  const targetLevel = level?.grl ?? 'C'
  const targetVocab = new Set((level?.vocabulary ?? []).map(w => w.toLowerCase()))

  const allWords: VocabularyEntry[] = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      level: wordLevels.get(word) ?? 'above',
      atLevel: targetVocab.has(word),
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))

  const atLevelWords = allWords.filter(w => w.atLevel)
  const aboveLevelWords = allWords.filter(w => !w.atLevel)

  return {
    grl: targetLevel,
    levelLabel: level ? `${level.grl} · ${level.label}` : targetLevel,
    atLevelWords,
    aboveLevelWords,
    allWords,
    totalUniqueWords: allWords.length,
    totalTokens: words.length,
    coverage: allWords.length === 0 ? 0 : Math.round((atLevelWords.length / allWords.length) * 100),
  }
}

/**
 * 把词汇表渲染成教师可直接印的纯文本清单。
 *
 * 格式刻意保持简单：等宽字体打印友好，任何文字处理软件都能直接用。
 */
export function renderVocabularySheet(vocab: BookVocabulary, bookTitle: string): string {
  const lines: string[] = []
  lines.push(`Vocabulary List — ${bookTitle}`)
  lines.push(`Reading level: ${vocab.levelLabel}`)
  lines.push(`Unique words: ${vocab.totalUniqueWords} · Target-level coverage: ${vocab.coverage}%`)
  lines.push('')

  // 预教清单排在最前：教师打开第一眼就要知道「先教哪几个词」
  const preTeach = buildPreTeachList(vocab)
  if (preTeach.length > 0) {
    lines.push(`PRE-TEACH FIRST (${preTeach.length})`)
    lines.push('These above-level words repeat through the book. Teach them before reading.')
    lines.push(chunk(preTeach.map(w => `${w.word} (${w.count}x)`), 6).join('\n'))
    lines.push('')
  }

  lines.push(`AT-LEVEL WORDS (${vocab.atLevelWords.length})`)
  lines.push('These words appear in the GRL ' + vocab.grl + ' core vocabulary list.')
  if (vocab.atLevelWords.length > 0) {
    lines.push(chunk(vocab.atLevelWords.map(w => w.word), 10).join('\n'))
  } else {
    lines.push('(none)')
  }
  lines.push('')

  lines.push(`ABOVE-LEVEL WORDS (${vocab.aboveLevelWords.length})`)
  lines.push('These words are above the target level — pre-teach or rewrite.')
  if (vocab.aboveLevelWords.length > 0) {
    lines.push(chunk(vocab.aboveLevelWords.map(w => w.word), 10).join('\n'))
  } else {
    lines.push('(none)')
  }
  lines.push('')

  lines.push('WORD FREQUENCY')
  const freq = vocab.allWords.slice(0, 60)
  const width = Math.max(...freq.map(w => w.word.length), 0)
  for (const entry of freq) {
    lines.push(`${entry.word.padEnd(width)}  ${entry.count}  (${entry.level})`)
  }

  return lines.join('\n')
}

/**
 * 需要预教的词：超纲且反复出现的词。
 *
 * 教师看到这张清单就知道「今晚先教这几个词，再读这本书」。
 * 只出现在一次的生词靠上下文就能猜，反复出现的才值得单独教。
 */
export function buildPreTeachList(vocab: BookVocabulary, limit = 8): { word: string; count: number }[] {
  return pickWordsToPreTeach(
    vocab.aboveLevelWords.map(w => ({ word: w.word, count: w.count })),
    limit,
  )
}

/** 把长数组按每行 n 个切成多行 */
function chunk(items: string[], n: number): string[] {
  const out: string[] = []
  for (let i = 0; i < items.length; i += n) {
    out.push(items.slice(i, i + n).join(', '))
  }
  return out
}

/**
 * 渲染课堂讲义（worksheet）：学生填空版 + 教师答案版。
 *
 * 这是 Teacher 档的核心交付物 —— 有了它，产出的书能直接进课堂，
 * 而不只是「一个可以打印的绘本」。
 */
export function renderClassroomSheet(
  vocab: BookVocabulary,
  bookTitle: string,
  targetWordCount = 12,
): string {
  const lines: string[] = []
  lines.push(`Classroom Worksheet — ${bookTitle}`)
  lines.push(`Reading level: ${vocab.levelLabel}`)
  lines.push('')

  // 优先选目标档位的核心词做填空；有超纲词时也放进去作「找出超前词」
  const focus = vocab.atLevelWords.slice(0, targetWordCount)
  const advanced = vocab.aboveLevelWords.slice(0, 6)

  lines.push('PART 1 — Fill in the blank')
  lines.push('Write the missing word on the line.')
  lines.push('')
  focus.forEach((entry, i) => {
    lines.push(`${i + 1}. ${'______________'}   (appears ${entry.count}×)`)
  })
  lines.push('')

  lines.push('PART 2 — Circle the advanced word')
  lines.push('These words are above the reading level. Circle any you spot.')
  lines.push('')
  if (advanced.length > 0) {
    lines.push(chunk(advanced.map(w => w.word), 8).join('\n'))
  } else {
    lines.push('(no above-level words in this book)')
  }
  lines.push('')

  // 预教清单：超纲且反复出现的词 —— 教师先教完再进课堂
  const preTeach = buildPreTeachList(vocab)
  if (preTeach.length > 0) {
    lines.push('PART 3 — Pre-teach list (teach these before reading)')
    lines.push(chunk(preTeach.map(w => `${w.word} (${w.count}x)`), 6).join('\n'))
    lines.push('')
  }

  lines.push('TEACHER ANSWER KEY')
  focus.forEach((entry, i) => {
    lines.push(`${i + 1}. ${entry.word}`)
  })
  lines.push('')
  lines.push(`Target-level coverage: ${vocab.coverage}% of ${vocab.totalUniqueWords} unique words.`)

  return lines.join('\n')
}

/** 取某个 GRL 档位的完整核心词表（教师备课用） */
export function getLevelVocabulary(grl: string): { grl: string; words: string[] } | null {
  const level: ReadingLevel | null = pickLevel(grl)
  if (!level) return null
  return { grl: level.grl, words: [...level.vocabulary] }
}
