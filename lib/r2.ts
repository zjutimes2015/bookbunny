import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const ACCESS_KEY = process.env.R2_ACCESS_KEY || ''
const SECRET_KEY = process.env.R2_SECRET_KEY || ''
const BUCKET = process.env.R2_BUCKET || 'bookbunny'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

let client: S3Client | null = null

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
    })
  }
  return client
}

export function isR2Configured(): boolean {
  return !!(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY)
}

/**
 * Upload a file to R2. Returns a same-origin asset URL.
 * Callers must check isR2Configured() first — this throws rather than faking a URL.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured')
  }

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await getClient().send(cmd)

  // 同源代理地址：避免自定义域名未配置 CORS 时浏览器端取图失败
  return assetUrl(key)
}

/** 资源访问地址：优先 CDN 自定义域名，否则走同源代理路由 */
export function assetUrl(key: string): string {
  if (PUBLIC_URL) return `${PUBLIC_URL.replace(/\/+$/, '')}/${key}`
  return `/api/assets/${key}`
}

/** 读取对象（供 /api/assets 同源代理路由使用） */
export async function getObjectFile(
  key: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!isR2Configured()) return null

  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    const bytes = await res.Body?.transformToByteArray()
    if (!bytes) return null
    return {
      body: bytes,
      contentType: res.ContentType || 'application/octet-stream',
    }
  } catch {
    return null
  }
}

/** Upload a base64 image */
export async function uploadBase64Image(
  key: string,
  base64Data: string,
): Promise<string> {
  const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/)
  let contentType = 'image/png'
  let data = base64Data

  if (matches) {
    contentType = matches[1]
    data = matches[2]
  }

  const buffer = Buffer.from(data, 'base64')
  return uploadFile(key, buffer, contentType)
}

/** Generate a presigned URL for temporary access */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(getClient(), cmd, { expiresIn })
}

/** List files with a prefix */
export async function listFiles(prefix: string): Promise<string[]> {
  const cmd = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  })
  const result = await getClient().send(cmd)
  return (result.Contents || []).map((obj) => obj.Key || '').filter(Boolean)
}

/** Delete a file */
export async function deleteFile(key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  await getClient().send(cmd)
}

/**
 * 从资源地址反推 R2 key。
 * 支持两种形式：自定义 CDN 域名（R2_PUBLIC_URL）与同源代理 /api/assets/*。
 * 外部地址与 data URI 返回 null（不是我们存的对象）。
 */
export function keyFromAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const publicBase = PUBLIC_URL.replace(/\/+$/, '')
  if (publicBase && url.startsWith(`${publicBase}/`)) {
    return url.slice(publicBase.length + 1)
  }

  const proxy = '/api/assets/'
  const idx = url.indexOf(proxy)
  if (idx >= 0) return url.slice(idx + proxy.length)

  return null
}

/** 批量删除对象；单个失败不阻断整体（用于隐私删除链路） */
export async function deleteFiles(keys: string[]): Promise<number> {
  if (!isR2Configured()) return 0

  let deleted = 0
  for (const key of keys) {
    try {
      await deleteFile(key)
      deleted++
    } catch (err) {
      console.error(`R2 delete failed for ${key}:`, err)
    }
  }
  return deleted
}

/** Utility: generate a unique key for book assets */
export function bookKey(bookId: string, type: 'cover' | 'page' | 'pdf' | 'video', index?: number): string {
  const base = `books/${bookId}/${type}`
  return index !== undefined ? `${base}/${index.toString().padStart(3, '0')}.png` : `${base}.pdf`
}

/** Utility: generate a unique key for character assets */
export function characterKey(charId: string): string {
  return `characters/${charId}/portrait.png`
}
