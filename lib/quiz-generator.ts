import type { ReadingLevel } from '@/lib/reading-levels'
import { contentLanguageRule, DEFAULT_BOOK_LANGUAGE, type BookLanguage } from '@/lib/types/book'

const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number // index into options
  skill: 'literal' | 'inference' | 'vocabulary'
}

export interface Quiz {
  questions: QuizQuestion[]
}

/**
 * 打乱选项顺序并同步正确答案索引。
 *
 * 模型有很强的“把正确答案放第一项”的倾向（实测旧版 8/8 题答案都是索引 0），
 * 孩子只要每次选第一项就能拿满分。洗牌必须在服务端做，不能只靠 prompt。
 */
export function shuffleOptions(
  options: string[],
  answer: number,
): { options: string[]; answer: number } {
  const order = options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = order[i]
    order[i] = order[j]
    order[j] = tmp
  }
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) }
}

/**
 * 生成阅读理解题（comprehension questions）。
 * 复用 OpenRouter/DeepSeek 管线，与 story 生成同一模型。
 * 输出 3-5 题，每题 4 选项 + 答案索引 + 技能类型。
 */
export async function generateQuiz(storyText: string, level: ReadingLevel | null, language?: BookLanguage): Promise<Quiz> {
  const levelBlock = level
    ? `Reading Level: GRL ${level.grl} (${level.label}, ages ${level.ageRange}). Questions must be answerable by a child at this level — simple vocabulary, short options.`
    : 'Keep questions simple and age-appropriate for a young child.'

  const lang = language ?? DEFAULT_BOOK_LANGUAGE
  const languageRule = contentLanguageRule(lang)

  const prompt = `You are a children's reading comprehension teacher. Based on the story below, create EXACTLY 4 multiple-choice questions.

${levelBlock}

Story:
"""
${storyText}
"""

Rules:
- 2 questions test literal recall (what happened), 1 tests inference (why/how), 1 tests vocabulary (word meaning from context)
- Each question has exactly 4 options, only ONE correct answer
- Options should be short (2-6 words), simple, unambiguous
- Correct answer index is 0-based
- Vary the position of the correct option across questions (do not put every answer first)
- ${languageRule}

Format: Return ONLY a JSON object:
{
  "questions": [
    {
      "q": "Question text?",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": 2,
      "skill": "literal" | "inference" | "vocabulary"
    }
  ]
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
        { role: 'system', content: 'You are a reading comprehension teacher. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Quiz API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

    // 防御性校验：确保结构合法，非法则抛出让上层降级
    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Quiz returned no questions')
    }

    const questions: QuizQuestion[] = parsed.questions
      .filter(
        (q: any) =>
          q &&
          q.q &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          // 答案索引非法时直接丢弃：默认成 0 会静默产生错题
          typeof q.answer === 'number' &&
          q.answer >= 0 &&
          q.answer < 4,
      )
      .slice(0, 5)
      .map((q: any) => {
        const shuffled = shuffleOptions(q.options.map((o: any) => String(o)), q.answer)
        return {
          q: String(q.q),
          options: shuffled.options,
          answer: shuffled.answer,
          skill: ['literal', 'inference', 'vocabulary'].includes(q.skill) ? q.skill : 'literal',
        }
      })

    if (questions.length === 0) throw new Error('Quiz questions invalid')

    return { questions }
  } catch {
    throw new Error('Failed to parse quiz JSON from AI response')
  }
}
