import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

// jsdom 不实现 SpeechSynthesis；用 vi.fn 覆盖，供 create 页的朗读逻辑测试断言
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [],
    paused: false,
    pending: false,
    speaking: false,
  },
  configurable: true,
  writable: true,
})

;(window as any).SpeechSynthesisUtterance = class {
  rate = 1
  pitch = 1
  lang = ''
  voice: any = null
  onend: ((ev: any) => void) | null = null
  constructor(public text: string) {}
}

beforeEach(() => {
  ;(window.speechSynthesis.speak as any).mockClear?.()
  ;(window.speechSynthesis.cancel as any).mockClear?.()
})
