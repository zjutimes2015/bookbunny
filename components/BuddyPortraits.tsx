export function LilaPortrait({ size = 160, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="Lila, a cartoon girl in a yellow raincoat"
    >
      <circle cx="80" cy="80" r="76" fill="#E7F3FA" />
      <ellipse cx="80" cy="128" rx="36" ry="22" fill="#F2C14E" />
      <path d="M52 118 h56" stroke="#D9A93B" strokeWidth="3" />
      <rect x="62" y="132" width="12" height="14" rx="3" fill="#5B6B7A" />
      <rect x="86" y="132" width="12" height="14" rx="3" fill="#5B6B7A" />
      <circle cx="80" cy="72" r="28" fill="#C98D63" />
      <path d="M54 66 q8 -28 26 -28 q18 0 26 28 q-14 -12 -26 -8 q-12 -4 -26 8 Z" fill="#4A3226" />
      <circle cx="58" cy="78" r="7" fill="#4A3226" />
      <circle cx="102" cy="78" r="7" fill="#4A3226" />
      <circle cx="70" cy="74" r="3.2" fill="#2D2D2D" />
      <circle cx="90" cy="74" r="3.2" fill="#2D2D2D" />
      <circle cx="71.2" cy="72.8" r="1.1" fill="#FFFFFF" />
      <circle cx="91.2" cy="72.8" r="1.1" fill="#FFFFFF" />
      <path d="M74 84 q6 5 12 0" stroke="#2D2D2D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="64" cy="82" rx="4" ry="2.4" fill="#E7A08A" opacity="0.8" />
      <ellipse cx="96" cy="82" rx="4" ry="2.4" fill="#E7A08A" opacity="0.8" />
      <g transform="translate(108 108)">
        <path d="M0 8 L28 8 L20 18 L8 18 Z" fill="#FFFDF7" stroke="#D8CDB8" strokeWidth="1.4" />
        <path d="M14 0 L14 8 M14 0 L24 8 M14 0 L4 8" stroke="#D8CDB8" strokeWidth="1.3" fill="none" />
      </g>
    </svg>
  )
}

export function KaiPortrait({ size = 160, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="Kai, a cartoon boy with round glasses"
    >
      <circle cx="80" cy="80" r="76" fill="#F6EFD2" />
      <ellipse cx="80" cy="126" rx="34" ry="22" fill="#6E8F55" />
      <circle cx="80" cy="74" r="28" fill="#C98D63" />
      <path d="M52 66 q10 -30 28 -28 q20 2 28 28 q-16 -12 -28 -8 q-16 -4 -28 8 Z" fill="#3F3A32" />
      <circle cx="68" cy="76" r="9" fill="none" stroke="#3F3A32" strokeWidth="2.2" />
      <circle cx="92" cy="76" r="9" fill="none" stroke="#3F3A32" strokeWidth="2.2" />
      <path d="M77 76 h6" stroke="#3F3A32" strokeWidth="2.2" />
      <circle cx="68" cy="76" r="2.4" fill="#2D2D2D" />
      <circle cx="92" cy="76" r="2.4" fill="#2D2D2D" />
      <path d="M74 88 q6 4 12 0" stroke="#2D2D2D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="84" rx="4" ry="2.4" fill="#E7A08A" opacity="0.75" />
      <ellipse cx="98" cy="84" rx="4" ry="2.4" fill="#E7A08A" opacity="0.75" />
      <g transform="translate(104 112)">
        <path d="M8 22 V8" stroke="#5E7C4A" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="8" cy="8" rx="7" ry="4" fill="#8FBF6A" transform="rotate(-30 8 8)" />
        <ellipse cx="8" cy="8" rx="7" ry="4" fill="#6E8F55" transform="rotate(30 8 8)" />
        <circle cx="8" cy="6" r="3.2" fill="#F1C14E" />
      </g>
    </svg>
  )
}
