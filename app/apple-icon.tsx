import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** Apple touch icon: the same sprout-over-an-open-book mark as app/icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF1E2',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 512 512">
          <path d="M256 356 C 214 322 152 310 92 324 L92 176 C 152 162 214 174 256 208 Z" fill="#FFFFFF" stroke="#C8A2E8" strokeWidth="10" strokeLinejoin="round" />
          <path d="M256 356 C 298 322 360 310 420 324 L420 176 C 360 162 298 174 256 208 Z" fill="#FFFFFF" stroke="#C8A2E8" strokeWidth="10" strokeLinejoin="round" />
          <path d="M256 208 L256 356" stroke="#C8A2E8" strokeWidth="8" strokeLinecap="round" />
          <path d="M256 208 C 256 176 256 156 256 132" stroke="#4A9E8E" strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M256 140 C 214 140 186 114 182 72 C 222 76 252 100 256 140 Z" fill="#98D8C8" stroke="#4A9E8E" strokeWidth="8" strokeLinejoin="round" />
          <path d="M256 128 C 292 124 316 102 320 64 C 284 70 258 92 256 128 Z" fill="#6FBF73" stroke="#4A9E8E" strokeWidth="8" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
