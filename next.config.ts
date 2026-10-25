import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ffmpeg-static 通过 __dirname 定位二进制，被打包后路径会指到 .next 内部，
  // 必须保持为外部依赖，并在产物里显式带上二进制文件。
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/animate-pro': ['./node_modules/ffmpeg-static/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
