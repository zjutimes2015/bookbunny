/**
 * 角色音色表
 *
 * Inworld Realtime TTS 2 的音色 ID 需要在实测后填入。
 * 当前用字符串占位，实测时逐个验证哪些 voice ID 稳定可用。
 */

export interface VoiceSlot {
  /** 音色 ID（Inworld voice ID，待实测后填） */
  voiceId: string
  /** 音色描述（给开发者看） */
  description: string
}

export interface CharacterVoice {
  /** 角色名（故事大纲里的角色） */
  characterName: string
  /** 该角色的固定音色槽 */
  voice: VoiceSlot
  /** 语速（默认 0.85，适合低龄） */
  defaultRate?: number
}

/**
 * 旁白固定音色
 */
export const NARRATOR_VOICE: VoiceSlot = {
  voiceId: '', // TODO: 实测后填入 Inworld voice ID
  description: 'Gentle storyteller voice, warm and calm, suitable for children',
}

/**
 * 默认角色音色表（英文环境）
 * 实测后替换 voiceId
 */
export const DEFAULT_CHARACTER_VOICES: CharacterVoice[] = [
  {
    characterName: 'narrator',
    voice: NARRATOR_VOICE,
    defaultRate: 0.85,
  },
  {
    characterName: 'default',
    voice: { voiceId: '', description: 'Default child-friendly voice' },
    defaultRate: 0.9,
  },
]

/**
 * 获取角色音色（按角色名查找）
 * 找不到时返回默认音色
 */
export function getCharacterVoice(characterName: string): VoiceSlot {
  const found = DEFAULT_CHARACTER_VOICES.find(v => v.characterName === characterName)
  return found?.voice ?? DEFAULT_CHARACTER_VOICES[DEFAULT_CHARACTER_VOICES.length - 1].voice
}
