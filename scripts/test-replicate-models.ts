/**
 * Replicate 模型实测脚本（使用 SDK）
 *
 * 用法:
 *   REPLICATE_API_TOKEN=r8_xxx npx tsx scripts/test-replicate-models.ts
 */

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN

if (!REPLICATE_TOKEN) {
  console.error('❌ 请先设置环境变量 REPLICATE_API_TOKEN')
  process.exit(1)
}

async function main() {
  const { default: Replicate } = await import('replicate')
  const replicate = new Replicate({ auth: REPLICATE_TOKEN })

  function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  interface ModelTest {
    name: string
    modelId: string
    desc: string
    testInput: Record<string, unknown>
    pricing: string
  }

  const MODELS: ModelTest[] = [
    {
      name: 'Wan 3 (视频)',
      modelId: 'alibaba/wan-3',
      desc: 'text-to-video（跳过 image，因 Replicate 服务器无法访问外部图片 URL）',
      testInput: {
        prompt: 'A cute bunny hopping through a sunny meadow, children\'s book illustration style, soft watercolor, gentle animation',
        duration: 4,
        resolution: '480p',
        aspect_ratio: '4:3',
        enable_prompt_expansion: false,
      },
      pricing: '480p: $0.05/秒',
    },
    {
      name: 'Seedance 2.5 (视频备)',
      modelId: 'bytedance/seedance-2.5',
      desc: 'text-to-video（跳过 image）',
      testInput: {
        prompt: 'A cute bunny hopping through a sunny meadow, children\'s book illustration style, soft watercolor',
        duration: 4,
        resolution: '480p',
        aspect_ratio: '4:3',
        generate_audio: false,
      },
      pricing: 'non_video_in 480p: $0.10/秒',
    },
    {
      name: 'Inworld TTS 2 (配音)',
      modelId: 'inworld/realtime-tts-2',
      desc: '文字→配音',
      testInput: {
        text: 'Once upon a time, there was a little bunny who loved to hop.',
        voice_id: 'Dennis',
      },
      pricing: '$0.025/千字符',
    },
    {
      name: 'MiniMax Music 2.6 (配乐)',
      modelId: 'minimax/music-2.6',
      desc: '纯音乐配乐',
      testInput: {
        prompt: 'gentle lullaby for children, soft piano and strings, no vocals',
        is_instrumental: true,
        audio_format: 'mp3',
      },
      pricing: '$0.15/首',
    },
    {
      name: 'FLUX 3 Image (封面)',
      modelId: 'black-forest-labs/flux-3-image',
      desc: '封面生成',
      testInput: {
        prompt: "Children's book cover: a brave bunny holding a map, adventure theme, soft watercolor style, title space at top",
        images: [],
        resolution: '1k',
        aspect_ratio: '4:3',
      },
      pricing: '1k: $0.024/张',
    },
  ]

  async function testModel(m: ModelTest): Promise<{ status: string; error?: string; outputUrl?: string; durationMs?: number }> {
    const t0 = Date.now()
    try {
      console.log(`  🚀 发起预测...`)
      const prediction = await replicate.run(m.modelId, { input: m.testInput })

      let outputUrl: string | undefined
      if (prediction && typeof prediction === 'object') {
        const p = prediction as any
        if (typeof p.output === 'string') outputUrl = p.output
        else if (Array.isArray(p.output) && typeof p.output[0] === 'string') outputUrl = p.output[0]
        else if (p.url && typeof p.url === 'function') outputUrl = p.url()
        else if (typeof p === 'string') outputUrl = p
      }

      const durationMs = Date.now() - t0
      return { status: 'succeeded', outputUrl, durationMs }
    } catch (err: any) {
      const durationMs = Date.now() - t0
      const msg = err?.message || String(err)
      if (msg.includes('429') || msg.includes('throttl')) {
        return { status: 'rate_limited', error: msg, durationMs }
      }
      return { status: 'error', error: msg, durationMs }
    }
  }

  console.log(`\n🧪 Replicate 模型实测（SDK 版）— ${new Date().toISOString()}\n`)
  console.log(`Token: ${REPLICATE_TOKEN.slice(0, 8)}...${REPLICATE_TOKEN.slice(-4)}\n`)

  const results: { model: string; status: string; pricing: string; error?: string; outputUrl?: string; durationMs?: number }[] = []

  for (const m of MODELS) {
    console.log(`▶ ${m.name}`)
    const r = await testModel(m)
    r.model = m.name
    r.pricing = m.pricing
    results.push(r)

    const icon = r.status === 'succeeded' ? '✅' : r.status === 'rate_limited' ? '⏳' : '❌'
    console.log(`  ${icon} ${r.status} (${r.durationMs ?? '?'}ms)`)
    if (r.error) console.log(`     ⚠ ${r.error.slice(0, 200)}`)
    if (r.outputUrl) console.log(`     📎 ${r.outputUrl}`)
    console.log()

    if (r.status === 'rate_limited') {
      console.log('  ⏳ 限流中，等待 15s 后继续...\n')
      await sleep(15000)
    } else {
      await sleep(1000)
    }
  }

  // ─── 成本盒子 ────────────────────────────────────────────────────
  console.log('═'.repeat(70))
  console.log('📊 成本盒子（目标 $4–5/本，上限 $6）')
  console.log('═'.repeat(70))
  console.log('| 步骤              | 模型              | 定价               | 状态  |')
  console.log('|-------------------|-------------------|--------------------|-------|')
  for (const r of results) {
    const shortName = r.model.split(' (')[0]
    const statusIcon = r.status === 'succeeded' ? '✅' : r.status === 'rate_limited' ? '⏳' : '❌'
    const pricing = r.pricing.slice(0, 20)
    console.log(`| ${shortName.padEnd(19)} | ${(r.model.split('(')[0].trim()).padEnd(17)} | ${pricing.padEnd(18)} | ${statusIcon} |`)
  }
  console.log('═'.repeat(70))
  console.log('\n📋 结论:')
  const okModels = results.filter(r => r.status === 'succeeded').map(r => r.model)
  const failModels = results.filter(r => r.status !== 'succeeded' && r.status !== 'rate_limited').map(r => r.model)
  if (okModels.length > 0) console.log(`  ✅ 可用: ${okModels.join(', ')}`)
  if (failModels.length > 0) console.log(`  ❌ 失败: ${failModels.join(', ')}`)
  const rateLimited = results.filter(r => r.status === 'rate_limited')
  if (rateLimited.length > 0) console.log(`  ⏳ 限流（需充值至 $5+）: ${rateLimited.map(r => r.model).join(', ')}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
