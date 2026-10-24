import { describe, it, expect } from 'vitest'
import { computeKdpChecks } from './KdpChecklist'
import { MIN_PAGES, MIN_SPINE_TEXT_IN, SPINE_PER_PAGE_IN } from '@/lib/kdp/spec'

describe('computeKdpChecks', () => {
  const baseProps = {
    trimKey: '8.5x8.5',
    pageCount: 30,
    paper: 'white' as const,
    title: 'Luna and the Dragon Garden',
    isbns: '978-1234567890',
    hasCopyrightPage: true,
  }

  describe('return shape', () => {
    it('always returns exactly 5 checks', () => {
      const items = computeKdpChecks(baseProps)
      expect(items).toHaveLength(5)
      expect(items.map(i => i.key)).toEqual(['pages', 'spine', 'seo-title', 'isbn', 'copyright'])
    })

    it('each item has required fields', () => {
      const items = computeKdpChecks(baseProps)
      for (const item of items) {
        expect(item).toHaveProperty('key')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('status')
        expect(item).toHaveProperty('detail')
        expect(['pass', 'warn', 'fail']).toContain(item.status)
      }
    })
  })

  describe('pages check', () => {
    it('passes when pageCount >= MIN_PAGES after padding', () => {
      const items = computeKdpChecks({ ...baseProps, pageCount: 30 })
      const pages = items.find(i => i.key === 'pages')!
      expect(pages.status).toBe('pass')
      expect(pages.detail).toContain('padded to')
    })

    it('always passes because padToKdpPageCount floors at MIN_PAGES', () => {
      // Even a tiny page count gets padded up to MIN_PAGES by the PDF generator,
      // so the check never fails — it only reports the padded count.
      const items = computeKdpChecks({ ...baseProps, pageCount: 8 })
      const pages = items.find(i => i.key === 'pages')!
      expect(pages.status).toBe('pass')
      expect(pages.detail).toContain('padded to 24')
    })

    it('reports padded count for zero pages', () => {
      const items = computeKdpChecks({ ...baseProps, pageCount: 0 })
      const pages = items.find(i => i.key === 'pages')!
      expect(pages.status).toBe('pass')
      expect(pages.detail).toContain('padded to')
    })

    it('passes at exactly MIN_PAGES', () => {
      const items = computeKdpChecks({ ...baseProps, pageCount: MIN_PAGES })
      const pages = items.find(i => i.key === 'pages')!
      expect(pages.status).toBe('pass')
    })

    it('pads odd page counts to even', () => {
      // 25 pages -> padded to 26
      const items = computeKdpChecks({ ...baseProps, pageCount: 25 })
      const pages = items.find(i => i.key === 'pages')!
      expect(pages.detail).toContain('padded to 26')
    })
  })

  describe('spine check', () => {
    it('warns when spine is too narrow for text', () => {
      // 24 pages * 0.002252 = 0.054 in < 0.25
      const items = computeKdpChecks({ ...baseProps, pageCount: MIN_PAGES })
      const spine = items.find(i => i.key === 'spine')!
      expect(spine.status).toBe('warn')
      expect(spine.actionable).toBeDefined()
    })

    it('passes when spine is wide enough for text', () => {
      // Need pages >= ceil(0.25 / 0.002252) = 111 pages
      const wideEnough = Math.ceil(MIN_SPINE_TEXT_IN / SPINE_PER_PAGE_IN.white)
      const items = computeKdpChecks({ ...baseProps, pageCount: wideEnough })
      const spine = items.find(i => i.key === 'spine')!
      expect(spine.status).toBe('pass')
      expect(spine.detail).toContain('safe to print')
    })

    it('cream paper produces a wider spine than white at same page count', () => {
      const white = computeKdpChecks({ ...baseProps, pageCount: 100, paper: 'white' })
      const cream = computeKdpChecks({ ...baseProps, pageCount: 100, paper: 'cream' })
      const whiteSpine = white.find(i => i.key === 'spine')!
      const creamSpine = cream.find(i => i.key === 'spine')!
      // Both may warn, but cream spine width in detail should be larger
      const extractSpine = (detail: string) => parseFloat(detail.match(/Spine ([\d.]+) in/)?.[1] || '0')
      expect(extractSpine(creamSpine.detail)).toBeGreaterThan(extractSpine(whiteSpine.detail))
    })
  })

  describe('seo-title check', () => {
    it('passes when title is >= 5 chars', () => {
      const items = computeKdpChecks({ ...baseProps, title: 'Lunar' })
      const seo = items.find(i => i.key === 'seo-title')!
      expect(seo.status).toBe('pass')
    })

    it('warns when title is shorter than 5 chars', () => {
      const items = computeKdpChecks({ ...baseProps, title: 'Luna' })
      const seo = items.find(i => i.key === 'seo-title')!
      expect(seo.status).toBe('warn')
      expect(seo.actionable).toBeDefined()
    })

    it('warns when title is empty', () => {
      const items = computeKdpChecks({ ...baseProps, title: '' })
      const seo = items.find(i => i.key === 'seo-title')!
      expect(seo.status).toBe('warn')
    })

    it('warns when title is only whitespace', () => {
      const items = computeKdpChecks({ ...baseProps, title: '   ' })
      const seo = items.find(i => i.key === 'seo-title')!
      expect(seo.status).toBe('warn')
    })
  })

  describe('isbn check', () => {
    it('passes when isbns is provided', () => {
      const items = computeKdpChecks({ ...baseProps, isbns: '978-1234567890' })
      const isbn = items.find(i => i.key === 'isbn')!
      expect(isbn.status).toBe('pass')
      expect(isbn.detail).toContain('978-1234567890')
    })

    it('warns when isbns is undefined', () => {
      const items = computeKdpChecks({ ...baseProps, isbns: undefined })
      const isbn = items.find(i => i.key === 'isbn')!
      expect(isbn.status).toBe('warn')
    })

    it('warns when isbns is empty string', () => {
      const items = computeKdpChecks({ ...baseProps, isbns: '' })
      const isbn = items.find(i => i.key === 'isbn')!
      expect(isbn.status).toBe('warn')
    })
  })

  describe('copyright check', () => {
    it('passes when hasCopyrightPage is true', () => {
      const items = computeKdpChecks({ ...baseProps, hasCopyrightPage: true })
      const cp = items.find(i => i.key === 'copyright')!
      expect(cp.status).toBe('pass')
    })

    it('warns when hasCopyrightPage is false', () => {
      const items = computeKdpChecks({ ...baseProps, hasCopyrightPage: false })
      const cp = items.find(i => i.key === 'copyright')!
      expect(cp.status).toBe('warn')
      expect(cp.actionable).toBeDefined()
    })

    it('warns when hasCopyrightPage is undefined', () => {
      const items = computeKdpChecks({ ...baseProps, hasCopyrightPage: undefined })
      const cp = items.find(i => i.key === 'copyright')!
      expect(cp.status).toBe('warn')
    })
  })

  describe('actionable field', () => {
    it('omits actionable when status is pass', () => {
      // Build a scenario where all checks pass
      const wideEnough = Math.ceil(MIN_SPINE_TEXT_IN / SPINE_PER_PAGE_IN.white)
      const items = computeKdpChecks({
        ...baseProps,
        pageCount: wideEnough,
        title: 'Luna and the Dragon Garden',
        isbns: '978-1234567890',
        hasCopyrightPage: true,
      })
      for (const item of items) {
        if (item.status === 'pass') {
          expect(item.actionable).toBeUndefined()
        }
      }
    })

    it('includes actionable when status is fail or warn', () => {
      const items = computeKdpChecks({
        ...baseProps,
        pageCount: 5,
        title: '',
        isbns: undefined,
        hasCopyrightPage: false,
      })
      for (const item of items) {
        if (item.status === 'fail' || item.status === 'warn') {
          expect(item.actionable).toBeDefined()
          expect(item.actionable!.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('default values', () => {
    it('uses white paper by default', () => {
      const items = computeKdpChecks({ trimKey: '8.5x8.5', pageCount: 30 })
      const spine = items.find(i => i.key === 'spine')!
      // 30 * 0.002252 = 0.06756
      expect(spine.detail).toContain('0.068')
    })

    it('uses empty string title by default', () => {
      const items = computeKdpChecks({ trimKey: '8.5x8.5', pageCount: 30 })
      const seo = items.find(i => i.key === 'seo-title')!
      expect(seo.status).toBe('warn')
    })
  })
})
