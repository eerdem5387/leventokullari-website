import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'ecommerce-store.com', 'storage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Build optimization
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Build optimization
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build'
  },
  // Memory optimization
  swcMinify: true,
  // Webpack optimization
  webpack: (config, { isServer, dev }) => {
    // Memory optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      },
    }

    // Prisma client optimization
    if (isServer) {
      config.externals.push('@prisma/client')
    }

    // Build performance
    if (!dev) {
      config.optimization.minimize = true
    }

    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;"
          }
        ]
      }
    ]
  }
};

export default nextConfig;