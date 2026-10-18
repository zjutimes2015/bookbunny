import { pickLevel, grlFromAgeGroup, levelPromptConstraints, validateVocabulary, type ReadingLevel } from '@/lib/reading-levels'
import { generateQuiz, type Quiz } from '@/lib/quiz-generator'

const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

interface StoryOptions {
  theme: string
  ageGroup: string
  characterName: string
  pages?: number
  level?: string
}

interface StoryResult {
  title: string
  pages: string[]
  level?: string
  levelLabel?: string
  vocabularyPassed?: boolean
  vocabularyRatio?: number
  quiz?: Quiz | null
}

export async function generateStory(options: StoryOptions): Promise<StoryResult> {
  // 1. 解析分级：优先用 level 参数，否则从 ageGroup 映射（向后兼容）
  const grl = (options.level || grlFromAgeGroup(options.ageGroup)).toUpperCase()
  const level: ReadingLevel | null = pickLevel(grl)

  // 2. 构建 prompt：有分级则注入约束，无分级走旧逻辑（老请求兼容）
  let pageCount = options.pages || 20
  let constraintsBlock = ''

  if (level) {
    pageCount = level.pageCount
    constraintsBlock = levelPromptConstraints(level)
  }

  const prompt = `You are a professional children's book author. Write a children's story with the following parameters:

- Theme: ${options.theme}
- Target Age: ${options.ageGroup}
- Main Character: ${options.characterName}
- Number of pages: ${pageCount}

${constraintsBlock ? constraintsBlock + '\n' : ''}Write EXACTLY ${pageCount} short sentences, one per page. Each sentence should be 10-20 words, simple, engaging, and age-appropriate.

Format: Return ONLY a JSON object with:
{
  "title": "The story title",
  "pages": ["Page 1 text", "Page 2 text", ...]
}

The story should have a clear beginning, middle, and end. Each page should be visually descriptive so an illustrator can draw it.`

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
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Story API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Parse JSON from response
  let story: StoryResult
  try {
    // Find JSON in the response (it might be wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      story = JSON.parse(jsonMatch[0])
    } else {
      story = JSON.parse(content)
    }
  } catch {
    throw new Error('Failed to parse story JSON from AI response')
  }

  // 3. 生成后词汇校验（有分级才校验）
  if (level && Array.isArray(story.pages)) {
    const fullText = story.pages.join(' ')
    const check = validateVocabulary(fullText, level)
    story.level = level.grl
    story.levelLabel = `${level.grl} · ${level.label} (ages ${level.ageRange})`
    story.vocabularyPassed = check.passed
    story.vocabularyRatio = Math.round(check.ratio * 100)

    // 超纲 ≥ 5%：提示但保留（前端可显示降级建议），不硬失败——避免坏用户体验
    // spec 决策：二次生成成本高，先提示，Phase 2 再加自动重试
  }

  // 4. 生成阅读理解 Quiz（有分级才生成；失败降级为 null，不阻塞主流程）
  if (level && Array.isArray(story.pages) && story.pages.length > 0) {
    try {
      story.quiz = await generateQuiz(story.pages.join(' '), level)
    } catch (err) {
      console.warn('Quiz generation failed (degraded to null):', err instanceof Error ? err.message : err)
      story.quiz = null
    }
  }

  return story
}
