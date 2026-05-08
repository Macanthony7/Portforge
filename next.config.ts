import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  // Puppeteer needs these excluded from serverless bundling
  serverExternalPackages: ['puppeteer-core'],
}

export default nextConfig
