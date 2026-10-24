import { describe, it, expect } from 'vitest'
import { normalizeWords, readAlongAccuracy } from './readalong'

describe('read-along accuracy', () => {
  it('normalizes case and punctuation', () => {
    expect(normalizeWords('Mia, look! The  Lantern.')).toEqual(['mia', 'look', 'the', 'lantern'])
  })

  it('scores a perfect read as 1', () => {
    expect(readAlongAccuracy('Mia holds the lantern.', 'mia holds the lantern')).toBe(1)
  })

  it('scores a partial read proportionally', () => {
    // 4 个词里读对 2 个
    expect(readAlongAccuracy('Mia holds the lantern', 'mia holds a bucket')).toBe(0.5)
  })

  it('ignores extra words the child adds', () => {
    expect(readAlongAccuracy('Mia holds the lantern', 'um mia holds the big lantern')).toBe(1)
  })

  it('does not let repeated words inflate the score', () => {
    // 目标里 the 出现两次，只说一次只能算一次
    expect(readAlongAccuracy('the cat and the dog', 'the cat and dog')).toBe(0.8)
  })

  it('returns 0 for an empty target or empty speech', () => {
    expect(readAlongAccuracy('', 'anything')).toBe(0)
    expect(readAlongAccuracy('Mia holds the lantern', '')).toBe(0)
  })

  it('never returns outside 0–1', () => {
    const score = readAlongAccuracy('a b c', 'a b c a b c')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })
})
