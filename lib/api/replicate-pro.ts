/**
 * Replicate Pro API 统一网关
 *
 * 6 个模型封装，统一错误处理、fallback 链、成本追踪。
 * 所有外部调用走 Replicate Predictions API，结果中转存 R2。
 *
 * 使用方式：
 *   import { animatePage, generateTTS, generateMusic, transcribe, upscale, generateCover } from '@/lib/api/replicate-pro'
 */

import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })

// ─── 类型定义 ────────────────────────────────────────────────────────

export interface ReplicateResult {
  /** 是否成功 */
  ok: boolean
  /** 成功时的 URL（视频/mp4、音频/mp3、图片/png） */
  url?: string
  /** 失败原因 */
  error?: string
  /** 预估成本（来自 Replicate response headers 或 docs，格式如 "$0.02"） */
  estimatedCost?: string
  /** 实际耗时（ms） */
  durationMs?: number
  /** 使用的模型版本 */
  version?: string
}

// ─── 模型清单
//
// 只写 owner/name，不带 `:latest` 或 version hash。
// SDK 在传入 model（而非 version）时请求 /models/{model}/predictions，
// 任何后缀都会被当成模型名的一部分，导致 404。
// 走 model 路径时 Replicate 会自动使用该模型的 latest version。

const VERSIONS = {
  // 动画：Wan 3（Seedance 2.5 已移除：480p $0.1028/秒 是 Wan 3 的 4 倍，击穿毛利）
  wan3: 'alibaba/wan-3',
  // 配音
  realtimeTts2: 'inworld/realtime-tts-2',
  // 配乐
  minimaxMusic: 'minimax/music-2.6',
  // 跟读（Whisper large-v3）
  whisper: 'openai/whisper',
  // 封面（多参考图 FLUX 3）
  flux3: 'black-forest-labs/flux-3-image',
} as const

// ─── 工具函数 ─────────────────────────────────────────────────────────

/** 等待 Replicate 预测完成（轮询，最长 120 秒） */
async function pollPrediction(
  replica: Replicate,
  predictionId: string,
  timeoutMs = 120_000,
): Promise<{ status: string; output?: unknown; error?: string }> {
  const deadline = Date.now() + timeoutMs
  let status = 'pending'

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000))
    const pred = await replica.predictions.get(predictionId) as {
      status: string
      output?: unknown
      error?: string
    }
    status = pred.status
    if (['succeeded', 'failed', 'canceled'].includes(status)) {
      return pred
    }
  }
  return { status: 'timeout', error: 'Prediction timed out after 120s' }
}

/**
 * 调用单个 Replicate 模型，返回结果
 *
 * 低余额账户的创建频率被限到 6 次/分钟（突发 1），一本 8 页的书必然撞上 429。
 * 限流是秒级恢复的，所以这里按退避重试，而不是直接判失败。
 */
const RATE_LIMIT_RETRIES = 2

function isRateLimited(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('429') || m.includes('throttled') || m.includes('rate limit')
}

async function callReplicateOnce(
  replica: Replicate,
  model: string,
  input: Record<string, unknown>,
  timeoutMs: number,
): Promise<ReplicateResult & { version: string }> {
  const t0 = Date.now()
  try {
    const prediction = await replica.predictions.create({
      model,
      input,
    })

    const result = await pollPrediction(replica, prediction.id, timeoutMs)
    const durationMs = Date.now() - t0

    if (result.status === 'succeeded' && result.output) {
      const url = Array.isArray(result.output)
        ? (result.output as string[])[0]
        : typeof result.output === 'string'
          ? result.output
          : undefined
      return { ok: true, url, durationMs, version: model.split(':')[0] }
    }

    return {
      ok: false,
      error: result.error ?? `Prediction ended as ${result.status}`,
      durationMs,
      version: model.split(':')[0],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg, durationMs: Date.now() - t0, version: model.split(':')[0] }
  }
}

async function callReplicate(
  replica: Replicate,
  model: string,
  input: Record<string, unknown>,
  timeoutMs = 120_000,
): Promise<ReplicateResult & { version: string }> {
  let result = await callReplicateOnce(replica, model, input, timeoutMs)

  for (let attempt = 0; attempt < RATE_LIMIT_RETRIES; attempt++) {
    if (result.ok || !isRateLimited(result.error ?? '')) break
    await new Promise((r) => setTimeout(r, 6000 * (attempt + 1)))
    result = await callReplicateOnce(replica, model, input, timeoutMs)
  }

  return result
}

