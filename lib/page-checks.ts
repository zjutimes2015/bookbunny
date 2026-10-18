// 阶段5/6：生图流程与三步收敛检查表（依据飞书文档第五、六章）
// 12 项生图检查表（文档 5.9）+ 13 项三步流程检查表（文档 6.5）

import type { PageOutline, StyleLexicon } from '@/lib/types/book'

/** 12 项生图检查表（文档 5.9 原文） */
export const IMAGE_CHECKS: { key: string; label: string }[] = [
  { key: 'protagonist-look', label: '主角外貌是否一致' },
  { key: 'outfit-prop', label: '服装和标志性道具是否一致' },
  { key: 'style-consistency', label: '画风是否统一' },
  { key: 'eye-friendly-color', label: '色彩是否护眼' },
  { key: 'page-emotion', label: '本页情绪是否准确' },
  { key: 'page-action', label: '本页动作是否清楚' },
  { key: 'core-elements', label: '核心视觉元素是否出现' },
  { key: 'background-simplicity', label: '背景是否太复杂' },
  { key: 'text-whitespace', label: '是否有文字留白' },
  { key: 'extra-characters', label: '是否有多余人物' },
  { key: 'ai-errors', label: '是否有 AI 错误（多手、多脚、五官错乱）' },
  { key: 'book-fit', label: '是否适合放进整本绘本' },
]

export type CheckStatus = 'pass' | 'warn' | 'manual'

export interface ImageCheckResult {
  key: string
  label: string
  status: CheckStatus
  detail: string
}

const nonEmpty = (v?: string) => !!v && v.trim().length > 0

/**
 * 运行 12 项生图检查：可确定性判定的项自动给结论，其余交给人勾选（manual）。
 * 自动判定：画风统一 / 文字留白 / 核心视觉元素 / 角色一致性（一致性句 + 参考图）。
 */
export function runImageChecks(
  outline: PageOutline[],
  ctx: { consistencyLine?: string; styleLexicon?: StyleLexicon | null; hasRefImage?: boolean },
): ImageCheckResult[] {
  const total = outline.length
  const all = (fn: (p: PageOutline) => boolean) => total > 0 && outline.every(fn)
  const styleDistinct = new Set(outline.map(p => p.visualStyle).filter(nonEmpty)).size
  const hasConsistency = nonEmpty(ctx.consistencyLine)
  const hasRef = !!ctx.hasRefImage

  const results: Record<string, { status: CheckStatus; detail: string }> = {
    'protagonist-look': hasConsistency && hasRef
      ? { status: 'pass', detail: '已注入角色一致性固定句 + 参考图，主角外貌已锁定' }
      : { status: 'warn', detail: '缺少一致性固定句或参考图，主角外貌可能漂移' },
    'outfit-prop': hasConsistency && hasRef
      ? { status: 'pass', detail: '一致性固定句已覆盖服装与标志性道具' }
      : { status: 'warn', detail: '缺一致性约束，服装 / 道具可能每页不一致' },
    'style-consistency': !all(p => nonEmpty(p.visualStyle))
      ? { status: 'warn', detail: '存在页面缺少 visualStyle' }
      : !ctx.styleLexicon
        ? { status: 'warn', detail: '未提供固定风格词库，画风可能漂移' }
        : styleDistinct > 1
          ? { status: 'warn', detail: `visualStyle 出现 ${styleDistinct} 种，需统一为同一画风` }
          : { status: 'pass', detail: '全部页面 visualStyle 一致，且已固定风格词库' },
    'eye-friendly-color': all(p => nonEmpty(p.colorMood))
      ? { status: 'pass', detail: '每页均定义色彩氛围（护眼配色）' }
      : { status: 'warn', detail: '有页面缺少 colorMood，注意护眼配色' },
    'page-emotion': all(p => nonEmpty(p.characterEmotion))
      ? { status: 'pass', detail: '每页均定义角色情绪' }
      : { status: 'warn', detail: '有页面缺少 characterEmotion' },
    'page-action': all(p => nonEmpty(p.characterAction))
      ? { status: 'pass', detail: '每页均定义角色动作' }
      : { status: 'warn', detail: '有页面缺少 characterAction' },
    'core-elements': all(p => Array.isArray(p.coreVisualElements) && p.coreVisualElements.length > 0)
      ? { status: 'pass', detail: '每页均定义核心视觉元素' }
      : { status: 'warn', detail: '有页面缺少核心视觉元素' },
    'text-whitespace': all(p => nonEmpty(p.textWhitespace))
      ? { status: 'pass', detail: '每页均预留文字留白区域' }
      : { status: 'warn', detail: '有页面缺少 textWhitespace，文字可能压住画面' },
    'background-simplicity': { status: 'manual', detail: '需人工核对背景是否过于复杂' },
    'extra-characters': { status: 'manual', detail: '需人工核对是否出现多余人物' },
    'ai-errors': { status: 'manual', detail: '需人工核对多手 / 多脚 / 五官错乱等 AI 错误' },
    'book-fit': { status: 'manual', detail: '需人工核对是否适合放进整本绘本' },
  }

  return IMAGE_CHECKS.map(c => ({ ...c, ...results[c.key] }))
}

