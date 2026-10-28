import type { Proposal } from '@/lib/assistant/brief'
import {
  bookPayload,
  characterFields,
  illustrationBatches,
  illustrationPayload,
  storyPayload,
  type CharacterDraft,
} from '@/lib/assistant/pipeline'
import type { CharacterCard, PageOutline, StoryResult } from '@/lib/types/book'

export type ProducePhase = 'character' | 'story' | 'save' | 'illustrate'

export interface ProduceProgress {
  phase: ProducePhase
  detail: string
  completed: number
  total: number
}

export class ProduceError extends Error {
  code: 'human' | 'auth' | 'allowance' | 'rate' | 'failed'
  /** 书已经写入图书馆、但后面的插画没画完时带上，方便家长打开已扣额度的那本 */
  bookId?: string

  constructor(message: string, code: ProduceError['code']) {
    super(message)
    this.code = code
  }
}

export async function produceConfirmedBook(opts: {
  proposal: Proposal
  turnstileToken: string
  signal?: AbortSignal
  onProgress: (progress: ProduceProgress) => void
}): Promise<{ bookId: string; title: string }> {
  const { proposal, turnstileToken, signal, onProgress } = opts

  await ensureHumanPass(turnstileToken, signal)

  onProgress({
    phase: 'character',
    detail: `Drawing ${proposal.childName} so every page matches.`,
    completed: 0,
    total: proposal.pages,
  })
  const character = await createCharacter(proposal, turnstileToken, signal)

  onProgress({
    phase: 'story',
    detail: `Writing the outline at ${proposal.levelLabel}.`,
    completed: 0,
    total: proposal.pages,
  })
  const story = await createStory(proposal, character, turnstileToken, signal)

  onProgress({
    phase: 'save',
    detail: 'Saving this book to your library.',
    completed: 0,
    total: story.outline.length,
  })
  let bookId = ''
  try {
    bookId = await saveBook(proposal, character, story, signal)
    await illustrateSavedBook({
      bookId,
      story,
      character,
      turnstileToken,
      signal,
      onProgress,
    })
  } catch (err) {
    if (!bookId) throw err
    if (isAbort(err)) throw err
    const failed = err instanceof ProduceError
      ? err
      : new ProduceError(err instanceof Error ? err.message : 'The book could not be finished.', 'failed')
    failed.bookId = bookId
    throw failed
  }

  return { bookId, title: story.title }
}

async function illustrateSavedBook(input: {
  bookId: string
  story: StoryResult
  character: CharacterDraft
  turnstileToken: string
  signal?: AbortSignal
  onProgress: (progress: ProduceProgress) => void
}): Promise<void> {
  const { bookId, story, character, turnstileToken, signal, onProgress } = input
  const batches = illustrationBatches(story.outline, 5)
  let completed = 0
  for (const batch of batches) {
    onProgress({
      phase: 'illustrate',
      detail: `Illustrating pages ${batch[0]?.pageNumber ?? 1}–${batch[batch.length - 1]?.pageNumber ?? 1}.`,
      completed,
      total: story.outline.length,
    })
    const drawn = await illustrateBatch({
      title: story.title,
      outline: batch,
      bookId,
      character,
      turnstileToken,
      signal,
      onPage: (done, total) => {
        onProgress({
          phase: 'illustrate',
          detail: `Drawing page ${Math.min(completed + done, story.outline.length)} of ${story.outline.length}.`,
          completed: completed + done,
          total,
        })
      },
    })
    completed += drawn
  }
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

async function ensureHumanPass(token: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch('/api/verify-turnstile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) {
    throw new ProduceError(
      typeof data.error === 'string' ? data.error : 'Please complete the human check.',
      'human',
    )
  }
}

async function createCharacter(
  proposal: Proposal,
  turnstileToken: string,
  signal?: AbortSignal,
): Promise<CharacterDraft> {
  const body = new FormData()
  for (const [key, value] of Object.entries(characterFields(proposal))) {
    body.append(key, value)
  }
  body.append('turnstileToken', turnstileToken)
  const res = await fetch('/api/create-character', { method: 'POST', body, signal })
  const data = await readJson(res)
  if (!res.ok) throw errorFor(res.status, data)
  return {
    name: typeof data.name === 'string' ? data.name : proposal.childName,
    card: asCard(data.card),
    consistencyLine: typeof data.consistencyLine === 'string' ? data.consistencyLine : undefined,
    imageB64: typeof data.imageB64 === 'string' ? data.imageB64 : undefined,
    refSeed: typeof data.refSeed === 'number' ? data.refSeed : undefined,
  }
}

async function createStory(
  proposal: Proposal,
  character: CharacterDraft,
  turnstileToken: string,
  signal?: AbortSignal,
): Promise<StoryResult> {
  const res = await fetch('/api/create-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storyPayload(proposal, character, turnstileToken)),
    signal,
  })
  const data = await readJson(res)
  if (!res.ok) throw errorFor(res.status, data)
  if (!data.title || !Array.isArray(data.outline) || data.outline.length === 0) {
    throw new ProduceError('The outline came back empty.', 'failed')
  }
  return data as unknown as StoryResult
}

