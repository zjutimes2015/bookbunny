import { describe, expect, it } from 'vitest'
import type { CharacterCard, PageOutline, StoryResult } from '@/lib/types/book'
import type { Proposal } from './brief'
import {
  bookPayload,
  characterFields,
  illustrationBatches,
  illustrationPayload,
  storyPayload,
} from './pipeline'

const proposal: Proposal = {
  childName: 'Mia',
  ageGroup: '5-7',
  theme: 'dinosaurs',
  level: 'C',
  pages: 8,
  costUnits: 1,
  levelLabel: 'C · Early',
  capped: false,
}

const card = { name: 'Mia' } as CharacterCard

const story = {
  title: 'Mia and the Dinosaurs',
  outline: [
    { pageNumber: 1, pageText: 'Mia sees a dinosaur.' },
    { pageNumber: 2, pageText: 'The dinosaur waves.' },
  ] as PageOutline[],
  tables: { tableA: [], tableB: [] },
  level: 'C',
  quiz: null,
} as unknown as StoryResult

describe('story buddy pipeline payloads', () => {
  it('creates an illustrated character with no photo', () => {
    expect(characterFields(proposal)).toEqual({
      name: 'Mia',
      theme: 'dinosaurs',
      ageGroup: '5-7',
      photoUsage: 'illustrated',
      language: 'en',
    })
    expect(characterFields(proposal)).not.toHaveProperty('photo')
  })

  it('sends the confirmed spec to the story and save steps', () => {
    expect(storyPayload(proposal, { name: 'Mia', card }, 'token')).toMatchObject({
      theme: 'dinosaurs',
      characterName: 'Mia',
      pages: 8,
      level: 'C',
      characterCards: [card],
      turnstileToken: 'token',
    })

    expect(bookPayload(proposal, { name: 'Mia', card, imageB64: 'abc' }, story)).toMatchObject({
      title: 'Mia and the Dinosaurs',
      ageGroup: '5-7',
      aspect: '1:1',
      character: { name: 'Mia', imageB64: 'abc' },
    })
  })

  it('illustrates in batches of five pages', () => {
    const outline = Array.from({ length: 12 }, (_, i) => ({ pageNumber: i + 1 }))
    const batches = illustrationBatches(outline, 5)
    expect(batches.map((batch) => batch.length)).toEqual([5, 5, 2])

    const payload = illustrationPayload({
      title: story.title,
      outline: story.outline,
      bookId: 'book-1',
      character: { name: 'Mia', consistencyLine: 'same face', imageB64: 'abc' },
      turnstileToken: 'token',
    })
    expect(payload.bookId).toBe('book-1')
    expect(payload.characterImageB64).toBe('abc')
    expect(payload.outline).toHaveLength(2)
  })
})
