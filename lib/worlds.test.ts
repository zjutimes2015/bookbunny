import { describe, it, expect } from 'vitest'
import { filterWorlds, worldThemes } from './worlds'

const WORLDS = [
  { id: 'a', ageRange: '3-5', theme: '勇敢' },
  { id: 'b', ageRange: '3-5', theme: '分享' },
  { id: 'c', ageRange: '6-8', theme: '勇敢' },
  { id: 'd', ageRange: '6-8', theme: '情绪管理' },
]

describe('world library filters', () => {
  it('returns everything when no filter is set', () => {
    expect(filterWorlds(WORLDS, {})).toHaveLength(4)
    expect(filterWorlds(WORLDS, { ageRange: null, theme: null })).toHaveLength(4)
  })

  it('filters by age band', () => {
    expect(filterWorlds(WORLDS, { ageRange: '3-5' }).map((w) => w.id)).toEqual(['a', 'b'])
    expect(filterWorlds(WORLDS, { ageRange: '6-8' }).map((w) => w.id)).toEqual(['c', 'd'])
  })

  it('filters by lesson theme', () => {
    expect(filterWorlds(WORLDS, { theme: '勇敢' }).map((w) => w.id)).toEqual(['a', 'c'])
  })

  it('combines both filters', () => {
    expect(filterWorlds(WORLDS, { ageRange: '6-8', theme: '勇敢' }).map((w) => w.id)).toEqual(['c'])
    expect(filterWorlds(WORLDS, { ageRange: '3-5', theme: '情绪管理' })).toHaveLength(0)
  })

  it('lists themes in archive order without duplicates', () => {
    expect(worldThemes(WORLDS)).toEqual(['勇敢', '分享', '情绪管理'])
  })
})
