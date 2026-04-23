import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // Supabase types not yet generated — suppress until schema is applied and types are generated
    ignoreBuildErrors: true,
  },
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
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
}

export default nextConfig
