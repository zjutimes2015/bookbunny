/**
 * 配乐（背景音乐）模块 —— 运行时用 Web Audio API 合成，不依赖任何音频文件。
 *
 * 设计目标：
 * - 零资源：不下载、不打包任何 mp3/wav，避免版权与仓库膨胀。
 * - 纯程序化：每种 mood 是一段缓慢的和弦进行 + 低通滤波 + 轻微音量 LFO，
 *   听感是“会呼吸的氛围垫音”，适合在睡前故事背后长时间铺底。
 *
 * SSR 安全：模块作用域绝不触碰 AudioContext，只在 createAmbient/start 内按需创建。
 */

export interface MusicMood {
  id: string
  label: string
}

/** 可选的氛围配乐 mood（面向家长/老师，命名直白易懂） */
export const MUSIC_MOODS: MusicMood[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'playful', label: 'Playful' },
  { id: 'bedtime', label: 'Bedtime' },
  { id: 'adventure', label: 'Adventure' },
]

export interface AmbientController {
  /** 开始播放（必须由用户手势触发，满足浏览器自动播放策略） */
  start(): void
  /** 停止并拆除当前节点，但保留 AudioContext 以便再次 start */
  stop(): void
  /** 设置主音量（0–1） */
  setVolume(v: number): void
  /** 切换 mood，下一次换和弦时生效 */
  setMood(id: string): void
  /** 彻底销毁：清定时器、停振荡器、关闭 AudioContext */
  dispose(): void
}

/** 单个 mood 的合成配置 */
interface MoodConfig {
  /** 和弦进行，每个和弦是一组 MIDI 音高 */
  chords: number[][]
  /** 每个和弦持续多久（毫秒），决定换和弦节奏 */
  chordMs: number
  /** 淡入时长（毫秒） */
  attackMs: number
  /** 淡出时长（毫秒） */
  releaseMs: number
  /** 振荡器波形 */
  wave: OscillatorType
  /** 低通滤波截止频率（Hz） */
  cutoff: number
  /** 音量 LFO 频率（Hz），极低以产生“呼吸”感 */
  lfoRate: number
  /** 单和弦总体增益（进 master 之前） */
  gain: number
}

const MOOD_CONFIG: Record<string, MoodConfig> = {
  // 柔和的大七和弦，最百搭的白天氛围
  calm: {
    chords: [
      [60, 64, 67, 71], // Cmaj7
      [57, 60, 64, 67], // Am7
      [53, 57, 60, 64], // Fmaj7
      [55, 59, 62, 65], // G7
    ],
    chordMs: 9000,
    attackMs: 2500,
    releaseMs: 3500,
    wave: 'sine',
    cutoff: 1100,
    lfoRate: 0.08,
    gain: 0.5,
  },
  // 跳跃的三和弦，适合白天共读的轻快感（但仍不刺激）
  playful: {
    chords: [
      [60, 64, 67], // C
      [65, 69, 72], // F
      [67, 71, 74], // G
      [57, 60, 64], // Am
    ],
    chordMs: 5000,
    attackMs: 1500,
    releaseMs: 2200,
    wave: 'triangle',
    cutoff: 2200,
    lfoRate: 0.15,
    gain: 0.42,
  },
  // 极慢、极柔，哄睡用
  bedtime: {
    chords: [
      [57, 60, 64, 67], // Am7
      [53, 57, 60, 64], // Fmaj7
      [60, 64, 67, 71], // Cmaj7
      [55, 59, 62, 65], // G7
    ],
    chordMs: 11000,
    attackMs: 3500,
    releaseMs: 4500,
    wave: 'sine',
    cutoff: 800,
    lfoRate: 0.05,
    gain: 0.45,
  },
  // 明亮的 Lydian 色彩，有一点冒险感但不紧张
  adventure: {
    chords: [
      [60, 64, 67, 71], // Cmaj7
      [62, 66, 69, 74], // D (Lydian, 含 #F)
      [64, 68, 71, 76], // E
      [65, 69, 72, 77], // F
    ],
    chordMs: 6000,
    attackMs: 2200,
    releaseMs: 3000,
    wave: 'triangle',
    cutoff: 1700,
    lfoRate: 0.12,
    gain: 0.45,
  },
}

