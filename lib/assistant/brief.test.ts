import { describe, expect, it } from 'vitest'
import {
  absorb,
  emptyBrief,
  nextFocus,
  toProposal,
} from './brief'

describe('story buddy brief', () => {
  it('fills a complete English request in one sentence', () => {
    const brief = absorb(
      emptyBrief(),
      'Make an 8-page GRL C book about dinosaurs for Mia, age 6.',
      'childName',
    )
    const proposal = toProposal(brief, 8)
    expect(proposal).toMatchObject({
      childName: 'Mia',
      theme: 'dinosaurs',
      ageGroup: '5-7',
      level: 'C',
      pages: 8,
      costUnits: 1,
      capped: false,
    })
    expect(nextFocus(brief)).toBeNull()
  })

  it('fills a Chinese request and asks nothing else', () => {
    const brief = absorb(emptyBrief(), '给米娅做一本关于月亮的书，6岁', 'childName')
    expect(brief.childName).toBe('米娅')
    expect(brief.theme).toBe('月亮')
    expect(brief.ageGroup).toBe('5-7')
    expect(toProposal(brief, 8)?.level).toBe('C')
  })

  it('asks one missing piece at a time', () => {
    const named = absorb(emptyBrief(), 'Please make a book', 'childName')
    expect(nextFocus(named)).toBe('childName')

    const withName = absorb(named, 'leo', 'childName')
    expect(withName.childName).toBe('Leo')
    expect(nextFocus(withName)).toBe('theme')

    const withTheme = absorb(withName, 'a paper boat in the rain', 'theme')
    expect(withTheme.theme).toBe('paper boat in the rain')
    expect(nextFocus(withTheme)).toBe('age')

    const ready = absorb(withTheme, 'she is 4', 'age')
    expect(ready.ageGroup).toBe('3-5')
    expect(ready.level).toBe('B')
  })

  it('caps pages to the current plan and charges two credits past 12', () => {
    const brief = absorb(
      emptyBrief(),
      'A 20-page book about the moon for Noah, age 8, level E.',
      'childName',
    )
    const free = toProposal(brief, 8)
    expect(free?.pages).toBe(8)
    expect(free?.capped).toBe(true)
    expect(free?.costUnits).toBe(1)

    const studio = toProposal(brief, 24)
    expect(studio?.pages).toBe(20)
    expect(studio?.capped).toBe(false)
    expect(studio?.costUnits).toBe(2)
  })

  it('maps reading level D onto ages 5-7 when no age is given', () => {
    const brief = absorb(emptyBrief(), 'Level D book about a quiet garden for Kai.', 'childName')
    expect(toProposal(brief, 16)).toMatchObject({
      childName: 'Kai',
      level: 'D',
      ageGroup: '5-7',
      theme: 'quiet garden',
    })
  })
})
