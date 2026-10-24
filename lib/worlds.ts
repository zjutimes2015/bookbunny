import { neon } from '@neondatabase/serverless'
import type { AgeRange, SampleEpisode, World, WorldCharacter } from '@/data/worlds'

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
