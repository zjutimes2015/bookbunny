/**
 * 套餐硬边界（纯函数，无 DB 依赖，客户端与服务端共用同一口径）。
 *
 * 页数上限是生图成本的硬边界：一本书的生图成本 ≈ 页数 × 单价
 * （FLUX.2 flex 1:1 = $0.05/张，A4 = $0.10/张）。
 * 16 页 × $0.05 = $0.80/本；24 页 × $0.05 = $1.20/本。
 * 所有能触发生图的入口都必须用这个上限封顶。
 *
 * 档位页数上限：
 *   Free    8 页 —— 试用，够读完一个完整故事
 *   Creator 16 页 —— KDP 精装书可用的下限，导出补页更少
 *   Studio  24 页 —— 正好等于 KDP 最小合规页数，导出零补页
 *   Teacher 24 页 —— 课堂读物同样需要 24 页才能免补页
 */
export function maxPagesFor(tier: string | undefined, isPaid: boolean): number {
  if (!tier && !isPaid) return 8
  if (tier === 'studio' || tier === 'teacher') return 24
  if (tier === 'creator' || tier === 'commercial') return 16
  return 8
}

/**
 * 一本书消耗的额度单位（只看页数）。
 *
 * 1 单位 = 1 本标准书（≤12 页，1:1 画幅生图成本约 $0.60）。
 * 13–24 页的长书生图成本翻倍（$1.20），扣 2 个单位，保证任何档位满额使用时都有 80% 以上毛利。
 *
 * A4 画幅的翻倍计费在 lib/allocation.ts 的 bookCostUnits 里处理（那里还要看画幅），
 * 两处不要重复定义同一口径。
 */
export function pageCostUnits(pages: number): number {
  return pages > 12 ? 2 : 1
}
