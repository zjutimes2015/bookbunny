import { neon } from '@neondatabase/serverless'
import type { CharacterCard, StyleLexicon } from '@/lib/types/book'
import type { WorldSnapshot } from '@/lib/worlds'

/** 家庭连续剧：主角档案私有，世界只留快照 */
export interface SeriesRecord {
  id: string
  userId: string
  title: string
  worldId: string | null
  worldSnapshot: WorldSnapshot | null
  protagonistName: string
  protagonistCard: CharacterCard | null
  protagonistConsistencyLine: string | null
  protagonistImageUrl: string | null
  style: string | null
  styleLexicon: StyleLexicon | null
  theme: string
  ageGroup: string
  level: string | null
}

interface SeriesRow {
  id: string
  user_id: string
  title: string
  world_id: string | null
  world_snapshot: WorldSnapshot | null
  protagonist_name: string
  protagonist_card: CharacterCard | null
  protagonist_consistency_line: string | null
  protagonist_image_url: string | null
  style: string | null
  style_lexicon: StyleLexicon | null
  theme: string
  age_group: string
  level: string | null
}

function toSeries(row: SeriesRow): SeriesRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    worldId: row.world_id,
    worldSnapshot: row.world_snapshot,
    protagonistName: row.protagonist_name,
    protagonistCard: row.protagonist_card,
    protagonistConsistencyLine: row.protagonist_consistency_line,
    protagonistImageUrl: row.protagonist_image_url,
    style: row.style,
    styleLexicon: row.style_lexicon,
    theme: row.theme,
    ageGroup: row.age_group,
    level: row.level,
  }
}

let client: ReturnType<typeof neon> | null = null
function sql() {
  return (client ??= neon(process.env.NEON_DATABASE_URL!))
}

export interface CreateSeriesInput {
  userId: string
  title: string
  protagonistName: string
  protagonistCard?: CharacterCard | null
  consistencyLine?: string | null
  protagonistImageUrl?: string | null
  style?: string | null
  styleLexicon?: StyleLexicon | null
  theme: string
  ageGroup: string
  level?: string | null
  worldId?: string | null
  worldSnapshot?: WorldSnapshot | null
}

/** 第一集落库时创建 series（此后所有续集复用同一个主角档案） */
export async function createSeries(input: CreateSeriesInput): Promise<string> {
  const rows = (await sql()`
    INSERT INTO series (
      user_id, title, world_id, world_snapshot, protagonist_name, protagonist_card,
      protagonist_consistency_line, protagonist_image_url, style, style_lexicon,
      theme, age_group, level
    ) VALUES (
      ${input.userId}, ${input.title}, ${input.worldId ?? null},
      ${input.worldSnapshot ? JSON.stringify(input.worldSnapshot) : null}::jsonb,
      ${input.protagonistName},
      ${input.protagonistCard ? JSON.stringify(input.protagonistCard) : null}::jsonb,
      ${input.consistencyLine ?? null}, ${input.protagonistImageUrl ?? null},
      ${input.style ?? null},
      ${input.styleLexicon ? JSON.stringify(input.styleLexicon) : null}::jsonb,
      ${input.theme}, ${input.ageGroup}, ${input.level ?? null}
    )
    RETURNING id
  `) as { id: string }[]
  return rows[0].id
}

export async function getSeries(id: string): Promise<SeriesRecord | null> {
  const rows = (await sql()`
    SELECT id, user_id, title, world_id, world_snapshot, protagonist_name,
           protagonist_card, protagonist_consistency_line, protagonist_image_url,
           style, style_lexicon, theme, age_group, level
    FROM series
    WHERE id = ${id}
    LIMIT 1
  `) as SeriesRow[]
  return rows[0] ? toSeries(rows[0]) : null
}

export interface RemixSource {
  bookId: string
  bookUserId: string | null
  aspect: string | null
  storyId: string
  storyTitle: string
  storyTheme: string
  ageGroup: string
  level: string | null
  content: string[]
  /** 本集要教的寓意（第 1 集由家长选，之后逐集轮换） */
  moral: string | null
  series: SeriesRecord | null
  /** 该 series 已有多少集（无 series 时为 1） */
  latestEpisode: number
}

interface BookStoryRow {
  book_id: string
  book_user_id: string | null
  aspect: string | null
  story_id: string | null
  story_title: string | null
  story_theme: string | null
  age_group: string | null
  level: string | null
  content: string[] | null
  moral: string | null
  series_id: string | null
}

/** 读取一次 remix 所需的全部上下文（来源书 → 故事 → 系列 → 已播集数） */
export async function loadRemixSource(bookId: string): Promise<RemixSource | null> {
  const rows = (await sql()`
    SELECT b.id AS book_id, b.user_id AS book_user_id, b.aspect,
           s.id AS story_id, s.title AS story_title, s.theme AS story_theme,
           s.age_group, s.level, s.content, s.moral, s.series_id
    FROM books b
    LEFT JOIN stories s ON s.id = b.story_id
    WHERE b.id = ${bookId}
    LIMIT 1
  `) as BookStoryRow[]

  const row = rows[0]
  if (!row || !row.story_id) return null

  let series: SeriesRecord | null = null
  let latestEpisode = 1
  if (row.series_id) {
    series = await getSeries(row.series_id)
    const maxRows = (await sql()`
      SELECT COALESCE(MAX(episode_number), 1)::int AS max_episode
      FROM stories WHERE series_id = ${row.series_id}
    `) as { max_episode: number }[]
    latestEpisode = maxRows[0]?.max_episode ?? 1
  }

  return {
    bookId: row.book_id,
    bookUserId: row.book_user_id,
    aspect: row.aspect,
    storyId: row.story_id,
    storyTitle: row.story_title ?? '',
    storyTheme: row.story_theme ?? '',
    ageGroup: row.age_group ?? '',
    level: row.level,
    content: row.content ?? [],
    moral: row.moral,
    series,
    latestEpisode,
  }
}

export interface InsertEpisodeInput {
  userId: string
  title: string
  content: string[]
  outline: unknown
  ageGroup: string
  theme: string
  level: string | null
  quiz: unknown | null
  seriesId: string
  episodeNumber: number
  remixKind: string
  moral: string | null
  aspect: string | null
}

/** 写入新一集：stories + books（主角继续留在 series 里，不产生任何可外传的合成资产） */
export async function insertEpisode(
  input: InsertEpisodeInput,
): Promise<{ storyId: string; bookId: string }> {
  const storyRows = (await sql()`
    INSERT INTO stories (
      title, content, outline, age_group, theme, level, quiz,
      series_id, episode_number, remix_kind, moral
    ) VALUES (
      ${input.title}, ${input.content}, ${JSON.stringify(input.outline)}::jsonb,
      ${input.ageGroup}, ${input.theme}, ${input.level},
      ${input.quiz ? JSON.stringify(input.quiz) : null},
      ${input.seriesId}, ${input.episodeNumber}, ${input.remixKind}, ${input.moral}
    )
    RETURNING id
  `) as { id: string }[]
  const storyId = storyRows[0]?.id
  if (!storyId) throw new Error('Failed to insert episode story')

  const bookRows = (await sql()`
    INSERT INTO books (title, story_id, user_id, status, format, level, aspect)
    VALUES (${input.title}, ${storyId}, ${input.userId}, 'ready', 'ebook', ${input.level}, ${input.aspect})
    RETURNING id
  `) as { id: string }[]
  const bookId = bookRows[0]?.id
  if (!bookId) throw new Error('Failed to insert episode book')

  return { storyId, bookId }
}
