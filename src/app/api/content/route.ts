import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContentSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir'),
    slug: z.string().min(1, 'Slug gereklidir'),
    content: z.string().min(1, 'İçerik gereklidir'),
    excerpt: z.string().optional(),
    type: z.enum(['PAGE', 'BANNER', 'BLOG']),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    featuredImage: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional()
})

export async function GET() {
    try {
        const contents = await prisma.content.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(contents)
    } catch (error) {
        console.error('Error fetching contents:', error)
        return NextResponse.json(
            { error: 'İçerikler getirilemedi' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createContentSchema.parse(body)

        // Slug benzersizlik kontrolü
        const existingContent = await prisma.content.findUnique({
            where: { slug: validatedData.slug }
        })

        if (existingContent) {
            return NextResponse.json(
                { error: 'Bu slug zaten kullanılıyor' },
                { status: 400 }
            )
        }

        const content = await prisma.content.create({
            data: {
                ...validatedData,
                publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
            }
        })

        return NextResponse.json(content, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating content:', error)
        return NextResponse.json(
            { error: 'İçerik oluşturulamadı' },
            { status: 500 }
        )
    }
} 