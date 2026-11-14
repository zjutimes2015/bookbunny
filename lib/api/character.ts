// 角色层（依据《AI 制作绘本的超详细攻略》第三章「角色设定」）
// 产出：12 项角色设定卡 + 一致性固定句（注入每页生图 prompt）+ 角色参考图（供每页作 reference）

import { generateImage } from '@/lib/api/flux'
import {
  contentLanguageRule,
  DEFAULT_BOOK_LANGUAGE,
  type CharacterCard,
  type CharacterKind,
  type StyleLexicon,
  type BookLanguage,
} from '@/lib/types/book'

const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

export interface CharacterResult {
  card: CharacterCard
  /** 一致性固定句：每页生图 prompt 都复用这句，锁定角色长相 */
  consistencyLine: string
  /** 角色参考图（base64，不含 data: 前缀），作为每页生图的 reference */
  imageB64?: string
  refSeed?: number
}

const str = (v: unknown, fb = ''): string =>
  typeof v === 'string' && v.trim() ? v.trim() : v == null ? fb : String(v)

/** 由角色设定卡拼装一致性固定句（英文，FLUX 友好） */
export function buildConsistencyLine(card: CharacterCard): string {
  // 宠物变体：同一套锁定机制，只换不变项的表述（毛色/斑纹/项圈/名牌，而非衣服）。
  // 孩子卡（kind 缺省）走原有分支，输出与改动前逐字相同。
  if (card.kind === 'pet') {
    const traits = [
      card.species ? `a ${card.species}` : '',
      card.roleType,
      card.ageFeel,
      card.appearance,
      card.hairOrFur,
      card.clothing ? `wearing ${card.clothing}` : '',
      card.signatureProp,
      card.commonExpressions ? `typical expressions: ${card.commonExpressions}` : '',
    ].filter(Boolean).join(', ')

    return [
      `CONSISTENCY LOCK — the protagonist is ALWAYS the exact same "${card.name}"`,
      traits,
      `keep ${card.noChangeItems} identical in EVERY page`,
      'do NOT change the face, coat colors, markings, collar, name tag or body proportions between pages',
    ].join('; ')
  }

  const traits = [
    card.roleType,
    card.ageFeel,
    card.appearance,
    card.hairOrFur,
    card.clothing ? `wearing ${card.clothing}` : '',
    card.signatureProp,
    card.commonExpressions ? `typical expressions: ${card.commonExpressions}` : '',
  ].filter(Boolean).join(', ')

  return [
    `CONSISTENCY LOCK — the protagonist is ALWAYS the exact same "${card.name}"`,
    traits,
    `keep ${card.noChangeItems} identical in EVERY page`,
    'do NOT change the face, colors, clothing or body proportions between pages',
  ].join('; ')
}

/** 确定性兜底角色卡（LLM 失败/无 key 时使用）。宠物变体用物种与毛色/斑纹/项圈作识别特征。 */
export function fallbackCharacterCard(
  name: string,
  photoUsage: CharacterCard['photoUsage'],
  kind: CharacterKind = 'child',
  species?: string,
): CharacterCard {
  if (kind === 'pet') {
    const pet = (species || 'dog').trim() || 'dog'
    return {
      name,
      kind: 'pet',
      species: pet,
      roleType: 'pet protagonist',
      ageFeel: `adult ${pet}, warm and loyal`,
      appearance: `friendly ${pet} face, bright kind eyes, soft warm expression`,
      hairOrFur: 'soft well-groomed coat, neat and tidy',
      clothing: '',
      signatureProp: 'a red collar with a round brass name tag it always wears',
      personality: 'loyal, curious, gentle and warm-hearted',
      commonExpressions: 'happy panting smile, curious tilted head, gentle contentment',
      commonActions: 'trotting, sniffing, playing, cuddling',
      storyProblem: 'faces a small heartwarming challenge that a beloved pet would meet',
      noChangeItems: `face shape, eye color, coat colors and markings, collar color, name tag and ${pet} breed features`,
      photoUsage: photoUsage ?? 'illustrated',
    }
  }
  return {
    name,
    roleType: 'protagonist',
    ageFeel: 'young child, cute and friendly',
    appearance: 'round face, big friendly eyes, soft warm smile',
    hairOrFur: 'soft fluffy fur, neat and tidy',
    clothing: "simple bright children's outfit",
    signatureProp: 'a small comforting prop it always carries',
    personality: 'kind, curious, brave and warm-hearted',
    commonExpressions: 'happy smile, curious wide eyes, gentle surprise',
    commonActions: 'walking, hugging, exploring, waving',
    storyProblem: 'faces a small, age-appropriate problem',
    noChangeItems: 'face shape, eye color, fur colors, clothing colors and signature prop',
    photoUsage: photoUsage ?? 'illustrated',
  }
}

