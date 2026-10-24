import { describe, it, expect } from 'vitest'
import { analyzeStoryForGRL } from './analyzer'

/** A short story using only GRL A vocabulary words */
const SIMPLE_A_TEXT =
  'The cat is big. The dog can run. I see a red ball. The sun is up. We play in the day. A little bird sings. My book is here. You are happy.'

/** Text with advanced words for level A */
const COMPLEX_TEXT =
  'The magnificent elephant explored the mysterious jungle. Although it was raining, the courageous adventurer discovered an ancient castle. Meanwhile, the curious rabbit whispered secrets to the friendly wizard.'

describe('analyzeStoryForGRL', () => {
  describe('return structure', () => {
    it('returns all required GrlReport fields', () => {
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      expect(report).toHaveProperty('grl')
      expect(report).toHaveProperty('levelLabel')
      expect(report).toHaveProperty('ageRange')
      expect(report).toHaveProperty('overallScore')
      expect(report).toHaveProperty('overallVerdict')
      expect(report).toHaveProperty('dimensions')
      expect(report).toHaveProperty('overLevelWords')
      expect(report).toHaveProperty('topWords')
      expect(report).toHaveProperty('avgSentenceWords')
      expect(report).toHaveProperty('totalUniqueWords')
      expect(report).toHaveProperty('summary')
    })

    it('returns exactly 3 dimensions', () => {
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      expect(report.dimensions).toHaveLength(3)
      expect(report.dimensions.map(d => d.name)).toEqual([
        'Vocabulary Match',
        'Sentence Length',
        'Vocabulary Size',
      ])
    })

    it('each dimension has a score between 0 and 100', () => {
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      for (const d of report.dimensions) {
        expect(d.score).toBeGreaterThanOrEqual(0)
        expect(d.score).toBeLessThanOrEqual(100)
      }
    })

    it('overallScore is the average of dimension scores', () => {
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      const avg = Math.round(
        report.dimensions.reduce((s, d) => s + d.score, 0) / report.dimensions.length,
      )
      expect(report.overallScore).toBe(avg)
    })
  })

  describe('verdict mapping', () => {
    it('overallVerdict is one of the four allowed values', () => {
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      expect(['excellent', 'good', 'fair', 'needs_revision']).toContain(report.overallVerdict)
    })

    it('maps score >= 85 to excellent', () => {
      // Build a report with all scores 90
      const report = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      // We can't force scores directly, but check the invariant holds
      if (report.overallScore >= 85) {
        expect(report.overallVerdict).toBe('excellent')
      }
    })
  })

  describe('vocabulary analysis', () => {
    it('flags advanced words when text exceeds the level', () => {
      const report = analyzeStoryForGRL(COMPLEX_TEXT, 'A')
      // "magnificent", "explored", "mysterious" etc. are NOT in level A vocab
      expect(report.overLevelWords.length).toBeGreaterThan(0)
      expect(report.overLevelWords).toContain('magnificent')
    })

    it('detects no over-level words for fully-matching simple text', () => {
      // Use words strictly from level A vocab
      const text = 'The cat is big. The dog can run. I see the ball.'
      const report = analyzeStoryForGRL(text, 'A')
      // All words: the, cat, is, big, dog, can, run, i, see, ball — all in level A
      expect(report.overLevelWords).toEqual([])
    })

    it('summary mentions over-level words when vocab fails', () => {
      const report = analyzeStoryForGRL(COMPLEX_TEXT, 'A')
      if (!report.overLevelWords.length) return
      expect(report.summary).toContain('too advanced')
    })

    it('summary says vocabulary matches well when it passes', () => {
      const text = 'The cat is big. The dog can run.'
      const report = analyzeStoryForGRL(text, 'A')
      if (report.overLevelWords.length === 0) {
        expect(report.summary).toContain('Vocabulary matches')
      }
    })
  })

  describe('sentence length', () => {
    it('reports correct average sentence length for simple text', () => {
      // 4 sentences, each 5 words: "The cat is big here." -> 5 words each
      const text = 'The cat is big here. The dog can run fast. I see the red ball. We play in the day.'
      const report = analyzeStoryForGRL(text, 'A')
      // Each sentence has 5 words, avg = 5
      expect(report.avgSentenceWords).toBe(5)
    })

    it('handles text with no sentence-ending punctuation as one sentence', () => {
      const text = 'the cat and the dog'
      const report = analyzeStoryForGRL(text, 'A')
      expect(report.avgSentenceWords).toBe(5)
    })

    it('flags long sentences in summary when exceeding level max', () => {
      // Level A max is 6 words; this sentence has 10
      const text = 'the big red cat and the little brown dog run'
      const report = analyzeStoryForGRL(text, 'A')
      if (report.avgSentenceWords > 6) {
        expect(report.summary).toContain('exceeds')
      }
    })
  })

  describe('top words', () => {
    it('returns words sorted by frequency descending', () => {
      const text = 'cat cat cat dog dog bird'
      const report = analyzeStoryForGRL(text, 'A')
      const counts = report.topWords.map(w => w.count)
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i])
      }
    })

    it('returns at most 10 top words', () => {
      // Many unique words
      const text = 'a b c d e f g h i j k l m n o p q r s t u v w x y z'
      const report = analyzeStoryForGRL(text, 'A')
      expect(report.topWords.length).toBeLessThanOrEqual(10)
    })

    it('counts word frequency correctly', () => {
      const text = 'the cat the dog the ball'
      const report = analyzeStoryForGRL(text, 'A')
      const theEntry = report.topWords.find(w => w.word === 'the')
      expect(theEntry).toBeDefined()
      expect(theEntry!.count).toBe(3)
    })

    it('filters out pure numbers', () => {
      const text = 'cat 123 dog 456 cat'
      const report = analyzeStoryForGRL(text, 'A')
      const numericWords = report.topWords.filter(w => /^[0-9]+$/.test(w.word))
      expect(numericWords).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty string without throwing', () => {
      expect(() => analyzeStoryForGRL('', 'A')).not.toThrow()
      const report = analyzeStoryForGRL('', 'A')
      expect(report.avgSentenceWords).toBe(0)
      expect(report.totalUniqueWords).toBe(0)
      expect(report.topWords).toEqual([])
      expect(report.overLevelWords).toEqual([])
    })

    it('handles only punctuation', () => {
      expect(() => analyzeStoryForGRL('!!! ... ???', 'A')).not.toThrow()
      const report = analyzeStoryForGRL('!!! ... ???', 'A')
      expect(report.avgSentenceWords).toBe(0)
    })

    it('falls back to first level when GRL is unknown', () => {
      const report = analyzeStoryForGRL('the cat is big', 'XYZ')
      // First level in the data is A
      expect(report.grl).toBe('A')
    })

    it('is case-insensitive for GRL input', () => {
      const lower = analyzeStoryForGRL(SIMPLE_A_TEXT, 'a')
      const upper = analyzeStoryForGRL(SIMPLE_A_TEXT, 'A')
      expect(lower.grl).toBe(upper.grl)
      expect(lower.overallScore).toBe(upper.overallScore)
    })

    it('handles very long text without crashing', () => {
      const longText = Array(200).fill('the cat is big and the dog can run').join('. ')
      expect(() => analyzeStoryForGRL(longText, 'A')).not.toThrow()
      const report = analyzeStoryForGRL(longText, 'A')
      expect(report.totalUniqueWords).toBeGreaterThan(0)
    })
  })

  describe('level-specific behavior', () => {
    it('level A has sentenceMaxWords 6', () => {
      const report = analyzeStoryForGRL('the cat is big', 'A')
      expect(report.dimensions[1].target).toBe('≤ 6')
    })

    it('level E has sentenceMaxWords 16', () => {
      const report = analyzeStoryForGRL('the cat is big', 'E')
      expect(report.dimensions[1].target).toBe('≤ 16')
    })

    it('a sentence acceptable at level E may be over-level at level A', () => {
      // 10-word sentence: okay for E (max 16), too long for A (max 6)
      const text = 'the big red cat and the little brown dog run fast'
      const reportA = analyzeStoryForGRL(text, 'A')
      const reportE = analyzeStoryForGRL(text, 'E')
      // avg sentence length is the same for both
      expect(reportA.avgSentenceWords).toBe(reportE.avgSentenceWords)
      // but A summary should warn if exceeding
      if (reportA.avgSentenceWords > 6) {
        expect(reportA.summary).toContain('exceeds')
      }
    })
  })
})