/** 13 项三步流程检查表（文档 6.5 原文） */
export const THREE_STEP_CHECKS: { key: string; label: string }[] = [
  { key: 'theme', label: '已确定主题' },
  { key: 'age', label: '已确定目标年龄' },
  { key: 'style', label: '已确定绘本风格' },
  { key: 'pages-aspect', label: '已确定页数和比例' },
  { key: 'protagonist', label: '已确定主角设定' },
  { key: 'outline-table', label: '已生成单页大纲表' },
  { key: 'page-text', label: '每页有页面文字' },
  { key: 'visual-content', label: '每页有画面内容' },
  { key: 'layout-suggestion', label: '每页有排版建议' },
  { key: 'style-elements', label: '每页有视觉风格和核心元素' },
  { key: 'trial', label: '已试生成 4-5 页' },
  { key: 'prompt-adjusted', label: '已根据效果调整提示词' },
  { key: 'batch', label: '已开始 5 页一批生成' },
]

export interface ThreeStepCheckState {
  theme?: string
  ageGroup?: string
  styleChosen?: boolean
  pages?: number
  aspect?: string
  protagonist?: boolean
  hasOutline?: boolean
  outline?: PageOutline[]
  trialGenerated?: boolean
  batchesStarted?: boolean
}

/** 按当前「设定 / 大纲 / 生图」状态派生 13 项勾选态 */
export function runThreeStepChecks(state: ThreeStepCheckState): { key: string; label: string; done: boolean }[] {
  const o = state.outline || []
  const every = (fn: (p: PageOutline) => boolean) => o.length > 0 && o.every(fn)

  const done: Record<string, boolean> = {
    theme: nonEmpty(state.theme),
    age: !!state.ageGroup,
    style: !!state.styleChosen,
    'pages-aspect': typeof state.pages === 'number' && state.pages > 0 && !!state.aspect,
    protagonist: !!state.protagonist,
    'outline-table': !!state.hasOutline && o.length > 0,
    'page-text': every(p => nonEmpty(p.pageText)),
    'visual-content': every(p => nonEmpty(p.plotNode) || (p.coreVisualElements?.length ?? 0) > 0),
    'layout-suggestion': every(p => nonEmpty(p.composition) || nonEmpty(p.textWhitespace)),
    'style-elements': every(p => nonEmpty(p.visualStyle) && (p.coreVisualElements?.length ?? 0) > 0),
    trial: !!state.trialGenerated,
    // 试生成后仍继续批量，视为已根据试生成效果调整提示词
    'prompt-adjusted': !!state.trialGenerated && !!state.batchesStarted,
    batch: !!state.batchesStarted,
  }

  return THREE_STEP_CHECKS.map(c => ({ ...c, done: done[c.key] ?? false }))
}
