import { describe, it, expect } from 'vitest'
import { deleteFiles, keyFromAssetUrl } from './r2'

describe('keyFromAssetUrl', () => {
  it('extracts the key from the same-origin asset proxy', () => {
    expect(keyFromAssetUrl('/api/assets/books/b1/page-001.png')).toBe('books/b1/page-001.png')
    expect(keyFromAssetUrl('https://sprouttales.com/api/assets/characters/c1/portrait.png')).toBe(
      'characters/c1/portrait.png',
    )
  })

  it('ignores URLs that are not ours', () => {
    expect(keyFromAssetUrl('https://external.example.com/image.png')).toBeNull()
    expect(keyFromAssetUrl('data:image/png;base64,AAAA')).toBeNull()
    expect(keyFromAssetUrl('')).toBeNull()
    expect(keyFromAssetUrl(null)).toBeNull()
    expect(keyFromAssetUrl(undefined)).toBeNull()
  })
})

describe('deleteFiles', () => {
  it('is a no-op when R2 is not configured', async () => {
    // 未配置 R2 时应返回 0，不抛错（隐私删除链路不能因为存储未配置而整体失败）
    await expect(deleteFiles(['books/b1/page-001.png'])).resolves.toBe(0)
  })

  it('handles an empty key list', async () => {
    await expect(deleteFiles([])).resolves.toBe(0)
  })
})
