/**
 * 跟读准确率：把"孩子读出来的词"与"这一页该读的词"做多重集匹配。
 *
 * 只算数字，不保存音频、不保存转写文本。调用方负责让识别在本机完成。
 */

const PUNCTUATION = /[.,!?;:"“”'’—–-]/g

/** 归一化分词：小写、去标点、压空白 */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(PUNCTUATION, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

/**
 * 准确率 = 命中词数 / 目标词数，0–1。
 *
 * 用词频取最小值而不是集合去重，重复词（"the cat and the dog"）不会被算成满分。
 * 目标为空时返回 0，避免把"没读"记成"读得完美"。
 */
export function readAlongAccuracy(target: string, spoken: string): number {
  const targetWords = normalizeWords(target)
  if (targetWords.length === 0) return 0

  const spokenCount = new Map<string, number>()
  for (const word of normalizeWords(spoken)) {
    spokenCount.set(word, (spokenCount.get(word) ?? 0) + 1)
  }

  let matched = 0
  for (const word of targetWords) {
    const left = spokenCount.get(word) ?? 0
    if (left > 0) {
      matched++
      spokenCount.set(word, left - 1)
    }
  }

  return Number((matched / targetWords.length).toFixed(4))
}
