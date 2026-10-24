import { neon } from '@neondatabase/serverless'
import type { AgeRange, SampleEpisode, World, WorldCharacter } from '@/data/worlds'

/**
 * 世界快照：生成一集时把当时的世界档案冻结进这一集。
 * 世界改版或下架都不会影响已经生成的集。
 */
export interface WorldSnapshot {
  id: string
  name: string
  ageRange: string
  theme: string
  scene: string
  artStyle: string
  characters: { name: string; role: string; personality: string; catchphrase: string }[]
  moralPool: string[]
  forbiddenZones: string[]
}

/** 世界档案在库里的完整记录（比种子数据多一列排序位） */
export interface WorldRecord extends World {
  sortOrder: number
}

/** 列表页只需要展示字段，不拉整份档案 */
export interface WorldSummary {
  id: string
  name: string
  ageRange: AgeRange
  theme: string
  status: World['status']
}

interface WorldRow {
  id: string
  name: string
  age_range: string
  theme: string
  status: string
  difficulty: string | null
  scene: string | null
  characters: WorldCharacter[] | null
  art_style: string | null
  moral_pool: string[] | null
  forbidden_zones_specific: string[] | null
  sample_episode: SampleEpisode | null
  sort_order: number
}

let client: ReturnType<typeof neon> | null = null
function sql() {
  return (client ??= neon(process.env.NEON_DATABASE_URL!))
}

function toSummary(row: Pick<WorldRow, 'id' | 'name' | 'age_range' | 'theme' | 'status'>): WorldSummary {
  return {
    id: row.id,
    name: row.name,
    ageRange: row.age_range as AgeRange,
    theme: row.theme,
    status: row.status as World['status'],
  }
}

function toRecord(row: WorldRow): WorldRecord {
  return {
    id: row.id,
    name: row.name,
    ageRange: row.age_range as AgeRange,
    theme: row.theme,
    status: row.status as World['status'],
    difficulty: row.difficulty ?? '',
    scene: row.scene ?? '',
    characters: row.characters ?? [],
    artStyle: row.art_style ?? '',
    moralPool: row.moral_pool ?? [],
    forbiddenZonesSpecific: row.forbidden_zones_specific ?? [],
    sampleEpisode: row.sample_episode ?? { title: '', pages: [] },
    sortOrder: row.sort_order,
  }
}

/** 世界列表（按种子顺序，草稿也返回，供内部评审） */
export async function listWorlds(): Promise<WorldSummary[]> {
  const rows = (await sql()`
    SELECT id, name, age_range, theme, status
    FROM worlds
    ORDER BY sort_order ASC, name ASC
  `) as Pick<WorldRow, 'id' | 'name' | 'age_range' | 'theme' | 'status'>[]
  return rows.map(toSummary)
}

export interface WorldFilters {
  ageRange?: string | null
  theme?: string | null
}

/**
 * 家长侧筛选：年龄 + 主题。
 * 世界只有 20 个，在内存里筛比拼动态 SQL 更简单也更好测。
 */
export function filterWorlds<T extends { ageRange: string; theme: string }>(
  worlds: T[],
  filters: WorldFilters,
): T[] {
  return worlds.filter(
    (w) =>
      (!filters.ageRange || w.ageRange === filters.ageRange) &&
      (!filters.theme || w.theme === filters.theme),
  )
}

/** 世界里出现的主题，按档案顺序去重（筛选条用） */
export function worldThemes(worlds: { theme: string }[]): string[] {
  return [...new Set(worlds.map((w) => w.theme))]
}

/** 冻结一份世界快照（生成一集时写入 series / 该集） */
export function toWorldSnapshot(world: WorldRecord): WorldSnapshot {
  return {
    id: world.id,
    name: world.name,
    ageRange: world.ageRange,
    theme: world.theme,
    scene: world.scene,
    artStyle: world.artStyle,
    characters: world.characters.map((c) => ({
      name: c.name,
      role: c.role,
      personality: c.personality,
      catchphrase: c.catchphrase,
    })),
    moralPool: world.moralPool,
    forbiddenZones: world.forbiddenZonesSpecific,
  }
}

/** 单个世界完整档案，找不到返回 null */
export async function getWorld(id: string): Promise<WorldRecord | null> {
  const rows = (await sql()`
    SELECT id, name, age_range, theme, status, difficulty, scene, characters,
           art_style, moral_pool, forbidden_zones_specific, sample_episode, sort_order
    FROM worlds
    WHERE id = ${id}
    LIMIT 1
  `) as WorldRow[]
  return rows.length > 0 ? toRecord(rows[0]) : null
}
