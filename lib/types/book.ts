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

/** 画幅选项（前端下拉用，含中文说明） */
export const ASPECT_OPTIONS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '1:1', label: '方形 1:1', desc: '新手推荐 · 最稳' },
  { id: '4:3', label: '横版 4:3', desc: '风景 / 场景' },
  { id: '3:4', label: '竖版 3:4', desc: '人物 / 特写' },
  { id: '16:9', label: '宽屏 16:9', desc: '动画 / 视频' },
  { id: 'a4', label: 'A4 竖版', desc: '打印 / 装订' },
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
