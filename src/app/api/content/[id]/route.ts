import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContentSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir').optional(),
    slug: z.string().min(1, 'Slug gereklidir').optional(),
    content: z.string().min(1, 'İçerik gereklidir').optional(),
    excerpt: z.string().optional(),
    type: z.enum(['PAGE', 'BANNER', 'BLOG']).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    featuredImage: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const content = await prisma.content.findUnique({
            where: { id: resolvedParams.id }
        })

        if (!content) {
            return NextResponse.json({ error: 'İçerik bulunamadı' }, { status: 404 })
        }

        return NextResponse.json(content)
    } catch (error) {
        console.error('Error fetching content:', error)
        return NextResponse.json({ error: 'İçerik getirilirken bir hata oluştu' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const body = await request.json()
        const updateData = updateContentSchema.parse(body)

        // Slug benzersizlik kontrolü (eğer slug güncelleniyorsa)
        if (updateData.slug) {
            const existingContent = await prisma.content.findFirst({
                where: {
                    slug: updateData.slug,
                    id: { not: resolvedParams.id }
                }
            })

            if (existingContent) {
                return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 400 })
            }
        }

        const content = await prisma.content.update({
            where: { id: resolvedParams.id },
            data: {
                ...updateData,
                publishedAt: updateData.status === 'PUBLISHED' ? new Date() : undefined
            }
        })

        return NextResponse.json(content)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error updating content:', error)
        return NextResponse.json({ error: 'İçerik güncellenirken bir hata oluştu' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params

        await prisma.content.delete({
            where: { id: resolvedParams.id }
        })

        return NextResponse.json({ message: 'İçerik başarıyla silindi' })
    } catch (error) {
        console.error('Error deleting content:', error)
        return NextResponse.json({ error: 'İçerik silinirken bir hata oluştu' }, { status: 500 })
    }
} 