import { NextResponse } from 'next/server'
import { getObjectFile } from '@/lib/r2'

/**
 * R2 同源代理：浏览器展示与客户端 PDF 导出都走这里，避免 CDN 域名 CORS 配置问题。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params
  const key = (segments || []).join('/')
  if (!key) return new NextResponse('Not found', { status: 404 })

  const file = await getObjectFile(key)
  if (!file) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(Buffer.from(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
