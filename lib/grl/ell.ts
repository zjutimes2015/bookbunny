import { pickLevel } from '../reading-levels'

/**
 * ELL（English Language Learner）生成约束。
 *
 * 定位：面向「英语不是母语」的家庭和课堂 —— 孩子要读的是**英语分级读物**，
 * 而不是母语读物。这与「把故事翻译成 10 种语言」是两件事：
 *   - 翻译：一本书换语言，难度不变
 *   - ELL：内容始终是英语，但按 GRL 分级控制词汇和句长，让母语非英语的孩子能爬坡
 *
 * ReadKidz 的 25 语种是全站镜像（翻译），竞品对照页里 8 个工具没有一个做分级。
 * 这是 SproutTales 独有的能力面。
 */

/** ELL 约束的强度档 */
export type EllSupport = 'none' | 'light' | 'full'

export interface EllOptions {
  /** 是否启用 ELL 模式 */
  enabled: boolean
  /** 约束强度（默认 full）：light 只管用词与句式，full 额外要求图文对应 */
  support?: Exclude<EllSupport, 'none'>
  /** 家庭母语（可选），用于禁止母语出现在正文里 */
  homeLanguage?: string
}

/**
 * 常见家庭母语（课堂 / 家庭场景的高频项）。
 * 只作为「禁止出现在正文里的语言」的声明来源，不会被翻译进正文。
 */
export const ELL_HOME_LANGUAGES: { id: string; label: string }[] = [
  { id: 'Spanish', label: 'Spanish' },
  { id: 'Chinese', label: 'Chinese' },
  { id: 'Arabic', label: 'Arabic' },
  { id: 'Hindi', label: 'Hindi' },
  { id: 'Portuguese', label: 'Portuguese' },
  { id: 'French', label: 'French' },
  { id: 'Vietnamese', label: 'Vietnamese' },
  { id: 'Tagalog', label: 'Tagalog' },
  { id: 'Russian', label: 'Russian' },
  { id: 'Korean', label: 'Korean' },
  { id: 'Japanese', label: 'Japanese' },
  { id: 'Ukrainian', label: 'Ukrainian' },
  { id: 'Somali', label: 'Somali' },
  { id: 'Punjabi', label: 'Punjabi' },
  { id: 'Urdu', label: 'Urdu' },
]

/**
 * 生成 ELL 约束文本，注入 LLM prompt。
 *
 * 关键点：
 * 1. 文本语言始终是英语（不能因为孩子是 ELL 就把书写成西语）
 * 2. 在 GRL 之上再加一层"高频教学词优先"—— ELL 教材的用词是受控的，
 *    同一批词在多本书里反复出现，孩子能形成词族
 * 3. 句子结构更简单，但内容不幼稚
 */
export function ellPromptConstraints(
  grl: string,
  options: EllOptions = { enabled: false },
): string {
  if (!options.enabled) return ''

  const level = pickLevel(grl)
  if (!level) return ''

  const support: Exclude<EllSupport, 'none'> = options.support === 'light' ? 'light' : 'full'

  const lines: string[] = [
    `Audience: English language learners. The story is written in English, for a child whose home language is not English.`,
    `Reading level: GRL ${level.grl} (${level.label}, ages ${level.ageRange}).`,
    `Word choice: Use high-frequency English words that a learner at this level is likely to have met in school. Reuse the same core words across pages so the learner builds familiarity.`,
    `Sentence structure: Keep sentences short and in a consistent, natural order (${level.sentenceMaxWords} words max). Avoid idioms, phrasal verbs, and figurative language that cannot be understood from context.`,
    options.homeLanguage
      ? `Do NOT use ${options.homeLanguage} anywhere in the book. The learner is reading English; the home language must not appear in the text.`
      : `Do NOT use any language other than English anywhere in the book.`,
  ]

  // full 档：额外的「图文对应」约束 —— 学龄前 ELL 最怕的是看不懂插图在讲什么
  if (support === 'full') {
    lines.push(
      `Sentence boundary: Do not put line breaks inside a sentence. Each page contains complete sentences only.`,
      `First mention: When a concrete noun appears for the first time, the surrounding sentence must make its meaning clear from context alone — no definition, gloss, or translation in parentheses.`,
      `Illustration support: Every concrete noun in the text should be depicted in that page's illustration, so the learner can connect the word to the picture.`,
    )
  }

  return lines.join('\n')
}

/**
 * ELL 词汇表里额外标注的「需要预教的词」。
 *
 * 这些是超出目标档位、但对理解故事必需的词。教师应该先教这些词，
 * 而不是让学生在阅读中撞上。判定标准：出现频率高 + 属于超纲词。
 */
export function pickWordsToPreTeach(
  aboveLevelWords: { word: string; count: number }[],
  limit = 8,
): { word: string; count: number }[] {
  return [...aboveLevelWords]
    .filter(w => w.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * 解析并清洗来自请求体的 ELL 选项。
 *
 * homeLanguage 会被拼进 LLM prompt，所以必须当作不可信输入处理：
 * 只保留字母、空格和连字符，长度封顶，防止提示词注入。
 */
export function parseEllOptions(raw: unknown): EllOptions | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  if (obj.enabled !== true) return undefined

  const support =
    obj.support === 'light' ? 'light' : 'full'

  let homeLanguage: string | undefined
  if (typeof obj.homeLanguage === 'string') {
    const cleaned = obj.homeLanguage
      .replace(/[^A-Za-z -]/g, '')
      .trim()
      .slice(0, 30)
    if (cleaned.length >= 2) homeLanguage = cleaned
  }

  return { enabled: true, support, homeLanguage }
}