async function saveBook(
  proposal: Proposal,
  character: CharacterDraft,
  story: StoryResult,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookPayload(proposal, character, story)),
    signal,
  })
  const data = await readJson(res)
  if (!res.ok) throw errorFor(res.status, data)
  if (typeof data.bookId !== 'string' || !data.bookId) {
    throw new ProduceError('The book was not saved.', 'failed')
  }
  return data.bookId
}

async function illustrateBatch(input: {
  title: string
  outline: PageOutline[]
  bookId: string
  character: CharacterDraft
  turnstileToken: string
  signal?: AbortSignal
  onPage: (completed: number, total: number) => void
}): Promise<number> {
  const res = await fetch('/api/generate-pages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(illustrationPayload(input)),
    signal: input.signal,
  })
  const data = await readJson(res)
  if (!res.ok) throw errorFor(res.status, data)
  const genId = data.genId
  if (typeof genId !== 'string') throw new ProduceError('Illustration did not start.', 'failed')

  const started = Date.now()
  while (Date.now() - started < 8 * 60 * 1000) {
    await delay(1500, input.signal)
    const poll = await fetch(`/api/generate-pages?genId=${encodeURIComponent(genId)}`, {
      signal: input.signal,
    })
    const job = await readJson(poll)
    if (!poll.ok) throw errorFor(poll.status, job)
    const completed = typeof job.completed === 'number' ? job.completed : 0
    const total = typeof job.total === 'number' ? job.total : input.outline.length
    input.onPage(completed, total)
    if (job.status === 'done') return input.outline.length
    if (job.status === 'error') {
      throw new ProduceError('Some pages could not be illustrated.', 'failed')
    }
  }
  throw new ProduceError('Illustration took too long. Open the book to see what finished.', 'failed')
}

function errorFor(status: number, data: Json): ProduceError {
  const message = typeof data.error === 'string' ? data.error : `Request failed (${status}).`
  if (status === 402 || data.code === 'no_allocation') {
    return new ProduceError(message, 'allowance')
  }
  if (status === 401) return new ProduceError(message, 'auth')
  if (status === 429 || data.code === 'rate_limited') return new ProduceError(message, 'rate')
  if (status === 403) return new ProduceError(message, 'human')
  return new ProduceError(message, 'failed')
}

type Json = Record<string, unknown> & { error?: string; code?: string }

async function readJson(res: Response): Promise<Json> {
  const data = await res.json().catch(() => ({}))
  return data && typeof data === 'object' ? data as Json : {}
}

function asCard(value: unknown): CharacterCard | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as CharacterCard
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}
