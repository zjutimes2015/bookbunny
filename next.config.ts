import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Tightened from the previous allow-any-host (`**`) rule: nothing in the
    // codebase renders remote images through next/image today (book art is
    // served as CSS backgrounds from the R2 public URL configured at runtime).
    // When next/image is adopted for remote book art, add that exact host here.
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // recharts is pulled in as a barrel import by the admin analytics page;
    // rewriting it to per-module imports keeps it out of shared chunks.
    optimizePackageImports: ['recharts'],
  },
}

export default nextConfig
