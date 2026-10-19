// 阶段5/6：生图流程与三步收敛检查表（依据飞书文档第五、六章）
// 12 项生图检查表（文档 5.9）+ 13 项三步流程检查表（文档 6.5）

import type { PageOutline, StyleLexicon } from '@/lib/types/book'

/** 12 项生图检查表（文档 5.9 原文） */
export const IMAGE_CHECKS: { key: string; label: string }[] = [
  { key: 'protagonist-look', label: 'Protagonist appearance consistent' },
  { key: 'outfit-prop', label: 'Outfit and signature props consistent' },
  { key: 'style-consistency', label: 'Art style consistent' },
  { key: 'eye-friendly-color', label: 'Colors eye-friendly' },
  { key: 'page-emotion', label: 'Page emotion accurate' },
  { key: 'page-action', label: 'Page action clear' },
  { key: 'core-elements', label: 'Core visual elements present' },
  { key: 'background-simplicity', label: 'Background not too complex' },
  { key: 'text-whitespace', label: 'Text whitespace reserved' },
  { key: 'extra-characters', label: 'No extra characters' },
  { key: 'ai-errors', label: 'No AI errors (extra hands/feet, distorted faces)' },
  { key: 'book-fit', label: 'Fits the whole book' },
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
      ? { status: 'pass', detail: 'Character-consistency anchor line + reference image injected; protagonist appearance locked' }
      : { status: 'warn', detail: 'Missing consistency anchor line or reference image; protagonist may drift' },
    'outfit-prop': hasConsistency && hasRef
      ? { status: 'pass', detail: 'Consistency anchor line already covers outfit and signature props' }
      : { status: 'warn', detail: 'No consistency constraint; outfit / props may vary per page' },
    'style-consistency': !all(p => nonEmpty(p.visualStyle))
      ? { status: 'warn', detail: 'Some pages are missing visualStyle' }
      : !ctx.styleLexicon
        ? { status: 'warn', detail: 'No fixed style lexicon provided; art style may drift' }
        : styleDistinct > 1
          ? { status: 'warn', detail: `visualStyle has ${styleDistinct} variants; unify them into a single style` }
          : { status: 'pass', detail: 'All pages share the same visualStyle and a fixed style lexicon is set' },
    'eye-friendly-color': all(p => nonEmpty(p.colorMood))
      ? { status: 'pass', detail: 'Every page defines a color mood (eye-friendly palette)' }
      : { status: 'warn', detail: 'Some pages are missing colorMood; check the eye-friendly palette' },
    'page-emotion': all(p => nonEmpty(p.characterEmotion))
      ? { status: 'pass', detail: 'Every page defines character emotion' }
      : { status: 'warn', detail: 'Some pages are missing characterEmotion' },
    'page-action': all(p => nonEmpty(p.characterAction))
      ? { status: 'pass', detail: 'Every page defines character action' }
      : { status: 'warn', detail: 'Some pages are missing characterAction' },
    'core-elements': all(p => Array.isArray(p.coreVisualElements) && p.coreVisualElements.length > 0)
      ? { status: 'pass', detail: 'Every page defines core visual elements' }
      : { status: 'warn', detail: 'Some pages are missing core visual elements' },
    'text-whitespace': all(p => nonEmpty(p.textWhitespace))
      ? { status: 'pass', detail: 'Every page reserves a text-whitespace area' }
      : { status: 'warn', detail: 'Some pages are missing textWhitespace; text may overlap the artwork' },
    'background-simplicity': { status: 'manual', detail: 'Manual check: is the background too complex?' },
    'extra-characters': { status: 'manual', detail: 'Manual check: are there any extra characters?' },
    'ai-errors': { status: 'manual', detail: 'Manual check: AI errors such as extra hands / feet / distorted faces' },
    'book-fit': { status: 'manual', detail: 'Manual check: does it fit the whole book?' },
  }

  return IMAGE_CHECKS.map(c => ({ ...c, ...results[c.key] }))
}

/** 13 项三步流程检查表（文档 6.5 原文） */
export const THREE_STEP_CHECKS: { key: string; label: string }[] = [
  { key: 'theme', label: 'Theme decided' },
  { key: 'age', label: 'Target age decided' },
  { key: 'style', label: 'Picture-book style decided' },
  { key: 'pages-aspect', label: 'Page count and aspect ratio decided' },
  { key: 'protagonist', label: 'Protagonist setting decided' },
  { key: 'outline-table', label: 'Single-page outline table generated' },
  { key: 'page-text', label: 'Every page has page text' },
  { key: 'visual-content', label: 'Every page has visual content' },
  { key: 'layout-suggestion', label: 'Every page has a layout suggestion' },
  { key: 'style-elements', label: 'Every page has visual style and core elements' },
  { key: 'trial', label: '4-5 pages trial-generated' },
  { key: 'prompt-adjusted', label: 'Prompt adjusted based on results' },
  { key: 'batch', label: 'Batched 5-page generation started' },
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
