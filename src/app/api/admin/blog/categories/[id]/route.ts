import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const categoryId = resolvedParams.id
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

        // Blog kategorisini güncelle
        const updatedCategory = await prisma.blogCategory.update({
            where: { id: categoryId },
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description,
                isActive: body.isActive
            }
        })

        return NextResponse.json(updatedCategory)
    } catch (error) {
        console.error('Update blog category error:', error)
        return NextResponse.json(
            { error: 'Blog kategorisi güncellenirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const categoryId = resolvedParams.id

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

        // Blog kategorisini sil
        await prisma.blogCategory.delete({
            where: { id: categoryId }
        })

        return NextResponse.json(
            { message: 'Blog kategorisi başarıyla silindi' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete blog category error:', error)
        return NextResponse.json(
            { error: 'Blog kategorisi silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
