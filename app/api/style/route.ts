import { NextRequest, NextResponse } from 'next/server'
import { generateStyleLexicon } from '@/lib/api/style'

export async function POST(req: NextRequest) {
  try {
    const { styleId, ageGroup, theme, language } = await req.json()

    if (!styleId) {
      return NextResponse.json({ error: 'Missing styleId' }, { status: 400 })
    }

    const result = await generateStyleLexicon({
      styleId,
      ageGroup: ageGroup || '3-6',
      theme: theme || '',
      language, // 可选：内容语言（缺省英语）
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('Style generation error:', err)
    return NextResponse.json({ error: 'Style generation failed' }, { status: 500 })
  }
}
