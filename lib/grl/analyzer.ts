import { pickLevel, validateVocabulary, getLevels, type ReadingLevel } from '../reading-levels'

/** 单维度评分（0-100）——越高越接近该档位标准 */
interface DimensionScore {
  name: string
  description: string
  actual: number | string
  target: number | string
  score: number // 0-100
}

/** GRL 可解释报告 */
export interface GrlReport {
  grl: string
  levelLabel: string
  ageRange: string
  overallScore: number // 0-100
  overallVerdict: 'excellent' | 'good' | 'fair' | 'needs_revision'
  dimensions: DimensionScore[]
  overLevelWords: string[]
  topWords: { word: string; count: number }[]
  avgSentenceWords: number
  totalUniqueWords: number
  summary: string
}

/** 提取句子（英文 + 标点分裂；中文走句号） */
function splitSentences(text: string): string[] {
  // 简单分句：按 . ! ? 分割；去掉空串
  return text
    .split(/[.!?。！？]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/** 计算平均句长（词数） */
function avgSentenceLength(text: string): number {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return 0
  let total = 0
  for (const s of sentences) {
    const words = s.match(/[a-zA-Z\u4e00-\u9fff']+/g) || []
    total += words.length
  }
  return Math.round((total / sentences.length) * 10) / 10
}

/** 高频词 Top N（英文按小写归并；过滤单字母/数字） */
function topFrequencyWords(text: string, n = 10): { word: string; count: number }[] {
  const words = text.match(/[a-zA-Z\u4e00-\u9fff']+/g) || []
  const freq = new Map<string, number>()
  for (const w of words) {
    const lower = w.toLowerCase()
    if (/^[0-9]+$/.test(lower)) continue
    freq.set(lower, (freq.get(lower) || 0) + 1)
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }))
}

/** 计算单个维度的达标分（0-100） */
function scoreDimension(actual: number, target: number, tolerance = 0.2): number {
  const diff = Math.abs(actual - target)
  const base = diff / Math.max(target, 1)
  // 在 tolerance 内 = 满分；超 tolerance 外线性扣分
  if (base <= tolerance) return 100
  const excess = (base - tolerance) / Math.max(1 - tolerance, 0.01)
  return Math.max(0, Math.round(100 - excess * 500))
}

/**
 * 为一段故事文本生成 GRL 可解释报告。
 * @param text 完整故事文本
 * @param grl 目标分级（'A'-'E'）——会从 pickLevel 拿到对应的词表约束
 */
export function analyzeStoryForGRL(text: string, grl: string): GrlReport {
  const level = pickLevel(grl)
  if (!level) {
    // 兜底：用第一个 level
    const levels = getLevels()
    return buildReport(text, levels[0])
  }
  return buildReport(text, level)
}

function buildReport(text: string, level: ReadingLevel): GrlReport {
  const vocabCheck = validateVocabulary(text, level)
  const avgLen = avgSentenceLength(text)
  const topWords = topFrequencyWords(text, 10)

  // 维度 1: 词汇通过率（目标 = >= 95%）
  const vocabTargetRatio = 0.95
  const actualVocabRatio = 1 - vocabCheck.ratio // passed ratio
  const vocabScore = Math.round(Math.max(0, actualVocabRatio / vocabTargetRatio) * 100)

  // 维度 2: 平均句长（目标 = level.sentenceMaxWords / 2 —— 理想是 max 的一半左右）
  const lenTarget = level.sentenceMaxWords
  const lenScore = scoreDimension(avgLen, lenTarget, 0.3)

  // 维度 3: 总词数（目标 = level.wordLimit / 2）
  const uniqueWords = vocabCheck.totalUniqueWords
  const wordTarget = Math.round(level.wordLimit / 2)
  const wordScore = scoreDimension(uniqueWords, wordTarget, 0.5)

  const dimensions: DimensionScore[] = [
    {
      name: 'Vocabulary Match',
      description: `How well the words match GRL ${level.grl}-level vocabulary`,
      actual: `${Math.round(actualVocabRatio * 100)}%`,
      target: `≥ 95%`,
      score: Math.min(100, vocabScore),
    },
    {
      name: 'Sentence Length',
      description: `Average words per sentence (target: ${lenTarget} words max)`,
      actual: `${avgLen} words`,
      target: `≤ ${level.sentenceMaxWords}`,
      score: lenScore,
    },
    {
      name: 'Vocabulary Size',
      description: `Unique vocabulary words (target: age-appropriate richness)`,
      actual: `${uniqueWords} unique words`,
      target: `${wordTarget}`,
      score: wordScore,
    },
  ]

  const overall = Math.round(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
  )

  let verdict: GrlReport['overallVerdict']
  if (overall >= 85) verdict = 'excellent'
  else if (overall >= 70) verdict = 'good'
  else if (overall >= 55) verdict = 'fair'
  else verdict = 'needs_revision'

  // 构建人类可读 summary
  const summaryParts: string[] = []
  if (vocabCheck.passed) {
    summaryParts.push(
      `✓ Vocabulary matches GRL ${level.grl} well — ${Math.round(actualVocabRatio * 100)}% of words are age-appropriate.`,
    )
  } else {
    summaryParts.push(
      `⚠️ ${vocabCheck.overLevelWords.length} word${vocabCheck.overLevelWords.length === 1 ? '' : 's'} may be too advanced for this level: ${vocabCheck.overLevelWords.slice(0, 8).join(', ')}${vocabCheck.overLevelWords.length > 8 ? '…' : ''}`,
    )
  }
  if (avgLen > level.sentenceMaxWords) {
    summaryParts.push(
      `⚠️ Average sentence length (${avgLen} words) exceeds the GRL ${level.grl} max (${level.sentenceMaxWords} words).`,
    )
  } else {
    summaryParts.push(`✓ Sentence length (${avgLen} avg) is within the ${level.sentenceMaxWords}-word limit.`)
  }

  const summary = summaryParts.join(' ')

  return {
    grl: level.grl,
    levelLabel: `${level.grl} · ${level.label}`,
    ageRange: level.ageRange,
    overallScore: overall,
    overallVerdict: verdict,
    dimensions,
    overLevelWords: vocabCheck.overLevelWords,
    topWords,
    avgSentenceWords: avgLen,
    totalUniqueWords: uniqueWords,
    summary,
  }
}
