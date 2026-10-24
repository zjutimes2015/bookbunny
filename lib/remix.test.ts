import { describe, it, expect } from 'vitest'
import {
  REMIX_KINDS,
  buildSequelBrief,
  endingLine,
  isRemixKind,
  pickMoral,
} from './remix'

describe('remix rules', () => {
  it('exposes exactly the three remix moves', () => {
    expect(REMIX_KINDS.map((k) => k.id)).toEqual(['ending', 'scene', 'sidekick'])
  })

  it('rejects unknown remix kinds', () => {
    expect(isRemixKind('ending')).toBe(true)
    expect(isRemixKind('scene')).toBe(true)
    expect(isRemixKind('sidekick')).toBe(true)
    expect(isRemixKind('rewrite-everything')).toBe(false)
    expect(isRemixKind(undefined)).toBe(false)
  })

  describe('pickMoral', () => {
    const pool = ['勇敢一点', '分享', '坚持']

    it('rotates the moral by episode number', () => {
      expect(pickMoral(pool, 1)).toBe('勇敢一点')
      expect(pickMoral(pool, 2)).toBe('分享')
      expect(pickMoral(pool, 3)).toBe('坚持')
      expect(pickMoral(pool, 4)).toBe('勇敢一点')
    })

    it('returns null when the world has no moral pool', () => {
      expect(pickMoral([], 2)).toBeNull()
      expect(pickMoral(null, 2)).toBeNull()
      expect(pickMoral(undefined, 2)).toBeNull()
    })
  })

  describe('buildSequelBrief', () => {
    const base = {
      episodeNumber: 2,
      protagonistName: 'Mia',
      previousTitle: 'Mia and the Lantern',
      previousEnding: 'Mia hung the lantern and the path lit up.',
      worldName: '星星农场',
      worldScene: '云端上的小农场',
      cast: [{ name: '皮皮', role: '南瓜灯', catchphrase: '我试试。' }],
      moral: '害怕的时候可以先深呼吸',
      forbidden: ['没有真正的坏人。'],
    }

    it('frames the output as the next episode of the same series', () => {
      const brief = buildSequelBrief({ ...base, kind: 'ending' })
      expect(brief).toContain('EPISODE 2')
      expect(brief).toContain('Mia')
      expect(brief).toContain('Mia and the Lantern')
      expect(brief).toContain('Mia hung the lantern')
      expect(brief).toContain('星星农场')
      expect(brief).toContain('皮皮')
      expect(brief).toContain('害怕的时候可以先深呼吸')
    })

    it('gives each remix kind its own directive', () => {
      expect(buildSequelBrief({ ...base, kind: 'ending' })).toContain('DIFFERENT resolution')
      expect(buildSequelBrief({ ...base, kind: 'scene' })).toContain('another spot inside the same world')
      expect(buildSequelBrief({ ...base, kind: 'sidekick' })).toContain('supporting character lead')
    })

    it('always restates the child-safety hard rules', () => {
      const brief = buildSequelBrief({ ...base, kind: 'scene' })
      expect(brief).toContain('no villain')
      expect(brief).toContain('same art direction')
      expect(brief).toContain('没有真正的坏人。')
    })

    it('carries no account or photo identifiers — only story facts', () => {
      const brief = buildSequelBrief({ ...base, kind: 'ending' })
      expect(brief).not.toMatch(/user|account|photo|base64|http/i)
    })
  })

  it('takes the ending line from the last page', () => {
    expect(endingLine(['page one', 'the end'])).toBe('the end')
    expect(endingLine([])).toBeNull()
    expect(endingLine(null)).toBeNull()
  })
})
