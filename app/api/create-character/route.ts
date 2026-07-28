import { NextRequest, NextResponse } from 'next/server'
import { generateCharacterImage } from '@/lib/api/flux'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const photo = formData.get('photo') as File
    const name = formData.get('name') as string || 'Hero'

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    // Convert photo to base64
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${photo.type};base64,${base64}`

    // Generate character using FLUX with the photo as reference
    const desc = `A cute ${name} character, big friendly eyes, warm smile, storybook style`
    const result = await generateCharacterImage(desc)

    return NextResponse.json({
      name,
      imageB64: result.imageB64,
      refSeed: result.refSeed,
    })
  } catch (err) {
    console.error('Character creation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
