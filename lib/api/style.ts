import { STYLE_LIBRARY, AGE_COLOR_GUIDE, type StyleLibraryEntry } from '@/data/style-library'
import {
  contentLanguageRule,
  DEFAULT_BOOK_LANGUAGE,
  type StyleCard,
  type StyleLexicon,
  type BookLanguage,
} from '@/lib/types/book'

const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

/** 禁止项兜底文案（含「禁止写具体风格名」约束） */
const DEFAULT_FORBIDDEN =
  'no text or letters in the image, no scary or violent elements, no dark gloomy background, do not imitate any specific artist, studio or franchise (e.g. Ghibli / Disney / Pixar), background must not compete with the main character'

const DEFAULT_SCENE =
  'simple clean background, one clear focal point, keep the background from competing with the main character, always leave whitespace for text'

const DEFAULT_EMOTION = 'warm, gentle, positive and age-appropriate'

const str = (v: unknown, fb = ''): string =>
  typeof v === 'string' && v.trim() ? v.trim() : v == null ? fb : String(v)

/** 把任意年龄段（如 0-3 / 3-5 / 5-7 / 7-10）归一到 0-3 / 3-6 / 6-9 */
export function normalizeAgeGroup(raw: string): string {
  const m = (raw || '').match(/\d+/)
  const n = m ? Number(m[0]) : 3
  if (n < 3) return '0-3'
  if (n < 6) return '3-6'
  return '6-9'
}

function findStyle(styleId: string): StyleLibraryEntry {
  return STYLE_LIBRARY.find(s => s.id === styleId) ?? STYLE_LIBRARY[0]
}

/** 确定性兜底：由风格库条目 + 护眼配色指南拼装 */
function buildFallback(styleId: string, ageGroup: string, theme: string): { card: StyleCard; lexicon: StyleLexicon } {
  const entry = findStyle(styleId)
  const colorGuide = AGE_COLOR_GUIDE[normalizeAgeGroup(ageGroup)] ?? AGE_COLOR_GUIDE['3-6']

  const card: StyleCard = {
    workingTheme: theme,
    ageRange: ageGroup,
    mainStyle: entry.name,
    colorMood: colorGuide,
    eyeCare: colorGuide,
    characterStyling: entry.features,
    sceneComplexity: DEFAULT_SCENE,
    emotionTexture: DEFAULT_EMOTION,
    styleKeywords: entry.aiKeywords,
    forbiddenStyles: DEFAULT_FORBIDDEN,
  }

  const lexicon: StyleLexicon = {
    technique: entry.features,
    colorMood: colorGuide,
    characterStyling: entry.features,
    sceneComplexity: DEFAULT_SCENE,
    texture: entry.aiKeywords,
    forbidden: DEFAULT_FORBIDDEN,
  }

  return { card, lexicon }
}

function normalizeCard(raw: unknown, fb: StyleCard): StyleCard {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    workingTheme: str(r.workingTheme, fb.workingTheme),
    ageRange: str(r.ageRange, fb.ageRange),
    mainStyle: str(r.mainStyle, fb.mainStyle),
    colorMood: str(r.colorMood, fb.colorMood),
    eyeCare: str(r.eyeCare, fb.eyeCare),
    characterStyling: str(r.characterStyling, fb.characterStyling),
    sceneComplexity: str(r.sceneComplexity, fb.sceneComplexity),
    emotionTexture: str(r.emotionTexture, fb.emotionTexture),
    styleKeywords: str(r.styleKeywords, fb.styleKeywords),
    forbiddenStyles: str(r.forbiddenStyles, fb.forbiddenStyles),
  }
}

function normalizeLexicon(raw: unknown, fb: StyleLexicon): StyleLexicon {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    technique: str(r.technique, fb.technique),
    colorMood: str(r.colorMood, fb.colorMood),
    characterStyling: str(r.characterStyling, fb.characterStyling),
    sceneComplexity: str(r.sceneComplexity, fb.sceneComplexity),
    texture: str(r.texture, fb.texture),
    forbidden: str(r.forbidden, fb.forbidden),
  }
}

/**
 * 生成「风格设定卡 + 固定风格词库」。
 * 调 OpenRouter deepseek-chat 请求 JSON；任何失败（无 key / 网络 / 解析）都回退到确定性兜底，绝不向调用方抛错。
 */
export async function generateStyleLexicon(
  params: { styleId: string; ageGroup: string; theme: string; language?: BookLanguage },
): Promise<{ card: StyleCard; lexicon: StyleLexicon }> {
  const { styleId, ageGroup, theme, language } = params
  const fallback = buildFallback(styleId, ageGroup, theme)

  const lang = language ?? DEFAULT_BOOK_LANGUAGE
  const languageRule = contentLanguageRule(lang)

  if (!OR_KEY) return fallback

  const entry = findStyle(styleId)
  const ageKey = normalizeAgeGroup(ageGroup)
  const colorGuide = AGE_COLOR_GUIDE[ageKey] ?? AGE_COLOR_GUIDE['3-6']

  const prompt = `You are a children's picture-book art director. Produce ONE fixed style setting card and ONE fixed style lexicon for a single picture book.

Inputs:
- Theme: ${theme}
- Target age: ${ageGroup} (age band ${ageKey})
- Chosen main style: ${entry.name}
- Style traits: ${entry.features}
- English AI keywords for this style: ${entry.aiKeywords}
- Eye-friendly color guide for this age band: ${colorGuide}

Rules:
- The whole book uses exactly ONE main style.
- Color rules MUST follow the eye-friendly guide above (this protects young readers' eyes).
- Backgrounds must not compete with the main character; always reserve whitespace for text.
- NEVER reference or imitate any specific artist, studio or franchise (e.g. Ghibli, Disney, Pixar).
- ${languageRule}

Return ONLY a JSON object (all values are strings; the card and lexicon values are image-facing so keep them in English, FLUX-friendly keywords):
{
  "card": {
    "workingTheme": "...", "ageRange": "...", "mainStyle": "...", "colorMood": "...",
    "eyeCare": "...", "characterStyling": "...", "sceneComplexity": "...",
    "emotionTexture": "...", "styleKeywords": "...", "forbiddenStyles": "..."
  },
  "lexicon": {
    "technique": "...", "colorMood": "...", "characterStyling": "...",
    "sceneComplexity": "...", "texture": "...", "forbidden": "..."
  }
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
          { role: 'system', content: 'You are a children\'s book art director. Respond only with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) throw new Error(`Style API error (${res.status})`)

    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content) as Record<string, unknown>

    return {
      card: normalizeCard(parsed.card, fallback.card),
      lexicon: normalizeLexicon(parsed.lexicon, fallback.lexicon),
    }
  } catch (err) {
    console.warn('generateStyleLexicon fallback:', err instanceof Error ? err.message : err)
    return fallback
  }
}