function normalizeCard(
  raw: unknown,
  fb: CharacterCard,
  name: string,
  photoUsage?: CharacterCard['photoUsage'],
  kind?: CharacterKind,
  species?: string,
): CharacterCard {
  const r = (raw ?? {}) as Record<string, unknown>
  const rawKind = str(r.kind)
  const resolvedSpecies = species ?? str(r.species, fb.species ?? '')
  return {
    name: str(r.name, name),
    roleType: str(r.roleType ?? r.role, fb.roleType),
    ageFeel: str(r.ageFeel ?? r.age, fb.ageFeel),
    appearance: str(r.appearance ?? r.look, fb.appearance),
    hairOrFur: str(r.hairOrFur ?? r.hair ?? r.fur, fb.hairOrFur),
    clothing: str(r.clothing ?? r.outfit, fb.clothing),
    signatureProp: str(r.signatureProp ?? r.prop ?? r.item, fb.signatureProp),
    personality: str(r.personality ?? r.character, fb.personality),
    commonExpressions: str(r.commonExpressions ?? r.expressions, fb.commonExpressions),
    commonActions: str(r.commonActions ?? r.actions, fb.commonActions),
    storyProblem: str(r.storyProblem ?? r.problem, fb.storyProblem),
    noChangeItems: str(r.noChangeItems ?? r.invariants, fb.noChangeItems),
    photoUsage: photoUsage ?? fb.photoUsage,
    // 物种/角色类型由调用方决定（用户选择），不由模型返回值改写；缺省即儿童行为。
    kind: kind ?? (rawKind === 'pet' ? 'pet' : fb.kind),
    species: resolvedSpecies || undefined,
  }
}

/** 拼装角色立绘 prompt（正面全身、干净背景，便于当 reference 复用） */
function buildPortraitPrompt(card: CharacterCard): string {
  return [
    `A consistent character design of "${card.name}"`,
    card.kind === 'pet' ? `a ${card.species || 'dog'}` : '',
    card.appearance,
    card.hairOrFur,
    card.clothing ? `wearing ${card.clothing}` : '',
    card.signatureProp,
    card.personality,
    'full body, front view, facing the viewer, standing',
    'plain clean white background',
    'no text or letters in the image',
  ].filter(Boolean).join(', ')
}

/**
 * 生成角色设定卡（12 项）+ 一致性固定句 + 角色参考图。
 * - 角色卡：调 deepseek-chat 请求 JSON；失败回退确定性兜底。
 * - 参考图：调 FLUX 生成正面全身立绘；若传入照片则作为 reference（方案B）。
 *   任何失败都不抛错，最坏情况只返回卡片与固定句。
 * - kind='pet' 时走宠物 prompt 变体（品种/毛色/斑纹/项圈/名牌进识别特征），
 *   锁定机制与参考图管线与儿童角色同一套；kind 缺省即儿童行为。
 */
