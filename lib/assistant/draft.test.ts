import { describe, expect, it } from 'vitest'
import { emptyBrief } from '@/lib/assistant/brief'
import { clearBuddyDraft, loadBuddyDraft, saveBuddyDraft, type BuddyDraft } from './draft'

function memory(): Storage {
  const data = new Map<string, string>()
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => { data.delete(key) },
    setItem: (key, value) => { data.set(key, value) },
  }
}

const draft: BuddyDraft = {
  personaId: 'lila',
  messages: [{ id: 'hello', role: 'buddy', text: 'Hi' }],
  brief: { ...emptyBrief(), childName: 'Mia', theme: 'dinosaurs', ageGroup: '5-7', level: 'C', pages: 8 },
  proposal: {
    childName: 'Mia',
    ageGroup: '5-7',
    theme: 'dinosaurs',
    level: 'C',
    pages: 8,
    costUnits: 1,
    levelLabel: 'C · Early',
    capped: false,
  },
}

describe('buddy draft', () => {
  it('restores the confirmation after a round trip', () => {
    const storage = memory()
    saveBuddyDraft(storage, draft)
    expect(loadBuddyDraft(storage)?.proposal?.childName).toBe('Mia')
    expect(loadBuddyDraft(storage)?.personaId).toBe('lila')
  })

  it('drops a corrupted draft', () => {
    const storage = memory()
    storage.setItem('sprouttales.buddy.draft', '{')
    expect(loadBuddyDraft(storage)).toBeNull()
    saveBuddyDraft(storage, draft)
    clearBuddyDraft(storage)
    expect(loadBuddyDraft(storage)).toBeNull()
  })
})
