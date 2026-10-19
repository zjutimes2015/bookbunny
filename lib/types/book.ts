// BookBunny 结构化绘本数据模型
// 依据《AI 制作绘本的超详细攻略》第四章「单页大纲」与第三章「角色设定」

/** 页面功能（文档 4.3 字段②）：封面 / 扉页 / 正文 / 封底 */
export type PageFunction = 'cover' | 'front-matter' | 'body' | 'back-cover'

/** 绘本画幅比例（文档 3.x 规格；新手推荐 1:1） */
export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | 'a4'

/** 比例 → FLUX 生图尺寸映射 */
export const ASPECT_SIZE: Record<AspectRatio, string> = {
  '1:1': '1024x1024',
  '4:3': '1024x768',
  '3:4': '768x1024',
  '16:9': '1280x720',
  a4: '1024x1448',
}

export const DEFAULT_ASPECT: AspectRatio = '1:1'

/** 画幅选项（前端下拉用，label/desc 为英文，读者可见） */
export const ASPECT_OPTIONS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '1:1', label: 'Square 1:1', desc: 'Recommended' },
  { id: '4:3', label: 'Landscape 4:3', desc: 'Scenery · landscape' },
  { id: '3:4', label: 'Portrait 3:4', desc: 'Characters · close-ups' },
  { id: '16:9', label: 'Widescreen 16:9', desc: 'Animation · video' },
  { id: 'a4', label: 'A4 Portrait', desc: 'Print · binding' },
]

export function normalizeAspect(raw: unknown): AspectRatio {
  return (typeof raw === 'string' && raw in ASPECT_SIZE) ? (raw as AspectRatio) : DEFAULT_ASPECT
}

/**
 * 图片命名（文档 5.8）：按页面功能输出规范文件名。
 * cover → cover.png / front-matter → front-matter.png / back-cover → back-cover.png /
 * body → page-XX.png（页码两位补零）。
 */
export function pageFileName(p: Pick<PageOutline, 'pageNumber' | 'pageFunction'>): string {
  switch (p.pageFunction) {
    case 'cover':
      return 'cover.png'
    case 'front-matter':
      return 'front-matter.png'
    case 'back-cover':
      return 'back-cover.png'
    default:
      return `page-${String(p.pageNumber).padStart(2, '0')}.png`
  }
}

/**
 * 单页大纲：文档 4.3 的 18 个字段，逐页「施工图」。
 * 这是绘本生成管线的核心数据结构——生图阶段直接消费表B字段。
 */
export interface PageOutline {
  /** ① 页码 */
  pageNumber: number
  /** ② 页面功能 */
  pageFunction: PageFunction
  /** ③ 本页主题 */
  pageTheme: string
  /** ④ 剧情节点 */
  plotNode: string
  /** ⑤ 出场角色 */
  characters: string[]
  /** ⑥ 角色动作 */
  characterAction: string
  /** ⑦ 角色情绪 */
  characterEmotion: string
  /** ⑧ 页面文字（给孩子读的文字） */
  pageText: string
  /** ⑨ 字数建议 */
  wordCountHint: number
  /** ⑩ 视觉风格 */
  visualStyle: string
  /** ⑪ 色彩氛围 */
  colorMood: string
  /** ⑫ 核心视觉元素 */
  coreVisualElements: string[]
  /** ⑬ 辅助视觉元素 */
  supportingVisualElements: string[]
  /** ⑭ 构图方式 */
  composition: string
  /** ⑮ 文字留白区域 */
  textWhitespace: string
  /** ⑯ 禁止元素 */
  forbiddenElements: string[]
  /** ⑰ 生图 prompt 要点 */
  imagePromptPoints: string
  /** ⑱ 承接关系 */
  continuity: string
}

/** 表A：故事与文字（文档 4.5，9 列） */
export type StoryColumns = Pick<
  PageOutline,
  | 'pageNumber'
  | 'pageFunction'
  | 'pageTheme'
  | 'plotNode'
  | 'characters'
  | 'characterAction'
  | 'characterEmotion'
  | 'pageText'
  | 'wordCountHint'
>

/** 表B：视觉与生图（文档 4.5，10 列） */
export type VisualColumns = Pick<
  PageOutline,
  | 'pageNumber'
  | 'visualStyle'
  | 'colorMood'
  | 'coreVisualElements'
  | 'supportingVisualElements'
  | 'composition'
  | 'textWhitespace'
  | 'forbiddenElements'
  | 'imagePromptPoints'
  | 'continuity'
>

/** 表A / 表B（页数 >16 时拆分，便于审阅） */
export interface OutlineTables {
  tableA: StoryColumns[]
  tableB: VisualColumns[]
}

/** 主题设定卡（文档 1.9，10 项） */
export interface BookSettingCard {
  workingTitle: string
  ageRange: string
  bookType: string
  coreTheme: string
  protagonist: string
  protagonistProblem: string
  storyDirection: string
  emotionOrValue: string
  pictureKeywords: string
  aiReady: boolean
}

/** 风格设定卡（文档 2.3，10 项，一本只定 1 个主风格） */
export interface StyleCard {
  /** 绘本主题 */
  workingTheme: string
  /** 目标年龄 */
  ageRange: string
  /** 主风格 */
  mainStyle: string
  /** 色彩氛围 */
  colorMood: string
  /** 护眼要求 */
  eyeCare: string
  /** 角色造型 */
  characterStyling: string
  /** 场景复杂度 */
  sceneComplexity: string
  /** 情绪质感 */
  emotionTexture: string
  /** 固定风格关键词 */
  styleKeywords: string
  /** 禁止出现的风格 */
  forbiddenStyles: string
}

