// 角色层（依据《AI 制作绘本的超详细攻略》第三章「角色设定」）
// 产出：12 项角色设定卡 + 一致性固定句（注入每页生图 prompt）+ 角色参考图（供每页作 reference）

import { ageArtBrief, ageArtDirection } from '@/lib/age-art'
import { generateImage } from '@/lib/api/flux'
import {
  contentLanguageRule,
  DEFAULT_BOOK_LANGUAGE,
  type CharacterCard,
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

/** 确定性兜底角色卡（LLM 失败/无 key 时使用）。比例跟年龄段走，不一律画成幼龄。 */
function fallbackCard(name: string, photoUsage: CharacterCard['photoUsage'], ageGroup?: string): CharacterCard {
  const art = ageArtDirection(ageGroup || '3-5')
  return {
    name,
    roleType: 'protagonist',
    ageFeel: art.character,
    appearance: art.appearance,
    hairOrFur: art.hair,
    clothing: art.clothing,
    signatureProp: art.prop,
    personality: 'kind, curious, and specific to this age',
    commonExpressions: 'focused, pleased, thinking',
    commonActions: 'walking, looking, deciding, carrying the signature prop',
    storyProblem: 'faces a problem matched to this age',
    noChangeItems: 'face shape, hair, clothing colors, body proportions and signature prop',
    photoUsage: photoUsage ?? 'illustrated',
  }
}

function normalizeCard(
  raw: unknown,
  fb: CharacterCard,
  name: string,
  photoUsage?: CharacterCard['photoUsage'],
): CharacterCard {
  const r = (raw ?? {}) as Record<string, unknown>
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
  }
}

/** 拼装角色立绘 prompt（正面全身、干净背景，便于当 reference 复用） */
function buildPortraitPrompt(card: CharacterCard): string {
  return [
    `A consistent character design of "${card.name}"`,
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
 * - 参考图：调 FLUX 生成正面全身立绘；若传入宝宝照片则作为 reference（方案B）。
 *   任何失败都不抛错，最坏情况只返回卡片与固定句。
 */
export async function generateCharacterCard(params: {
  name: string
  /** 宝宝真实照片（data URI，可选；有则走方案B作 reference） */
  photoDataUri?: string
  styleLexicon?: StyleLexicon
  styleName?: string
  ageGroup?: string
  theme?: string
  photoUsage?: CharacterCard['photoUsage']
  /** 内容语言（可选）：面向读者的文字语言，缺省英语 */
  language?: BookLanguage
}): Promise<CharacterResult> {
  const { name, photoDataUri, styleLexicon, styleName, ageGroup, theme, photoUsage, language } = params
  const fallback = fallbackCard(name, photoUsage, ageGroup)
  const lang = language ?? DEFAULT_BOOK_LANGUAGE
  const languageRule = contentLanguageRule(lang)
  let card = fallback

  if (OR_KEY) {
    const prompt = `You are a children's picture-book character designer. Produce ONE character design card (12 fields) for a recurring protagonist that must look IDENTICAL on every page.

Inputs:
- Character name: ${name}
- Target age: ${ageGroup || '3-5'}
- Book theme: ${theme || '(unspecified)'}
- Chosen art style: ${styleName || '(unspecified)'}

Age art direction (must follow):
${ageArtBrief(ageGroup || '3-5')}

Rules:
- appearance / hairOrFur / clothing / signatureProp MUST be visually concrete (colors, shapes) so an illustrator can draw them.
- ageFeel and body proportions MUST match the age band above. Ages 7-10 are older children, not toddlers.
- noChangeItems MUST list the exact visual invariants to keep identical across pages.
- Friendly and non-scary.
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
            { role: 'system', content: 'You are a children\'s book character designer. Respond only with valid JSON.' },
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
      card = normalizeCard(parsed, fallback, name, photoUsage)
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
