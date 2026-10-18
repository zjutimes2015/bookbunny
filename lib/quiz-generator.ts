import type { ReadingLevel } from '@/lib/reading-levels'

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
 * 生成阅读理解题（comprehension questions）。
 * 复用 OpenRouter/DeepSeek 管线，与 story 生成同一模型。
 * 输出 3-5 题，每题 4 选项 + 答案索引 + 技能类型。
 */
export async function generateQuiz(storyText: string, level: ReadingLevel | null): Promise<Quiz> {
  const levelBlock = level
    ? `Reading Level: GRL ${level.grl} (${level.label}, ages ${level.ageRange}). Questions must be answerable by a child at this level — simple vocabulary, short options.`
    : 'Keep questions simple and age-appropriate for a young child.'

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

Format: Return ONLY a JSON object:
{
  "questions": [
    {
      "q": "Question text?",
      "options": ["option A", "option B", "option C", "option D"],
      "answer": 0,
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
      .filter((q: any) => q && q.q && Array.isArray(q.options) && q.options.length === 4)
      .slice(0, 5)
      .map((q: any) => ({
        q: String(q.q),
        options: q.options.map((o: any) => String(o)),
        answer: typeof q.answer === 'number' && q.answer >= 0 && q.answer < 4 ? q.answer : 0,
        skill: ['literal', 'inference', 'vocabulary'].includes(q.skill) ? q.skill : 'literal',
      }))

    if (questions.length === 0) throw new Error('Quiz questions invalid')

    return { questions }
  } catch {
    throw new Error('Failed to parse quiz JSON from AI response')
  }
}
