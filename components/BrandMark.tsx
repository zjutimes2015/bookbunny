/**
 * SproutTales 品牌标组件
 *
 * A 案标形：嫩芽从摊开的书页长出。几何与 scripts/brand-mark.cjs 保持一致，
 * 这里只做尺寸与配色适配，不重新定义路径。
 *
 * 用法：
 *   <BrandMark size={32} />                渐变圆角方块（导航栏）
 *   <BrandMark size={32} variant="ink" />  墨色圆角方块
 *   <BrandMark size={32} variant="mark" /> 单体标（透明底）
 */

import { useId } from 'react'

interface BrandMarkProps {
  /** 边长（px） */
  size?: number
  /** 方块圆角比例，0.22 ≈ 苹果图标观感 */
  radius?: number
  /** 配色方案 */
  variant?: 'gradient' | 'ink' | 'mark'
  className?: string
}

/** 标形路径：摊开的书 + 从中缝长出的嫩芽 */
const MARK_PATHS = (
  <>
    <path d="M32 33.5C26 28.5 18 26.5 10 27.5V43.5C18 42.5 26 44.5 32 50.5C38 44.5 46 42.5 54 43.5V27.5C46 26.5 38 28.5 32 33.5Z" />
    <path d="M32 34V21" fill="none" strokeWidth="3.6" strokeLinecap="round" />
    <path d="M32 25C25.5 23.5 21.5 18 21.5 10.5C29 11.5 32 17 32 25Z" />
    <path d="M32 25C38.5 23.5 42.5 18 42.5 10.5C35 11.5 32 17 32 25Z" />
  </>
)

export default function BrandMark({
  size = 32,
  radius = 0.22,
  variant = 'gradient',
  className = '',
}: BrandMarkProps) {
  // 同一页可能出现多个标，渐变 id 必须唯一，否则会串到别的 SVG 上
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const gid = `bm-${uid}`
  // viewBox 是 64 宽，圆角按比例换算
  const rx = Math.round(radius * 64)

  if (variant === 'mark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={className}
        aria-hidden="true"
      >
        <g fill="#2D2D2D" stroke="#2D2D2D" transform="translate(7 7) scale(0.78125)">
          {MARK_PATHS}
        </g>
      </svg>
    )
  }

  const bg =
    variant === 'ink' ? (
      <rect width="64" height="64" rx={rx} fill="#2D2D2D" />
    ) : (
      <>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B8A" />
            <stop offset="50%" stopColor="#C8A2E8" />
            <stop offset="100%" stopColor="#87CEEB" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx={rx} fill={`url(#${gid})`} />
      </>
    )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {bg}
      <g fill="#FFFFFF" stroke="#FFFFFF" transform="translate(7 7) scale(0.78125)">
        {MARK_PATHS}
      </g>
    </svg>
  )
}
