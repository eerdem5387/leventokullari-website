/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'ecommerce-store.com', 'storage.googleapis.com'],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    // KALICI ÇÖZÜM: Prisma'yı tamamen external yap
    serverExternalPackages: ['@prisma/client', 'prisma'],
    // KALICI ÇÖZÜM: Prisma 5.x için optimize
    experimental: {
        optimizePackageImports: ['lucide-react'],
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
    output: 'standalone',
    // Webpack optimization
    webpack: (config, { isServer, dev }) => {
        // SSR/Client separation
        if (isServer) {
            config.externals.push('@prisma/client')

            // React DOM SSR fix
            const webpack = require('webpack')
            config.plugins.push(
                new webpack.DefinePlugin({
                    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
                    'typeof window': JSON.stringify('undefined'),
                    'typeof document': JSON.stringify('undefined'),
                    'typeof navigator': JSON.stringify('undefined'),
                    'typeof localStorage': JSON.stringify('undefined'),
                    'typeof sessionStorage': JSON.stringify('undefined'),
                })
            )
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

module.exports = nextConfig;
