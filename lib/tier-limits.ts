/**
 * 套餐硬边界（纯函数，无 DB 依赖，客户端与服务端共用同一口径）。
 *
 * 页数上限是生图成本的硬边界：一本书的生图成本 ≈ 页数 × 单价
 * （FLUX.2 flex 1:1 = $0.05/张，A4 = $0.10/张）。
 * 12 页 × $0.05 = $0.60/本；超过上限的页数会直接吃掉本档位的毛利。
 * 所有能触发生图的入口都必须用这个上限封顶。
 */
export function maxPagesFor(tier: string | undefined, isPaid: boolean): number {
  if (!tier && !isPaid) return 8
  if (tier === 'creator' || tier === 'studio' || tier === 'commercial') return 12
  return 8
}
