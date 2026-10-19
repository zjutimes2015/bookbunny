import { pickLevel, grlFromAgeGroup, levelPromptConstraints, validateVocabulary, type ReadingLevel } from '@/lib/reading-levels'
import { generateQuiz, type Quiz } from '@/lib/quiz-generator'
import {
  splitOutline,
  outlineToPages,
  pagesToOutline,
  contentLanguageRule,
  languageName,
  DEFAULT_BOOK_LANGUAGE,
  type PageOutline,
  type StoryResult,
  type StyleCard,
  type StyleLexicon,
  type CharacterCard,
  type BookLanguage,
} from '@/lib/types/book'

const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

interface StoryOptions {
  theme: string
  ageGroup: string
  characterName: string
  pages?: number
  level?: string
  /** 风格层（可选）：选定后强制大纲表B 视觉字段与之一致 */
  styleLexicon?: StyleLexicon
  /** 风格设定卡（可选） */
  styleCard?: StyleCard
  /** 角色设定卡（可选）：注入大纲，锁定角色一致性 */
  characterCards?: CharacterCard[]
  /** 内容语言（可选）：面向读者的文字语言，缺省英语 */
  language?: BookLanguage
}

// === 解析防御：字段归一化 ===
const PAGE_FUNCTIONS = ['cover', 'front-matter', 'body', 'back-cover'] as const

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : v == null ? fallback : String(v)

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

const arr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(x => str(x)).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return [v.trim()]
  return []
}

/** 把 LLM 返回的单个条目归一化为 PageOutline，容忍缺字段/别名 */
function normalizeOutlineItem(raw: Record<string, unknown>, index: number): PageOutline {
  const pageText = str(raw.pageText ?? raw.text ?? raw.page_text ?? raw.pageTextEn)
  const fnRaw = str(raw.pageFunction ?? raw.function ?? 'body').toLowerCase()
  const pageFunction = (PAGE_FUNCTIONS as readonly string[]).includes(fnRaw)
    ? (fnRaw as PageOutline['pageFunction'])
    : 'body'

  return {
    pageNumber: num(raw.pageNumber ?? raw.page ?? raw.pageNum, index + 1),
    pageFunction,
    pageTheme: str(raw.pageTheme ?? raw.theme ?? raw.title),
    plotNode: str(raw.plotNode ?? raw.plot ?? raw.plot_point),
    characters: arr(raw.characters ?? raw.cast ?? raw.roles),
    characterAction: str(raw.characterAction ?? raw.action),
    characterEmotion: str(raw.characterEmotion ?? raw.emotion ?? raw.mood),
    pageText,
    wordCountHint: num(raw.wordCountHint ?? raw.wordCount, pageText.length),
    visualStyle: str(raw.visualStyle ?? raw.style),
    colorMood: str(raw.colorMood ?? raw.color ?? raw.colorAtmosphere),
    coreVisualElements: arr(raw.coreVisualElements ?? raw.coreElements ?? raw.core_visual),
    supportingVisualElements: arr(raw.supportingVisualElements ?? raw.supportingElements ?? raw.supporting_visual),
    composition: str(raw.composition),
    textWhitespace: str(raw.textWhitespace ?? raw.whitespace ?? raw.text_space),
    forbiddenElements: arr(raw.forbiddenElements ?? raw.forbidden ?? raw.negative),
    imagePromptPoints: str(raw.imagePromptPoints ?? raw.promptPoints ?? raw.imagePrompt),
    continuity: str(raw.continuity ?? raw.transition),
  }
}

