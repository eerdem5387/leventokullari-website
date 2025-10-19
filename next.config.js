/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'ecommerce-store.com', 'storage.googleapis.com'],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
    trailingSlash: false,
    // swcMinify: true, // Next.js 15'te deprecated
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
    },
    // Webpack optimization
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push('@prisma/client')
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