import { describe, expect, it } from 'vitest'
import { ageArtBrief, ageArtDirection, ageBand } from './age-art'

describe('age art direction', () => {
  it('keeps the four product age groups', () => {
    expect(ageBand('0-3')).toBe('0-3')
    expect(ageBand('3-5')).toBe('3-5')
    expect(ageBand('5-7')).toBe('5-7')
    expect(ageBand('7-10')).toBe('7-10')
  })

  it('reads the first number when the label is not an exact band', () => {
    expect(ageBand('6-8')).toBe('5-7')
    expect(ageBand('9-12')).toBe('7-10')
    expect(ageBand('')).toBe('3-5')
  })

  it('stops older books from using toddler proportions', () => {
    const older = ageArtDirection('7-10')
    expect(older.proportionLock).toContain('not a toddler')
    expect(older.fallbackStyle).toContain('illustrated chapter')
    expect(older.appearance).not.toContain('fluffy')

    const early = ageArtDirection('5-7')
    expect(early.proportionLock).toContain('school-age')
    expect(early.fallbackStyle).not.toContain('toddler picture book')
  })

  it('keeps preschool books simple without calling them babies', () => {
    const preschool = ageArtDirection('3-5')
    expect(preschool.proportionLock).toContain('not a baby')
    expect(ageArtBrief('3-5')).toContain('Only ages 0-3 use toddler proportions')
  })
})