/** 拼装「Visual direction (must match)」风格块，让大纲表B 视觉字段与选定风格一致 */
function buildVisualDirectionBlock(card?: StyleCard, lexicon?: StyleLexicon): string {
  if (!card && !lexicon) return ''
  const lines: string[] = [
    'Visual direction (must match) — this fixed style applies to the WHOLE book. Every page\'s visual fields (field 10 visualStyle, field 11 colorMood, field 16 forbiddenElements) MUST comply:',
  ]
  if (card?.mainStyle) lines.push(`- Main style: ${card.mainStyle}`)
  if (lexicon?.technique) lines.push(`- Technique: ${lexicon.technique}`)
  if (lexicon?.colorMood || card?.colorMood) lines.push(`- Color mood: ${lexicon?.colorMood || card?.colorMood}`)
  if (lexicon?.characterStyling) lines.push(`- Character styling: ${lexicon.characterStyling}`)
  if (lexicon?.sceneComplexity) lines.push(`- Scene complexity: ${lexicon.sceneComplexity}`)
  if (lexicon?.texture) lines.push(`- Texture: ${lexicon.texture}`)
  if (card?.eyeCare) lines.push(`- Eye-care: ${card.eyeCare}`)
  if (card?.emotionTexture) lines.push(`- Emotion: ${card.emotionTexture}`)
  if (lexicon?.forbidden || card?.forbiddenStyles) lines.push(`- Forbidden: ${lexicon?.forbidden || card?.forbiddenStyles}`)
  if (card?.styleKeywords) lines.push(`- Fixed style keywords: ${card.styleKeywords}`)
  lines.push('- Use exactly ONE main style for the whole book; do NOT name any specific artist, studio or franchise (e.g. Ghibli / Disney / Pixar).')
  return lines.join('\n')
}

/** 拼装「Character bible（角色一致性）」块：注入角色卡，锁定大纲与画风 */
function buildCharacterBibleBlock(cards?: CharacterCard[]): string {
  if (!cards?.length) return ''
  const lines: string[] = [
    'Character bible (MUST match on EVERY page — same look, same clothes, same colors, same age):',
  ]
  for (const c of cards) {
    lines.push(
      `- ${c.name} (${c.roleType}): ${c.appearance}; ${c.hairOrFur};` +
      `${c.clothing ? ` wearing ${c.clothing};` : ''}${c.signatureProp ? ` always with ${c.signatureProp};` : ''}` +
      ` personality: ${c.personality}; invariants: ${c.noChangeItems}.`,
    )
  }
  lines.push('- field 5 characters MUST use these exact names; field 6/7 must keep their traits consistent.')
  return lines.join('\n')
}

