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
    reactStrictMode: true, // Next.js 15 için true yapıldı
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    trailingSlash: false,
    // output: 'standalone', // Next.js 15 bug'ı nedeniyle geçici olarak devre dışı
    // Next.js 15 uyumluluğu için
    serverExternalPackages: ['@prisma/client'],
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000', '*.vercel.app']
        }
    },
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
    async redirects() {
        return [
            { source: '/cart', destination: '/products', permanent: true },
            // allow checkout/payment flow to function
            // { source: '/checkout', destination: '/products', permanent: true },
            // { source: '/orders', destination: '/products', permanent: true },
            // { source: '/orders/:path*', destination: '/products', permanent: true },
            { source: '/categories', destination: '/products', permanent: true },
            { source: '/categories/:path*', destination: '/products', permanent: true },
            { source: '/blog', destination: '/products', permanent: true },
            { source: '/blog/:path*', destination: '/products', permanent: true },
            // allow auth and payment pages to function for bank review
            // { source: '/register', destination: '/products', permanent: true },
            // { source: '/login', destination: '/products', permanent: true },
            // { source: '/profile', destination: '/products', permanent: true },
            // { source: '/payment/:path*', destination: '/products', permanent: false },
            { source: '/help', destination: '/contact', permanent: true },
            { source: '/shipping', destination: '/contact', permanent: true },
            { source: '/returns', destination: '/contact', permanent: true },
            { source: '/privacy', destination: '/contact', permanent: true },
        ]
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