import { describe, it, expect } from 'vitest'
import { shuffleOptions } from './quiz-generator'

describe('shuffleOptions', () => {
  it('keeps the same options and points the answer at the same text', () => {
    const options = ['shiny treasure', 'a big dog', 'her lost toy', 'a blue hat']
    const { options: shuffled, answer } = shuffleOptions(options, 0)

    expect([...shuffled].sort()).toEqual([...options].sort())
    expect(shuffled[answer]).toBe('shiny treasure')
  })

  it('always returns an in-range answer index', () => {
    for (let i = 0; i < 100; i++) {
      const { answer } = shuffleOptions(['a', 'b', 'c', 'd'], i % 4)
      expect(answer).toBeGreaterThanOrEqual(0)
      expect(answer).toBeLessThan(4)
    }
  })

  it('moves the correct answer away from the first slot', () => {
    // The model used to put every answer at index 0; after shuffling the position
    // must vary, otherwise children can win by always tapping the first option.
    const positions = new Set<number>()
    for (let i = 0; i < 200; i++) {
      positions.add(shuffleOptions(['a', 'b', 'c', 'd'], 0).answer)
    }
    expect(positions.size).toBeGreaterThan(1)
  })
})