export async function generateStory(options: StoryOptions): Promise<StoryResult> {
  // 1. 解析分级：优先用 level 参数，否则从 ageGroup 映射（向后兼容）
  const grl = (options.level || grlFromAgeGroup(options.ageGroup)).toUpperCase()
  const level: ReadingLevel | null = pickLevel(grl)

  // 2. 构建 prompt：有分级则注入约束，无分级走旧逻辑
  let pageCount = options.pages || 20
  let constraintsBlock = ''

  if (level) {
    pageCount = level.pageCount
    constraintsBlock = levelPromptConstraints(level)
  }

  const visualDirectionBlock = buildVisualDirectionBlock(options.styleCard, options.styleLexicon)
  const characterBibleBlock = buildCharacterBibleBlock(options.characterCards)
  const lang = options.language ?? DEFAULT_BOOK_LANGUAGE
  const languageRule = contentLanguageRule(lang)

  const prompt = `You are a professional children's book author and illustrator-director. Produce a per-page production blueprint (single-page outline) for a children's picture book.

Parameters:
- Theme: ${options.theme}
- Target Age: ${options.ageGroup}
- Main Character(s): ${options.characterName}
- Number of pages: ${pageCount} (page 1 is the COVER, the rest are BODY)

${constraintsBlock ? constraintsBlock + '\n' : ''}${languageRule}\n\n${characterBibleBlock ? characterBibleBlock + '\n\n' : ''}${visualDirectionBlock ? visualDirectionBlock + '\n\n' : ''}For EACH page output the following 18 fields (this is a "construction drawing", be concrete, NEVER vague like "warm scene").

LANGUAGE CONTRACT (strictly enforced, no exceptions):
- Reader-facing fields (3, 4, 6, 7, 8, 18) and the title MUST be written in ${languageName(lang)}.
- Image-facing fields (10, 11, 12, 13, 14, 15, 16, 17) MUST be written in ENGLISH, because they are fed directly to the image model.
- A single field value must NEVER contain two languages. No transliteration, no bilingual labels.

1 pageNumber (int)
2 pageFunction ("cover" for page 1, "body" for the rest)
3 pageTheme (in ${languageName(lang)})
4 plotNode (in ${languageName(lang)}, which plot beat this page advances)
5 characters (array of character names appearing, written in ${languageName(lang)})
6 characterAction (in ${languageName(lang)}, what the protagonist does)
7 characterEmotion (in ${languageName(lang)})
8 pageText (in ${languageName(lang)}, the sentence read to the child, 10-20 words, age-appropriate)
9 wordCountHint (int, words in pageText)
10 visualStyle (ENGLISH only, e.g. "soft watercolor, gentle low-saturation palette")
11 colorMood (ENGLISH only, e.g. "warm pink and creamy yellow")
12 coreVisualElements (array of must-appear objects, ENGLISH only)
13 supportingVisualElements (array, ENGLISH only)
14 composition (ENGLISH only, e.g. "close-up", "wide shot", "centered")
15 textWhitespace (ENGLISH only, where to leave room for text)
16 forbiddenElements (array, ENGLISH only, e.g. "no text in image", "no scary elements")
17 imagePromptPoints (ENGLISH only, key notes for the illustrator/FLUX model)
18 continuity (in ${languageName(lang)}, how it connects to the previous page)

Requirements:
- Each page expresses exactly ONE plot node.
- Story has a clear beginning, middle, end with emotional progression.
- Keep character appearance / clothing / style consistent across pages.
- Every page leaves whitespace for text.
- Language: reader-facing text in ${languageName(lang)}, image-facing fields in English. Never mix.

Return ONLY a JSON object:
{
  "title": "The story title, in ${languageName(lang)}",
  "outline": [ { ...18 fields... }, ... ]
}`

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a children\'s book author. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Story API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content || ''

  // 3. 解析 JSON（容错：可能被 markdown 包裹）
  let parsed: Record<string, unknown>
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
  } catch {
    throw new Error('Failed to parse story JSON from AI response')
  }

  const title = str(parsed.title, 'Untitled Story')

  // 4. 归一化大纲：优先 outline；若模型仍返回旧 pages 文本数组，则兼容转换
  let outline: PageOutline[]
  if (Array.isArray(parsed.outline)) {
    outline = parsed.outline.map((item, i) =>
      normalizeOutlineItem((item ?? {}) as Record<string, unknown>, i),
    )
  } else if (Array.isArray(parsed.pages)) {
    outline = pagesToOutline(arr(parsed.pages))
  } else {
    throw new Error('AI response missing outline/pages')
  }

  const story: StoryResult = {
    title,
    outline,
    tables: splitOutline(outline),
  }

  // 5. 生成后词汇校验（有分级才校验）
  if (level && outline.length > 0) {
    const fullText = outlineToPages(outline).join(' ')
    const check = validateVocabulary(fullText, level)
    story.level = level.grl
    story.levelLabel = `${level.grl} · ${level.label} (ages ${level.ageRange})`
    story.vocabularyPassed = check.passed
    story.vocabularyRatio = Math.round(check.ratio * 100)
    // 超纲 ≥ 5%：提示但保留（前端显示降级建议），不硬失败
  }

  // 6. 生成阅读理解 Quiz（有分级才生成；失败降级为 null）
  if (level && outline.length > 0) {
    try {
      const quiz: Quiz = await generateQuiz(outlineToPages(outline).join(' '), level, lang)
      story.quiz = quiz
    } catch (err) {
      console.warn('Quiz generation failed (degraded to null):', err instanceof Error ? err.message : err)
      story.quiz = null
    }
  }

  return story
}
