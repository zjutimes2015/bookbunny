import { ImageResponse } from 'next/og'

export const alt = 'SproutTales — turn an idea into a real picture book'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const COVERS = [
  { title: 'The Moon Bunny', meta: 'GRL B · 16 pages', bg: 'linear-gradient(180deg, #1E2A52 0%, #3D4D86 58%, #85869E 100%)', ink: '#FFF6E2' },
  { title: 'Lila and the Paper Boat', meta: 'GRL A · 12 pages', bg: 'linear-gradient(180deg, #CFE7F4 0%, #EFF6FA 100%)', ink: '#2F4A63' },
  { title: 'Kai’s Quiet Garden', meta: 'GRL C · 20 pages', bg: 'linear-gradient(180deg, #F5E9C6 0%, #DCCB92 100%)', ink: '#4A4327' },
]

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FFF5EE',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, paddingRight: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 700, color: '#FF6B8A', letterSpacing: 2 }}>
            SPROUTTALES
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#2D2D2D', lineHeight: 1.08, marginTop: 20 }}>
            Turn an idea into a real picture book
          </div>
          <div style={{ display: 'flex', fontSize: 27, color: '#5A5A60', lineHeight: 1.45, marginTop: 24 }}>
            Consistent characters, up to 24 illustrated pages, and print-ready PDFs — in minutes.
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: '#8E8E93', marginTop: 28 }}>
            AI picture books · GRL A–E leveled readers
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {COVERS.map((cover, i) => (
            <div
              key={cover.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                width: 168,
                height: 224,
                borderRadius: 12,
                background: cover.bg,
                color: cover.ink,
                padding: '14px 14px',
                transform: `rotate(${i === 0 ? -4 : i === 2 ? 4 : 0}deg)`,
                boxShadow: '0 16px 36px rgba(45,45,45,0.18)',
              }}
            >
              <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{cover.title}</div>
              <div style={{ display: 'flex', fontSize: 13, opacity: 0.85, marginTop: 4 }}>{cover.meta}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
