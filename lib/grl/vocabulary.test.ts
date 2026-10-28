import { describe, it, expect } from 'vitest'
import {
  buildBookVocabulary,
  renderVocabularySheet,
  renderClassroomSheet,
  getLevelVocabulary,
} from './vocabulary'

const STORY = [
  'The cat sat on the mat.',
  'The cat saw a bird.',
  'The bird ran away.',
  'The cat ran after the bird.',
].join(' ')

describe('buildBookVocabulary', () => {
  it('lists every unique word with its frequency', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    expect(vocab.totalUniqueWords).toBeGreaterThan(0)
    const cat = vocab.allWords.find(w => w.word === 'cat')
    // "The cat" 出现 3 次（第 4 句是 "The bird ran away"）
    expect(cat?.count).toBe(3)
  })

  it('separates at-level words from above-level words', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const atLevel = new Set(vocab.atLevelWords.map(w => w.word))
    const above = new Set(vocab.aboveLevelWords.map(w => w.word))
    // 两组不能有交集
    for (const w of atLevel) expect(above.has(w)).toBe(false)
    // 每个词必须落在其中一组
    expect(atLevel.size + above.size).toBe(vocab.totalUniqueWords)
  })

  it('marks words that belong to the target level vocabulary', () => {
    // "cat" 和 "the" 是 A 级核心词
    const vocab = buildBookVocabulary(STORY, 'A')
    expect(vocab.atLevelWords.some(w => w.word === 'cat')).toBe(true)
  })

  it('reports coverage as a percentage', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    expect(vocab.coverage).toBeGreaterThanOrEqual(0)
    expect(vocab.coverage).toBeLessThanOrEqual(100)
  })

  it('handles empty text without crashing', () => {
    const vocab = buildBookVocabulary('', 'A')
    expect(vocab.totalUniqueWords).toBe(0)
    expect(vocab.coverage).toBe(0)
  })

  it('falls back to level C for an unknown level', () => {
    const vocab = buildBookVocabulary(STORY, 'Z')
    expect(vocab.grl).toBe('C')
  })

  it('sorts words by frequency descending', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const counts = vocab.allWords.map(w => w.count)
    const sorted = [...counts].sort((a, b) => b - a)
    expect(counts).toEqual(sorted)
  })
})

describe('renderVocabularySheet', () => {
  it('includes the book title, level and word counts', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const sheet = renderVocabularySheet(vocab, 'The Cat and the Bird')
    expect(sheet).toContain('The Cat and the Bird')
    expect(sheet).toContain('A')
    expect(sheet).toContain('AT-LEVEL WORDS')
    expect(sheet).toContain('ABOVE-LEVEL WORDS')
    expect(sheet).toContain('WORD FREQUENCY')
  })

  it('lists at-level words in the sheet', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const sheet = renderVocabularySheet(vocab, 'Story')
    expect(sheet).toContain('cat')
  })
})

describe('renderClassroomSheet', () => {
  it('produces a fill-in-the-blank section', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const sheet = renderClassroomSheet(vocab, 'The Cat')
    expect(sheet).toContain('PART 1 — Fill in the blank')
    expect(sheet).toContain('______________')
  })

  it('includes a teacher answer key', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const sheet = renderClassroomSheet(vocab, 'The Cat')
    expect(sheet).toContain('TEACHER ANSWER KEY')
  })

  it('answers match the focus words it asks for', () => {
    const vocab = buildBookVocabulary(STORY, 'A')
    const sheet = renderClassroomSheet(vocab, 'The Cat')
    const focus = vocab.atLevelWords.slice(0, 12)
    for (const entry of focus) {
      // 答案区必须包含每个待填空单词
      expect(sheet.split('TEACHER ANSWER KEY')[1]).toContain(entry.word)
    }
  })
})

describe('getLevelVocabulary', () => {
  it('returns the core vocabulary for a level', () => {
    const result = getLevelVocabulary('A')
    expect(result).not.toBeNull()
    expect(result?.grl).toBe('A')
    expect(result?.words.length).toBeGreaterThan(0)
  })

  it('returns null for an unknown level', () => {
    expect(getLevelVocabulary('Z')).toBeNull()
  })
})