/** 固定风格词库（文档 2.4，6 类，确定后每页复用） */
export interface StyleLexicon {
  /** 插画技法 */
  technique: string
  /** 色彩氛围 */
  colorMood: string
  /** 角色造型 */
  characterStyling: string
  /** 场景复杂度 */
  sceneComplexity: string
  /** 画面质感 */
  texture: string
  /** 禁止项 */
  forbidden: string
}

/** 角色设定卡（文档 3.7，12 项） */
export interface CharacterCard {
  name: string
  roleType: string
  ageFeel: string
  appearance: string
  hairOrFur: string
  clothing: string
  signatureProp: string
  personality: string
  commonExpressions: string
  commonActions: string
  storyProblem: string
  noChangeItems: string
  /** 照片使用方案（文档 3.x）：illustrated=方案A 不用真照 / photo-family=方案B 仅家庭用 / photo-public=方案B 可公开 */
  photoUsage?: 'illustrated' | 'photo-family' | 'photo-public'
}

/** 故事生成结果（含结构化单页大纲） */
export interface StoryResult {
  title: string
  /** 18 字段单页大纲 */
  outline: PageOutline[]
  /** 表A / 表B 拆分视图 */
  tables: OutlineTables
  level?: string
  levelLabel?: string
  vocabularyPassed?: boolean
  vocabularyRatio?: number
  quiz?: unknown
}

/** 把单页大纲按表A/表B 拆分 */
export function splitOutline(outline: PageOutline[]): OutlineTables {
  return {
    tableA: outline.map(
      ({
        pageNumber, pageFunction, pageTheme, plotNode, characters,
        characterAction, characterEmotion, pageText, wordCountHint,
      }) => ({
        pageNumber, pageFunction, pageTheme, plotNode, characters,
        characterAction, characterEmotion, pageText, wordCountHint,
      }),
    ),
    tableB: outline.map(
      ({
        pageNumber, visualStyle, colorMood, coreVisualElements,
        supportingVisualElements, composition, textWhitespace,
        forbiddenElements, imagePromptPoints, continuity,
      }) => ({
        pageNumber, visualStyle, colorMood, coreVisualElements,
        supportingVisualElements, composition, textWhitespace,
        forbiddenElements, imagePromptPoints, continuity,
      }),
    ),
  }
}

/** 从单页大纲提取纯文本数组（用于存量 content 投影 / 阅读进度 / 词汇校验） */
export function outlineToPages(outline: PageOutline[]): string[] {
  return outline.map(p => p.pageText)
}

/**
 * 兼容适配器：把存量 `pages: string[]`（旧数据）转成最小单页大纲。
 * 仅填充页码、页面功能、页面文字，其余字段留空默认值。
 */
export function pagesToOutline(pages: string[]): PageOutline[] {
  return pages.map((text, i) => ({
    pageNumber: i + 1,
    pageFunction: 'body',
    pageTheme: '',
    plotNode: '',
    characters: [],
    characterAction: '',
    characterEmotion: '',
    pageText: text,
    wordCountHint: text.length,
    visualStyle: '',
    colorMood: '',
    coreVisualElements: [],
    supportingVisualElements: [],
    composition: '',
    textWhitespace: '',
    forbiddenElements: [],
    imagePromptPoints: '',
    continuity: '',
  }))
}

/** 绘本内容语言（出海产品默认英语）。一本绘本只用一个语言，禁止中英混杂。 */
export type BookLanguage =
  | 'en'
  | 'zh'
  | 'zh-TW'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'ko'
  | 'pt'
  | 'it'

export const DEFAULT_BOOK_LANGUAGE: BookLanguage = 'en'

/** 语言下拉选项：label 为英文名，nativeLabel 为该语言的自称 */
export interface LanguageOption {
  id: BookLanguage
  label: string
  nativeLabel: string
}

export const BOOK_LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English', nativeLabel: 'English' },
  { id: 'zh', label: 'Chinese (Simplified)', nativeLabel: '中文（简体）' },
  { id: 'zh-TW', label: 'Chinese (Traditional)', nativeLabel: '繁體中文' },
  { id: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { id: 'fr', label: 'French', nativeLabel: 'Français' },
  { id: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { id: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { id: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { id: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { id: 'it', label: 'Italian', nativeLabel: 'Italiano' },
]

const LANGUAGE_NAMES: Record<BookLanguage, string> = {
  en: 'English',
  zh: 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  it: 'Italian',
}

/** 供 prompt 使用的英文语言名（如 "English"） */
export function languageName(lang?: BookLanguage | null): string {
  return LANGUAGE_NAMES[lang as BookLanguage] || 'English'
}

/**
 * 内容语言约束（注入 LLM prompt），保证一本书只出现一种语言：
 * - 面向读者的文字（标题/正文/剧情/情绪/quiz）使用目标语言；
 * - 面向生图模型的视觉字段保持英文，保证 FLUX 出图稳定。
 */
export function contentLanguageRule(lang?: BookLanguage | null): string {
  const name = languageName(lang)
  return (
    `Write ALL reader-facing text (title, pageTheme, plotNode, characterAction, characterEmotion, pageText, continuity, and every quiz question/option) in ${name}. ` +
    `Never mix languages within one book. ` +
    `Write the image-facing fields (visualStyle, colorMood, composition, textWhitespace, imagePromptPoints, forbiddenElements) in English so the image model renders reliably.`
  )
}