function resolveMood(id: string): MoodConfig {
  return MOOD_CONFIG[id] ?? MOOD_CONFIG.calm
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** MIDI 音高转频率 */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

type AudioContextCtor = new () => AudioContext

/** 拿到平台上的 AudioContext 构造器（含 Safari 的 webkit 前缀），无 any */
function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

interface ActiveVoice {
  osc: OscillatorNode
  gain: GainNode
}

/**
 * 创建一个氛围配乐控制器。
 * @param moodId 初始 mood（未知 id 回退到 calm）
 * @param volume 初始音量，默认 0.25（偏低，因为它在睡前故事背后播放）
 */
export function createAmbient(moodId: string, volume = 0.25): AmbientController {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let filter: BiquadFilterNode | null = null
  let lfo: OscillatorNode | null = null
  let lfoDepth: GainNode | null = null

  let chordTimer: ReturnType<typeof setTimeout> | null = null
  let teardownTimer: ReturnType<typeof setTimeout> | null = null

  let voices: ActiveVoice[] = []
  let chordIndex = 0

  let mood = resolveMood(moodId)
  let currentVolume = clamp(volume, 0, 1)
  let running = false

  /** 惰性创建 AudioContext；只在真正 start 时才会走到这里 */
  const ensureContext = (): AudioContext | null => {
    if (ctx) return ctx
    const Ctor = getAudioContextCtor()
    if (!Ctor) return null
    ctx = new Ctor()
    return ctx
  }

  /** 搭建主链路：masterGain → lowpass → destination，并挂上音量 LFO */
  const buildChain = () => {
    const c = ensureContext()
    if (!c || master) return

    filter = c.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = mood.cutoff

    master = c.createGain()
    master.gain.value = currentVolume
    master.connect(filter)
    filter.connect(c.destination)

    // 极低频 LFO 调制主音量，让垫音缓慢“呼吸”而非死板直线
    lfo = c.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = mood.lfoRate
    lfoDepth = c.createGain()
    lfoDepth.gain.value = 0.04
    lfo.connect(lfoDepth)
    lfoDepth.connect(master.gain)
    lfo.start()
  }

  /** 播放一个和弦：每个和声音各起一个振荡器 + 增益，做缓慢的交叉淡入淡出 */
  const playChord = () => {
    const c = ctx
    if (!c || !master) return

    const cfg = mood
    const chord = cfg.chords[chordIndex % cfg.chords.length]
    chordIndex += 1

    const t0 = c.currentTime + 0.05
    const attack = cfg.attackMs / 1000
    const hold = Math.max(0.8, (cfg.chordMs - cfg.attackMs) / 1000)
    const release = cfg.releaseMs / 1000
    const tonePeak = cfg.gain / Math.max(1, chord.length)

    for (const midi of chord) {
      const osc = c.createOscillator()
      osc.type = cfg.wave
      osc.frequency.value = midiToFreq(midi)

      const g = c.createGain()
      // 用极小值起止（而非 0）以避免线性斜坡端点产生的爆音
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(tonePeak, t0 + attack)
      g.gain.setValueAtTime(tonePeak, t0 + attack + hold)
      g.gain.linearRampToValueAtTime(0.0001, t0 + attack + hold + release)

      osc.connect(g)
      g.connect(master)
      osc.start(t0)
      // 必须显式 stop，绝不放任振荡器长期运行
      osc.stop(t0 + attack + hold + release + 0.1)

      const voice: ActiveVoice = { osc, gain: g }
      voices.push(voice)
      osc.onended = () => {
        try {
          g.disconnect()
        } catch {
          /* ignore */
        }
        voices = voices.filter(v => v !== voice)
      }
    }
  }

  /** 换和弦的前瞻循环：用 setTimeout 排下一次换和弦 */
  const tick = () => {
    if (!running) return
    playChord()
    chordTimer = setTimeout(tick, mood.chordMs)
  }

  /** 拆除所有链路节点（不关闭 context），供 stop / dispose 复用 */
  const teardownNodes = () => {
    teardownTimer = null

    for (const v of voices) {
      v.osc.onended = null
      try {
        v.osc.stop()
      } catch {
        /* ignore */
      }
      try {
        v.gain.disconnect()
      } catch {
        /* ignore */
      }
    }
    voices = []

    if (lfo) {
      try {
        lfo.stop()
      } catch {
        /* ignore */
      }
      try {
        lfo.disconnect()
      } catch {
        /* ignore */
      }
      lfo = null
    }
    if (lfoDepth) {
      try {
        lfoDepth.disconnect()
      } catch {
        /* ignore */
      }
      lfoDepth = null
    }
    if (master) {
      try {
        master.disconnect()
      } catch {
        /* ignore */
      }
      master = null
    }
    if (filter) {
      try {
        filter.disconnect()
      } catch {
        /* ignore */
      }
      filter = null
    }
  }

  const start = () => {
    if (running) return
    const c = ensureContext()
    if (!c) return

    // 若之前刚 stop、拆除尚未执行，取消它并复用现有链路
    if (teardownTimer !== null) {
      clearTimeout(teardownTimer)
      teardownTimer = null
    }

    buildChain()
    if (c.state === 'suspended') void c.resume()

    if (master) {
      const t = c.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(currentVolume, t)
    }

    running = true
    chordIndex = 0
    tick()
  }

  const stop = () => {
    running = false
    if (chordTimer !== null) {
      clearTimeout(chordTimer)
      chordTimer = null
    }

    const c = ctx
    if (c && master) {
      const t = c.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(currentVolume, t)
      master.gain.linearRampToValueAtTime(0, t + 0.3)
    }

    // 稍后拆除节点，让淡出听得到；期间若再次 start 会取消该拆除
    if (teardownTimer !== null) clearTimeout(teardownTimer)
    teardownTimer = setTimeout(teardownNodes, 350)
  }

  const setVolume = (v: number) => {
    currentVolume = clamp(v, 0, 1)
    const c = ctx
    if (!c || !master) return
    const t = c.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(currentVolume, t + 0.15)
  }

  const setMood = (id: string) => {
    mood = resolveMood(id)
    const c = ctx
    if (!c) return
    if (filter) {
      const t = c.currentTime
      filter.frequency.cancelScheduledValues(t)
      filter.frequency.setValueAtTime(filter.frequency.value, t)
      filter.frequency.linearRampToValueAtTime(mood.cutoff, t + 1.2)
    }
    if (lfo) {
      const t = c.currentTime
      lfo.frequency.cancelScheduledValues(t)
      lfo.frequency.setValueAtTime(lfo.frequency.value, t)
      lfo.frequency.linearRampToValueAtTime(mood.lfoRate, t + 1.2)
    }
    // chordMs / 和弦进行等在下一个换和弦节点自然生效
  }

  const dispose = () => {
    running = false
    if (chordTimer !== null) {
      clearTimeout(chordTimer)
      chordTimer = null
    }
    if (teardownTimer !== null) {
      clearTimeout(teardownTimer)
      teardownTimer = null
    }
    teardownNodes()

    const c = ctx
    ctx = null
    if (c) {
      void c.close().catch(() => {
        /* 关闭失败可忽略 */
      })
    }
  }

  return { start, stop, setVolume, setMood, dispose }
}
