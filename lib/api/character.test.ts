import { describe, it, expect } from 'vitest'
import { buildConsistencyLine, fallbackCharacterCard } from './character'
import type { CharacterCard } from '@/lib/types/book'

const CHILD_CARD: CharacterCard = {
  name: 'Luna',
  roleType: 'protagonist',
  ageFeel: 'young child, cute and friendly',
  appearance: 'round face, big friendly eyes',
  hairOrFur: 'brown curly hair',
  clothing: 'red dress',
  signatureProp: 'a wooden flute',
  personality: 'kind',
  commonExpressions: 'happy smile',
  commonActions: 'walking',
  storyProblem: 'a small problem',
  noChangeItems: 'face shape, eye color',
}

describe('buildConsistencyLine — child cards (regression pin)', () => {
  it('produces the exact legacy sentence for a card without kind', () => {
    expect(buildConsistencyLine(CHILD_CARD)).toBe(
      'CONSISTENCY LOCK — the protagonist is ALWAYS the exact same "Luna"; ' +
        'protagonist, young child, cute and friendly, round face, big friendly eyes, brown curly hair, wearing red dress, a wooden flute, typical expressions: happy smile; ' +
        'keep face shape, eye color identical in EVERY page; ' +
        'do NOT change the face, colors, clothing or body proportions between pages',
    )
  })

  it('is unchanged when kind is explicitly child', () => {
    expect(buildConsistencyLine({ ...CHILD_CARD, kind: 'child' })).toBe(
      buildConsistencyLine(CHILD_CARD),
    )
  })
})

describe('buildConsistencyLine — pet cards', () => {
  const petCard: CharacterCard = {
    ...CHILD_CARD,
    name: 'Buddy',
    kind: 'pet',
    species: 'dog',
    roleType: 'pet protagonist',
    ageFeel: 'adult dog, warm and loyal',
    appearance: 'friendly golden retriever face',
    hairOrFur: 'cream coat with a white chest patch',
    clothing: '',
    signatureProp: 'a red collar with a round brass name tag',
    noChangeItems: 'face shape, coat colors and markings, collar color, name tag',
  }

  it('names the species and locks coat, markings, collar and tag', () => {
    const line = buildConsistencyLine(petCard)
    expect(line).toContain('CONSISTENCY LOCK — the protagonist is ALWAYS the exact same "Buddy"')
    expect(line).toContain('a dog')
    expect(line).toContain('cream coat with a white chest patch')
    expect(line).toContain('keep face shape, coat colors and markings, collar color, name tag identical in EVERY page')
    expect(line).toContain('do NOT change the face, coat colors, markings, collar, name tag or body proportions between pages')
  })

  it('does not use the child clothing invariant clause', () => {
    expect(buildConsistencyLine(petCard)).not.toContain('colors, clothing or body proportions')
  })

  it('omits the species phrase when species is unknown', () => {
    const { species: _omitted, ...noSpecies } = petCard
    expect(buildConsistencyLine(noSpecies)).not.toContain('a dog')
    expect(buildConsistencyLine(noSpecies)).toContain('pet protagonist')
  })
})

describe('fallbackCharacterCard', () => {
  it('keeps the child fallback unchanged by default', () => {
    const card = fallbackCharacterCard('Luna', 'illustrated')
    expect(card.kind).toBeUndefined()
    expect(card.roleType).toBe('protagonist')
    expect(card.ageFeel).toBe('young child, cute and friendly')
    expect(card.clothing).toBe("simple bright children's outfit")
    expect(card.photoUsage).toBe('illustrated')
  })

  it('builds a pet fallback with species and collar/tag invariants', () => {
    const card = fallbackCharacterCard('Buddy', 'illustrated', 'pet', 'dog')
    expect(card.kind).toBe('pet')
    expect(card.species).toBe('dog')
    expect(card.roleType).toBe('pet protagonist')
    expect(card.signatureProp).toContain('collar')
    expect(card.noChangeItems).toContain('markings')
    expect(card.noChangeItems).toContain('collar')
    expect(card.noChangeItems).toContain('name tag')
    expect(card.clothing).toBe('')
  })

  it('defaults an unknown pet species to dog', () => {
    const card = fallbackCharacterCard('Buddy', 'illustrated', 'pet')
    expect(card.species).toBe('dog')
    expect(card.ageFeel).toContain('dog')
  })

  it('defaults photoUsage to illustrated when none is given', () => {
    expect(fallbackCharacterCard('Buddy', undefined, 'pet', 'cat').photoUsage).toBe('illustrated')
  })
})