// ─── 6 个模型封装 ────────────────────────────────────────────────────

/**
 * FR1: 每页插画 → 动画片段（5–8 秒 / 页，1080p 或降档 480p）
 * 注意：不使用 Seedance 2.5 fallback —— 其 480p 成本是 Wan 3 的 4 倍
 * （$0.1028/秒 vs $0.025/秒），会自动击穿 Pro 动画毛利假设。
 * Wan 3 失败时返回 { ok: false }，调用方自行决定重试或标记 pending。
 */
export async function animatePage(
  imageUrl: string,
  prompt: string,
  options?: { duration?: number; resolution?: '480p' | '720p' | '1080p'; aspect_ratio?: string },
): Promise<ReplicateResult & { version: string }> {
  const { duration = 5, resolution = '480p', aspect_ratio = 'adaptive' } = options ?? {}
  // Wan 3 minimum duration is 4 seconds
  const effectiveDuration = Math.max(duration, 4)
  const input = {
    image: imageUrl,
    prompt: `${prompt}, children's book illustration style, soft watercolor, gentle animation, warm colors, no text, no letters`,
    duration: effectiveDuration,
    resolution,
    aspect_ratio,
    enable_prompt_expansion: false,
  }
  return callReplicate(replicate, VERSIONS.wan3, input)
}

/**
 * FR2: 文字 → 配音音频（多角色音色固定）
 * 备注：Inworld TTS 音色槽需实测后填入 voice_id，当前用默认音色
 */
export async function generateTTS(
  text: string,
  options?: { voice?: string; speed?: number; language?: string },
): Promise<ReplicateResult & { version: string }> {
  const { voice = 'Dennis', speed = 1.0, language = 'en-US' } = options ?? {}
  const input = {
    text,
    voice_id: voice,
  }
  return callReplicate(replicate, VERSIONS.realtimeTts2, input)
}

/**
 * FR3: 故事配乐（纯音乐、慢速、轻柔）
 * 生成 1 轨 / 本；音乐模型比动画慢，给 180s 轮询窗口
 */
export async function generateMusic(prompt: string): Promise<ReplicateResult & { version: string }> {
  const input = {
    prompt: `${prompt}, gentle ambient music for children's book, soft piano and strings, no vocals, no lyrics, looping-friendly`,
    is_instrumental: true,
    audio_format: 'mp3',
  }
  return callReplicate(replicate, VERSIONS.minimaxMusic, input, 180_000)
}

/**
 * FR4: 音频 → 词级时间戳（Whisper large-v3）
 * 用于跟读高亮；对齐失败时回退句级
 */
export async function transcribe(audioUrl: string): Promise<ReplicateResult & { version: string }> {
  const input = { audio: audioUrl }
  return callReplicate(replicate, VERSIONS.whisper, input)
}

/**
 * FR5: 印刷图片直接使用原图（R2 未配置时回退到原图，已够用）
 * 若未来需要上采样，可接入其他方案（如 ESRGAN self-hosted）
 */
export async function upscaleImage(imageUrl: string, _scale: 2 | 4 = 2): Promise<ReplicateResult & { version: string }> {
  // 暂不调用外部 API，直接返回原图 URL
  return { ok: true, url: imageUrl, durationMs: 0, version: 'none', estimatedCost: '$0.00' }
}

/**
 * FR6: 封面生成（多参考图保角色一致）
 * 输入：定妆照 + 2–3 页内页参考
 */
export async function generateCover(
  prompt: string,
  referenceImages: string[],
): Promise<ReplicateResult & { version: string }> {
  const input = {
    prompt: `${prompt}, children's book cover illustration, soft watercolor style, warm colors, title space at top, professional book cover design`,
    images: referenceImages.slice(0, 10), // 最多 10 张
    resolution: '1k',
    aspect_ratio: '4:3',
  }
  return callReplicate(replicate, VERSIONS.flux3, input)
}

// ─── 导出 ────────────────────────────────────────────────────────────
export { VERSIONS }
