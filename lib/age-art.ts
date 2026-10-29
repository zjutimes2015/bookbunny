export type AgeBand = '0-3' | '3-5' | '5-7' | '7-10'

export interface AgeArtDirection {
  band: AgeBand
  /** 角色比例，写进角色卡和生图 prompt */
  character: string
  appearance: string
  hair: string
  clothing: string
  prop: string
  /** 场景复杂度 */
  scene: string
  emotion: string
  /** 没有风格词库时的画风兜底 */
  fallbackStyle: string
  /** 每页生图都附上的短句，避免水彩兜底把各年龄画成幼龄 */
  proportionLock: string
}

const DIRECTIONS: Record<AgeBand, AgeArtDirection> = {
  '0-3': {
    band: '0-3',
    character: 'toddler about two, round face, short limbs, simple friendly features',
    appearance: 'round toddler face, short limbs, soft cheeks',
    hair: 'short soft hair',
    clothing: 'a simple one-piece in one clear bright color',
    prop: 'one familiar object',
    scene: 'one object, large empty background, flat simple shapes, bright soft colors',
    emotion: 'calm, sunny, and very simple',
    fallbackStyle: 'toddler picture book, flat simple shapes, bright soft colors, lots of empty space, no detailed background',
    proportionLock: 'toddler proportions, about two years old',
  },
  '3-5': {
    band: '3-5',
    character: 'preschool child about four, picture-book proportions, clear simple face, not a baby',
    appearance: 'preschool child about four, picture-book face, not a baby',
    hair: 'simple hair in one clear color',
    clothing: 'a solid-color coat and boots',
    prop: 'a paper boat',
    scene: 'one clear action, few objects, flat gouache, low-saturation warm colors',
    emotion: 'warm and playful, still a picture book',
    fallbackStyle: 'preschool picture book, flat gouache, one clear action, soft warm colors, simple background, not a baby',
    proportionLock: 'preschool child about four, not a baby',
  },
  '5-7': {
    band: '5-7',
    character: 'school-age child about six, longer limbs than a toddler, natural face, not chibi, not a baby',
    appearance: 'school-age child about six, longer limbs, natural face, not chibi',
    hair: 'practical hair a six-year-old would have',
    clothing: 'a jacket, trousers, and a satchel',
    prop: 'a folded paper map',
    scene: 'a real place with moderate detail, natural colors, one story moment',
    emotion: 'curious and capable, an early reader rather than a toddler book',
    fallbackStyle: 'early-reader illustration, pencil and flat color, school-age child, a real place, natural colors, not toddler, not chibi',
    proportionLock: 'school-age child about six, not a toddler, not chibi',
  },
  '7-10': {
    band: '7-10',
    character: 'older child about nine, realistic child proportions, longer limbs, smaller head, not a toddler, not chibi',
    appearance: 'older child about nine, realistic child proportions, smaller head, longer limbs, not a toddler',
    hair: 'hair that moves, not a baby cut',
    clothing: 'a jacket and jeans',
    prop: 'a notebook and a pencil',
    scene: 'illustrated chapter scene, layered setting, textured gouache, natural colors, avoid baby styling and avoid gloomy darkness',
    emotion: 'quiet and specific, an illustrated chapter rather than a picture book for toddlers',
    fallbackStyle: 'illustrated chapter book, textured gouache, older child about nine, layered natural setting, not toddler, not chibi, not a baby animal',
    proportionLock: 'older child about nine, realistic child proportions, not a toddler, not chibi, not a baby animal',
  },
}

export function ageBand(raw: string): AgeBand {
  if (raw === '0-3' || raw === '3-5' || raw === '5-7' || raw === '7-10') return raw
  const match = (raw || '').match(/\d+/)
  const n = match ? Number(match[0]) : NaN
  if (!Number.isFinite(n)) return '3-5'
  if (n < 3) return '0-3'
  if (n < 5) return '3-5'
  if (n < 7) return '5-7'
  return '7-10'
}

export function ageArtDirection(ageGroup: string): AgeArtDirection {
  return DIRECTIONS[ageBand(ageGroup)]
}

/** 写进故事大纲和角色卡 prompt 的年龄画法说明 */
export function ageArtBrief(ageGroup: string): string {
  const art = ageArtDirection(ageGroup)
  return [
    `Age band ${art.band}.`,
    `Protagonist: ${art.character}.`,
    `Clothing and prop: ${art.clothing}; ${art.prop}.`,
    `Scenes: ${art.scene}.`,
    `Mood: ${art.emotion}.`,
    'Do not default every book to a toddler, a baby, or a cute animal. Only ages 0-3 use toddler proportions.',
  ].join(' ')
}
