import { neon } from '@neondatabase/serverless'

/**
 * 观测层：这一集读得怎么样。
 *
 * 事件全是"行为 + 数值"，没有任何孩子身份信息：
 * - book_open     打开一集
 * - page_view     翻到某一页（page_number）
 * - book_complete 读完（到最后一页或提交 quiz）
 * - replay        重播（朗读/跟读再播一次）
 * - quiz_submit   提交 quiz（value_num = 正确率，value_int = 题数）
 * - readalong     跟读练习（value_num = 词匹配准确率，音频不落库）
 */

export const READING_EVENT_TYPES = [
  'book_open',
  'page_view',
  'book_complete',
  'replay',
  'quiz_submit',
  'readalong',
] as const

export type ReadingEventType = (typeof READING_EVENT_TYPES)[number]

export interface ReadingEventInput {
  type: ReadingEventType
  page?: number
  /** 0–1 的比例（quiz 正确率 / 跟读准确率） */
  value?: number
  /** 整数（题目数、重播次数等） */
  count?: number
}

export function isReadingEventType(value: unknown): value is ReadingEventType {
  return typeof value === 'string' && (READING_EVENT_TYPES as readonly string[]).includes(value)
}

/** 比例统一收敛到 0–1，避免客户端传 95 / -1 / NaN */
export function clampRatio(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.min(1, Math.max(0, n))
}

export interface BookInsights {
  opens: number
  /** 读完了没有（这一集） */
  finished: boolean
  pagesSeen: number
  replays: number
  quizAttempts: number
  /** 0–1；没有提交过 quiz 时为 null */
  quizAccuracy: number | null
  readAlongSamples: number
  /** 0–1；没有跟读样本时为 null */
  readAlongAccuracy: number | null
  lastReadAt: string | null
}

export interface WorldInsights {
  families: number
  episodes: number
  /** 打开过的集里，读完的比例 0–1 */
  completionRate: number | null
  /** 平均每集重播次数 */
  replaysPerEpisode: number | null
  quizAccuracy: number | null
  readAlongAccuracy: number | null
  /** 这个世界上最受欢迎的寓意 */
  topMoral: string | null
}

interface BookRow {
  opens: number | null
  completions: number | null
  pages_seen: number | null
  replays: number | null
  quiz_attempts: number | null
  quiz_accuracy: string | number | null
  readalong_samples: number | null
  readalong_accuracy: string | number | null
  last_read_at: string | Date | null
}

interface WorldRow {
  families: number | null
  episodes: number | null
  completed: number | null
  replays: number | null
  quiz_accuracy: string | number | null
  readalong_accuracy: string | number | null
}

let client: ReturnType<typeof neon> | null = null
function sql() {
  return (client ??= neon(process.env.NEON_DATABASE_URL!))
}

/** 把 SQL 聚合行转成面板用的形状（纯函数，便于测试） */
export function toBookInsights(row: BookRow | undefined): BookInsights {
  return {
    opens: row?.opens ?? 0,
    finished: (row?.completions ?? 0) > 0,
    pagesSeen: row?.pages_seen ?? 0,
    replays: row?.replays ?? 0,
    quizAttempts: row?.quiz_attempts ?? 0,
    quizAccuracy: row?.quiz_accuracy == null ? null : Number(row.quiz_accuracy),
    readAlongSamples: row?.readalong_samples ?? 0,
    readAlongAccuracy: row?.readalong_accuracy == null ? null : Number(row.readalong_accuracy),
    lastReadAt: row?.last_read_at ? new Date(row.last_read_at).toISOString() : null,
  }
}

export function toWorldInsights(row: WorldRow | undefined, topMoral: string | null): WorldInsights {
  const episodes = row?.episodes ?? 0
  const completed = row?.completed ?? 0
  const replays = row?.replays ?? 0
  return {
    families: row?.families ?? 0,
    episodes,
    completionRate: episodes > 0 ? completed / episodes : null,
    replaysPerEpisode: episodes > 0 ? replays / episodes : null,
    quizAccuracy: row?.quiz_accuracy == null ? null : Number(row.quiz_accuracy),
    readAlongAccuracy: row?.readalong_accuracy == null ? null : Number(row.readalong_accuracy),
    topMoral,
  }
}

export interface RecordEventsInput {
  bookId: string
  userId: string
  seriesId: string | null
  worldId: string | null
  events: ReadingEventInput[]
}

/** 逐条写入；调用方已做鉴权与归属校验 */
export async function recordReadingEvents(input: RecordEventsInput): Promise<number> {
  let written = 0
  for (const event of input.events) {
    await sql()`
      INSERT INTO reading_events (book_id, user_id, series_id, world_id, event_type, page_number, value_num, value_int)
      VALUES (
        ${input.bookId}, ${input.userId}, ${input.seriesId}, ${input.worldId},
        ${event.type}, ${event.page ?? null}, ${event.value ?? null}, ${event.count ?? null}
      )
    `
    written++
  }
  return written
}

/** 单集学情（只给这集所属家庭看） */
export async function getBookInsights(bookId: string): Promise<BookInsights> {
  const rows = (await sql()`
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'book_open')::int      AS opens,
      COUNT(*) FILTER (WHERE event_type = 'book_complete')::int  AS completions,
      COUNT(DISTINCT page_number) FILTER (WHERE event_type = 'page_view')::int AS pages_seen,
      COUNT(*) FILTER (WHERE event_type = 'replay')::int         AS replays,
      COUNT(*) FILTER (WHERE event_type = 'quiz_submit')::int    AS quiz_attempts,
      AVG(value_num) FILTER (WHERE event_type = 'quiz_submit')   AS quiz_accuracy,
      COUNT(*) FILTER (WHERE event_type = 'readalong')::int      AS readalong_samples,
      AVG(value_num) FILTER (WHERE event_type = 'readalong')     AS readalong_accuracy,
      MAX(created_at)                                            AS last_read_at
    FROM reading_events
    WHERE book_id = ${bookId}
  `) as BookRow[]
  return toBookInsights(rows[0])
}

/** 世界级聚合（给世界作者看的只有数字，没有任何家庭信息） */
export async function getWorldInsights(worldId: string): Promise<WorldInsights> {
  const rows = (await sql()`
    SELECT
      COUNT(DISTINCT user_id)::int                                AS families,
      COUNT(DISTINCT book_id)::int                                AS episodes,
      COUNT(DISTINCT book_id) FILTER (WHERE event_type = 'book_complete')::int AS completed,
      COUNT(*) FILTER (WHERE event_type = 'replay')::int          AS replays,
      AVG(value_num) FILTER (WHERE event_type = 'quiz_submit')    AS quiz_accuracy,
      AVG(value_num) FILTER (WHERE event_type = 'readalong')      AS readalong_accuracy
    FROM reading_events
    WHERE world_id = ${worldId}
  `) as WorldRow[]

  const moralRows = (await sql()`
    SELECT s.moral, COUNT(*)::int AS n
    FROM books b
    JOIN stories s ON s.id = b.story_id
    WHERE s.series_id IN (SELECT id FROM series WHERE world_id = ${worldId})
      AND s.moral IS NOT NULL
    GROUP BY s.moral
    ORDER BY n DESC
    LIMIT 1
  `) as { moral: string; n: number }[]

  return toWorldInsights(rows[0], moralRows[0]?.moral ?? null)
}
