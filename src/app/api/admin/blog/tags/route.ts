import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const tags = await prisma.blogTag.findMany({
            include: {
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(tags)
    } catch (error) {
        console.error('Get blog tags error:', error)
        return NextResponse.json(
            { error: 'Blog etiketleri getirilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Yetkilendirme kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        // Blog etiketi oluştur
        const tag = await prisma.blogTag.create({
            data: {
                name: body.name,
                slug: body.slug
            }
        })

        return NextResponse.json(tag, { status: 201 })
    } catch (error) {
        console.error('Create blog tag error:', error)
        return NextResponse.json(
            { error: 'Blog etiketi oluşturulurken bir hata oluştu' },
            { status: 500 }
        )
    }
}
