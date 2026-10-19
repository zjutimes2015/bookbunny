/**
 * 配音（朗读）模块 —— 对浏览器内置 Web Speech API 的薄封装。
 *
 * 设计目标：所有朗读逻辑都收敛在本文件，未来若接入云端 TTS，
 * 只需替换本文件的实现，调用方（组件）无需改动。
 *
 * 全部导出均为 SSR 安全：在服务端或浏览器不支持时退化为空操作/空数组，绝不抛错。
 */

/** 供 UI 使用的精简语音信息（不暴露底层 SpeechSynthesisVoice 对象） */
export interface NarrationVoice {
  name: string
  lang: string
  local: boolean
}

export interface SpeakOptions {
  /** BCP-47 语言标签，如 'en-US' */
  lang: string
  /** 指定语音名称（listVoices 返回的 name）；不存在时回退到默认语音 */
  voiceName?: string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (event: SpeechSynthesisErrorEvent) => void
}

/** 当前正在朗读的 utterance。取消时先置空，以阻断任何滞后的 onend 回调 */
let currentUtterance: SpeechSynthesisUtterance | null = null

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  if (!('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

/** 浏览器是否支持语音朗读 */
export function speechSupported(): boolean {
  return getSynth() !== null && typeof window.SpeechSynthesisUtterance !== 'undefined'
}

function toVoice(v: SpeechSynthesisVoice): NarrationVoice {
  return { name: v.name, lang: v.lang, local: v.localService }
}

/** 当前浏览器可用的语音列表（可能为空，取决于系统已安装语音） */
export function listVoices(): NarrationVoice[] {
  const synth = getSynth()
  if (!synth) return []
  try {
    return synth.getVoices().map(toVoice)
  } catch {
    return []
  }
}

/**
 * 订阅语音列表变化。语音在部分浏览器中是异步加载的，
 * 这里先立即回调一次当前列表，再监听 voiceschanged 事件。
 * 返回取消订阅函数。
 */
export function subscribeVoices(cb: (voices: NarrationVoice[]) => void): () => void {
  const synth = getSynth()
  if (!synth) {
    cb([])
    return () => {}
  }

  const handler = () => cb(listVoices())
  handler()
  synth.addEventListener('voiceschanged', handler)
  return () => synth.removeEventListener('voiceschanged', handler)
}

/**
 * 朗读一段文本。若文本为空则直接触发 onEnd（保持顺序播放链不断）。
 */
export function speak(text: string, opts: SpeakOptions): void {
  const synth = getSynth()
  if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return

  const clean = text?.trim() ?? ''
  if (!clean) {
    opts.onEnd?.()
    return
  }

  // 清掉队列中的残余，避免多段叠加
  try {
    synth.cancel()
  } catch {
    /* ignore */
  }

  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = opts.lang
  if (typeof opts.rate === 'number') utterance.rate = opts.rate
  if (typeof opts.pitch === 'number') utterance.pitch = opts.pitch
  if (typeof opts.volume === 'number') utterance.volume = opts.volume

  if (opts.voiceName) {
    const match = synth.getVoices().find(v => v.name === opts.voiceName)
    if (match) utterance.voice = match
  }

  // 本段朗读成为“当前 utterance”
  currentUtterance = utterance

  utterance.onstart = () => {
    if (currentUtterance === utterance) opts.onStart?.()
  }
  utterance.onend = () => {
    // 若期间被 cancelSpeech 置空，说明这是过期回调，必须忽略，
    // 否则停止后的朗读会错误地推进到下一页。
    if (currentUtterance !== utterance) return
    currentUtterance = null
    opts.onEnd?.()
  }
  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    if (currentUtterance !== utterance) return
    currentUtterance = null
    opts.onError?.(event)
  }

  synth.speak(utterance)
}

/** 暂停当前朗读（可 resume 继续） */
export function pauseSpeech(): void {
  const synth = getSynth()
  if (!synth) return
  try {
    synth.pause()
  } catch {
    /* ignore */
  }
}

/** 继续被暂停的朗读 */
export function resumeSpeech(): void {
  const synth = getSynth()
  if (!synth) return
  try {
    synth.resume()
  } catch {
    /* ignore */
  }
}

/**
 * 停止朗读并清空待触发回调。
 * 关键：先把 currentUtterance 置空，再调用 cancel()，
 * 这样即便浏览器在 cancel 时派发 onend，也会被判定为过期而忽略。
 */
export function cancelSpeech(): void {
  const synth = getSynth()
  currentUtterance = null
  if (!synth) return
  try {
    synth.cancel()
  } catch {
    /* ignore */
  }
}
