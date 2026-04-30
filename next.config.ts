import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.guestvue.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        // Cloudflare R2 public bucket URLs (pub-<hash>.r2.dev)
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        // Custom R2 domain if configured
        protocol: 'https',
        hostname: 'media.theguestvue.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
}

export default nextConfig
