import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.blogCategory.findMany({
            include: {
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Get blog categories error:', error)
        return NextResponse.json(
            { error: 'Blog kategorileri getirilirken bir hata oluştu' },
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

        // Blog kategorisi oluştur
        const category = await prisma.blogCategory.create({
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description,
                isActive: body.isActive ?? true
            }
        })

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        console.error('Create blog category error:', error)
        return NextResponse.json(
            { error: 'Blog kategorisi oluşturulurken bir hata oluştu' },
            { status: 500 }
        )
    }
}
