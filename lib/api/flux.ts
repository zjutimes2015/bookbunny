const OR_KEY = process.env.OPENROUTER_API_KEY
const OR_BASE = 'https://openrouter.ai/api/v1'

export async function generateImage(prompt: string, refImage?: string, options?: {
  seed?: number
  model?: string
  size?: string
}) {
  const model = options?.model || 'black-forest-labs/flux.2-flex'
  const size = options?.size || '1024x1024'

  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size,
  }

  // Attach reference image for character consistency
  if (refImage) {
    body.image = refImage
  }

  const res = await fetch(`${OR_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FLUX API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const imgData = data.data?.[0]

  if (imgData?.b64_json) {
    return { type: 'b64' as const, data: imgData.b64_json }
  }
  if (imgData?.url) {
    return { type: 'url' as const, data: imgData.url }
  }

  throw new Error('No image data returned')
}

export async function generateCharacterImage(description: string): Promise<{
  imageB64: string
  refSeed: number
}> {
  const seed = Math.floor(Math.random() * 999999)
  const prompt = `${description}, children's book illustration style, soft watercolor, warm colors, professional character design, full body, white background`

  const result = await generateImage(prompt, undefined, { seed })
  return {
    imageB64: result.data,
    refSeed: seed,
  }
}

export async function generateBookPage(
  pagePrompt: string,
  refImage: string,
  seed: number
) {
  const fullPrompt = `${pagePrompt}, children's book illustration, soft watercolor style, warm colors, storybook quality`
  return generateImage(fullPrompt, refImage, { seed })
}
