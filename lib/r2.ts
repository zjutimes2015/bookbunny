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

/** Upload a file to R2. Returns the public URL or CDN URL */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
): Promise<string> {
  if (!isR2Configured()) {
    console.log(`[R2 DEV] Skipping upload: ${key} (${contentType}, ${body.length} bytes)`)
    return `/api/file/${key}` // Dev fallback
  }

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await getClient().send(cmd)

  // Return CDN URL if configured, otherwise R2.dev URL
  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`
  }
  return `https://${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
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

/** Utility: generate a unique key for book assets */
export function bookKey(bookId: string, type: 'cover' | 'page' | 'pdf' | 'video', index?: number): string {
  const base = `books/${bookId}/${type}`
  return index !== undefined ? `${base}/${index.toString().padStart(3, '0')}.png` : `${base}.pdf`
}

/** Utility: generate a unique key for character assets */
export function characterKey(charId: string): string {
  return `characters/${charId}/portrait.png`
}
