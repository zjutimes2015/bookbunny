import { NextRequest, NextResponse } from 'next/server'
import { generateCharacterCard } from '@/lib/api/character'
import type { CharacterCard, StyleLexicon } from '@/lib/types/book'

const PHOTO_USAGES: CharacterCard['photoUsage'][] = ['illustrated', 'photo-family', 'photo-public']

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

    let styleLexicon: StyleLexicon | undefined
    if (lexiconRaw) {
      try { styleLexicon = JSON.parse(lexiconRaw) as StyleLexicon } catch { /* ignore */ }
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
