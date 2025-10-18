import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    if (!pathname.startsWith('/admin')) return NextResponse.next()

    const auth = req.headers.get('authorization')
    const expectedUser = process.env.ADMIN_USER || 'admin'
    const expectedPass = process.env.ADMIN_PASS || 'password'

    if (!auth?.startsWith('Basic ')) {
        return new NextResponse('Authentication required', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
        })
    }

    const [, base64] = auth.split(' ')
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
    if (user !== expectedUser || pass !== expectedPass) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Security headers
    const response = NextResponse.next()

    // Basic security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    )

    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; ')
    )

    // Rate limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

        // Simple rate limiting (in production, use Redis or similar)
        const maxRequests = 100 // max 100 requests per window

        // This is a simplified version - in production use proper rate limiting
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', '99') // Simplified
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
} 