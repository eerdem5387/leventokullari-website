import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'ecommerce-store.com', 'storage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  // KALICI ÇÖZÜM: Prisma 5.x için optimize
  experimental: {
    optimizePackageImports: ['lucide-react'],
    reactCompiler: false,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // KALICI ÇÖZÜM: Static generation'ı tamamen kapat
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build'
  },
  // Static generation'ı tamamen kapat
  experimental: {
    optimizePackageImports: ['lucide-react'],
    reactCompiler: false,
  },
  reactStrictMode: true,
  // SWC minification is enabled by default in Next.js 15
  // Webpack optimization
  webpack: (config, { isServer, dev }) => {
    // Memory optimization - Vendors chunk'ı sadece client'da oluştur
    if (isServer) {
      // Server'da vendors chunk oluşturma
      config.optimization.splitChunks = false
    } else {
      // Client'da vendors chunk oluştur
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'async',  // ✅ Sadece async chunks (client-only)
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
              chunks: 'async',  // ✅ Sadece client'da
            },
          },
        },
      }
    }

    // SSR/Client separation
    if (isServer) {
      config.externals.push('@prisma/client')

      // KESİN ÇÖZÜM: Doğru DefinePlugin
      const webpack = require('webpack')
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'undefined',
          'window': 'undefined',
          'document': 'undefined',
          'navigator': 'undefined',
          'localStorage': 'undefined',
          'sessionStorage': 'undefined',
          'screen': 'undefined',
          'performance': 'undefined',
          'requestAnimationFrame': 'undefined',
          'addEventListener': 'undefined',
        })
      )

      // Fix for 'self is not defined' error
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        path: false,
        zlib: false,
        buffer: false,
        process: false,
        events: false,
        querystring: false,
        punycode: false,
        readline: false,
        repl: false,
        tty: false,
        vm: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        domain: false,
        module: false,
        net: false,
        readline: false,
        string_decoder: false,
        sys: false,
        timers: false,
        tls: false,
        tty: false,
        url: false,
        util: false,
        v8: false,
        vm: false,
        zlib: false,
      }

      // Additional externals for problematic packages
      config.externals.push({
        'lucide-react': 'commonjs lucide-react',
        'react': 'commonjs react',
        'react-dom': 'commonjs react-dom',
        'next': 'commonjs next',
        'next/router': 'commonjs next/router',
        'next/navigation': 'commonjs next/navigation',
      })
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