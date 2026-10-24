import { describe, it, expect } from 'vitest'
import {
  READING_EVENT_TYPES,
  clampRatio,
  isReadingEventType,
  toBookInsights,
  toWorldInsights,
} from './analytics'

describe('isReadingEventType', () => {
  it('accepts every whitelisted event type', () => {
    for (const type of READING_EVENT_TYPES) {
      expect(isReadingEventType(type)).toBe(true)
    }
  })

  it('rejects anything outside the whitelist', () => {
    expect(isReadingEventType('page_scroll')).toBe(false)
    expect(isReadingEventType('BOOK_OPEN')).toBe(false)
    expect(isReadingEventType(null)).toBe(false)
    expect(isReadingEventType(42)).toBe(false)
  })
})

describe('clampRatio', () => {
  it('passes through values already inside 0–1', () => {
    expect(clampRatio(0)).toBe(0)
    expect(clampRatio(0.42)).toBe(0.42)
    expect(clampRatio(1)).toBe(1)
  })

  it('clamps out-of-range numbers into 0–1', () => {
    expect(clampRatio(95)).toBe(1)
    expect(clampRatio(-3)).toBe(0)
    expect(clampRatio(1.7)).toBe(1)
  })

  it('coerces numeric strings and returns null for junk', () => {
    expect(clampRatio('0.25')).toBe(0.25)
    expect(clampRatio('abc')).toBeNull()
    expect(clampRatio(undefined)).toBeNull()
    expect(clampRatio(null)).toBeNull()
    expect(clampRatio(Number.NaN)).toBeNull()
    expect(clampRatio(Number.POSITIVE_INFINITY)).toBeNull()
  })
})

describe('toBookInsights', () => {
  it('returns an empty-but-valid shape when a book has no events', () => {
    expect(toBookInsights(undefined)).toEqual({
      opens: 0,
      finished: false,
      pagesSeen: 0,
      replays: 0,
      quizAttempts: 0,
      quizAccuracy: null,
      readAlongSamples: 0,
      readAlongAccuracy: null,
      lastReadAt: null,
    })
  })

  it('normalises SQL numeric strings and dates', () => {
    const insights = toBookInsights({
      opens: 2,
      completions: 1,
      pages_seen: 12,
      replays: 3,
      quiz_attempts: 2,
      quiz_accuracy: '0.7500',
      readalong_samples: 4,
      readalong_accuracy: '0.4000',
      last_read_at: '2026-10-24T08:00:00.000Z',
    })

    expect(insights.finished).toBe(true)
    expect(insights.quizAccuracy).toBe(0.75)
    expect(insights.readAlongAccuracy).toBe(0.4)
    expect(insights.lastReadAt).toBe('2026-10-24T08:00:00.000Z')
  })

  it('treats a zero-accuracy quiz as a real number, not missing data', () => {
    const insights = toBookInsights({
      opens: 1,
      completions: 0,
      pages_seen: 0,
      replays: 0,
      quiz_attempts: 1,
      quiz_accuracy: '0.0000',
      readalong_samples: 0,
      readalong_accuracy: null,
      last_read_at: new Date('2026-10-24T09:30:00.000Z'),
    })

    expect(insights.finished).toBe(false)
    expect(insights.quizAccuracy).toBe(0)
    expect(insights.readAlongAccuracy).toBeNull()
    expect(insights.lastReadAt).toBe('2026-10-24T09:30:00.000Z')
  })
})

describe('toWorldInsights', () => {
  it('returns null rates for a world nobody has read yet', () => {
    expect(toWorldInsights(undefined, null)).toEqual({
      families: 0,
      episodes: 0,
      completionRate: null,
      replaysPerEpisode: null,
      quizAccuracy: null,
      readAlongAccuracy: null,
      topMoral: null,
    })
  })

  it('derives completion rate and replays per episode', () => {
    const insights = toWorldInsights(
      {
        families: 3,
        episodes: 4,
        completed: 2,
        replays: 6,
        quiz_accuracy: '0.5',
        readalong_accuracy: null,
      },
      'Ask a friend for help',
    )

    expect(insights.families).toBe(3)
    expect(insights.completionRate).toBe(0.5)
    expect(insights.replaysPerEpisode).toBe(1.5)
    expect(insights.quizAccuracy).toBe(0.5)
    expect(insights.readAlongAccuracy).toBeNull()
    expect(insights.topMoral).toBe('Ask a friend for help')
  })
})