export async function generateCharacterCard(params: {
  name: string
  /** 宝宝/宠物真实照片（data URI，可选；有则走方案B作 reference） */
  photoDataUri?: string
  styleLexicon?: StyleLexicon
  styleName?: string
  ageGroup?: string
  theme?: string
  photoUsage?: CharacterCard['photoUsage']
  /** 内容语言（可选）：面向读者的文字语言，缺省英语 */
  language?: BookLanguage
  /** 角色物种（可选）：缺省 'child'，现有调用方行为不变 */
  kind?: CharacterKind
  /** 宠物物种（如 dog / cat），仅 kind='pet' 时有意义 */
  species?: string
}): Promise<CharacterResult> {
  const { name, photoDataUri, styleLexicon, styleName, ageGroup, theme, photoUsage, language } = params
  const kind: CharacterKind = params.kind === 'pet' ? 'pet' : 'child'
  const species = params.species?.trim() || undefined
  const fallback = fallbackCharacterCard(name, photoUsage, kind, species)
  const lang = language ?? DEFAULT_BOOK_LANGUAGE
  const languageRule = contentLanguageRule(lang)
  let card = fallback

  if (OR_KEY) {
    const prompt = kind === 'pet'
      ? `You are a picture-book character designer for pet keepsake books. Produce ONE character design card (12 fields) for a recurring pet protagonist that must look IDENTICAL on every page.

Inputs:
- Pet name: ${name}
- Species: ${species || '(identify from the reference photo if provided; if no photo was provided, design a dog)'}
- Book theme: ${theme || '(unspecified)'}
- Chosen art style: ${styleName || '(unspecified)'}

Rules:
- appearance / hairOrFur / signatureProp MUST be visually concrete: breed or breed mix, coat colors, distinctive markings (patches, spots, stripes), ear and tail shape, collar color and name tag — so an illustrator can draw the SAME pet every time.
- noChangeItems MUST list the exact visual invariants to keep identical across pages (coat colors, markings, collar, name tag, breed features).
- clothing is usually empty for pets; only fill it if the pet wears something distinctive.
- storyProblem MUST be a small heartwarming challenge fitting a beloved family pet.
- Friendly and non-scary; NEVER imitate any specific artist, studio or franchise (e.g. Ghibli / Disney / Pixar).
- ${languageRule}
- Every visual descriptor field (name, roleType, ageFeel, appearance, hairOrFur, clothing, signatureProp, noChangeItems) MUST stay in English so the image model (FLUX) renders them reliably.

Return ONLY a JSON object (all values are strings):
{
  "name": "...", "roleType": "...", "ageFeel": "...", "appearance": "...",
  "hairOrFur": "...", "clothing": "...", "signatureProp": "...", "personality": "...",
  "commonExpressions": "...", "commonActions": "...", "storyProblem": "...", "noChangeItems": "..."
}`
      : `You are a children's picture-book character designer. Produce ONE character design card (12 fields) for a recurring protagonist that must look IDENTICAL on every page.

Inputs:
- Character name: ${name}
- Target age: ${ageGroup || '3-5'}
- Book theme: ${theme || '(unspecified)'}
- Chosen art style: ${styleName || '(unspecified)'}

Rules:
- appearance / hairOrFur / clothing / signatureProp MUST be visually concrete (colors, shapes) so an illustrator can draw them.
- noChangeItems MUST list the exact visual invariants to keep identical across pages.
- Currency/compatible with young children; friendly and non-scary.
- NEVER imitate any specific artist, studio or franchise (e.g. Ghibli / Disney / Pixar).
- ${languageRule}
- Every visual descriptor field (name, roleType, ageFeel, appearance, hairOrFur, clothing, signatureProp, noChangeItems) MUST stay in English so the image model (FLUX) renders them reliably.

Return ONLY a JSON object (all values are strings):
{
  "name": "...", "roleType": "...", "ageFeel": "...", "appearance": "...",
  "hairOrFur": "...", "clothing": "...", "signatureProp": "...", "personality": "...",
  "commonExpressions": "...", "commonActions": "...", "storyProblem": "...", "noChangeItems": "..."
}`

    try {
      const res = await fetch(`${OR_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            { role: 'system', content: kind === 'pet' ? 'You are a pet keepsake book character designer. Respond only with valid JSON.' : 'You are a children\'s book character designer. Respond only with valid JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      })

      if (!res.ok) throw new Error(`Character API error (${res.status})`)
      const data = await res.json()
      const content: string = data.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content) as Record<string, unknown>
      card = normalizeCard(parsed, fallback, name, photoUsage, kind, species)
    } catch (err) {
      console.warn('generateCharacterCard fallback:', err instanceof Error ? err.message : err)
    }
  }

  const consistencyLine = buildConsistencyLine(card)

  // 角色参考图（供每页生图作为 reference，保持一致）
  let imageB64: string | undefined
  let refSeed: number | undefined
  try {
    const portraitPrompt = [
      buildPortraitPrompt(card),
      styleLexicon?.technique,
      styleLexicon?.colorMood,
      styleLexicon?.characterStyling,
      styleLexicon?.texture,
    ].filter(Boolean).join(', ')

    const seed = Math.floor(Math.random() * 999999)
    const result = await generateImage(portraitPrompt, photoDataUri, { seed })
    imageB64 = result.data
    refSeed = seed
  } catch (err) {
    console.warn('Character reference image failed (degraded):', err instanceof Error ? err.message : err)
  }

  return { card, consistencyLine, imageB64, refSeed }
}
