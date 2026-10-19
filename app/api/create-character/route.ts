import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { generateCharacterCard } from '@/lib/api/character'
import { hasConsent } from '@/lib/compliance/consent'
import type { CharacterCard, StyleLexicon, BookLanguage } from '@/lib/types/book'

const PHOTO_USAGES: CharacterCard['photoUsage'][] = ['illustrated', 'photo-family', 'photo-public']

const sql = neon(process.env.NEON_DATABASE_URL!)

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('auth_token')?.value
  if (!token) return null
  try {
    const result = await sql`
      SELECT u.id
      FROM bookbunny_users u
      JOIN auth_sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
      LIMIT 1
    `
    return result[0]?.id || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = (formData.get('name') as string) || 'Hero'
    const photo = formData.get('photo') as File | null
    const theme = (formData.get('theme') as string) || ''
    const ageGroup = (formData.get('ageGroup') as string) || '3-5'
    const styleName = (formData.get('styleName') as string) || ''
    const usageRaw = (formData.get('photoUsage') as string) || 'illustrated'
    const photoUsage = (PHOTO_USAGES as string[]).includes(usageRaw)
      ? (usageRaw as CharacterCard['photoUsage'])
      : 'illustrated'
    const lexiconRaw = formData.get('styleLexicon') as string | null
    // 可选：内容语言（缺省英语）；非法值交由 lib 兜底为英语
    const language = ((formData.get('language') as string) || undefined) as BookLanguage | undefined

    let styleLexicon: StyleLexicon | undefined
    if (lexiconRaw) {
      try { styleLexicon = JSON.parse(lexiconRaw) as StyleLexicon } catch { /* ignore */ }
    }

    // 儿童照片属于个人信息：没有生效的家长同意就绝不处理。
    if (photo && typeof photo.size === 'number' && photo.size > 0) {
      const userId = await getUserId(req)
      if (!userId) {
        return NextResponse.json(
          { error: 'A parent or guardian account is required before a child\u2019s photograph can be used' },
          { status: 401 },
        )
      }
      if (!(await hasConsent(userId))) {
        return NextResponse.json(
          { error: 'Parental consent is required before a child\u2019s photograph can be used' },
          { status: 403 },
        )
      }
    }

    // 宝宝照片（方案B）转 base64 作 FLUX reference；无照片（方案A）走纯插画
    let photoDataUri: string | undefined
    if (photo && typeof photo.arrayBuffer === 'function' && photo.size > 0) {
      const bytes = await photo.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      photoDataUri = `data:${photo.type || 'image/png'};base64,${base64}`
    }

    const result = await generateCharacterCard({
      name,
      photoDataUri,
      styleLexicon,
      styleName,
      ageGroup,
      theme,
      photoUsage,
      language, // 可选：内容语言（缺省英语）
    })

    return NextResponse.json({ name, ...result })
  } catch (err) {
    console.error('Character creation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
