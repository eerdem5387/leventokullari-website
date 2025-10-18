import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const tagId = resolvedParams.id
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

        // Blog etiketini güncelle
        const updatedTag = await prisma.blogTag.update({
            where: { id: tagId },
            data: {
                name: body.name,
                slug: body.slug
            }
        })

        return NextResponse.json(updatedTag)
    } catch (error) {
        console.error('Update blog tag error:', error)
        return NextResponse.json(
            { error: 'Blog etiketi güncellenirken bir hata oluştu' },
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
        const tagId = resolvedParams.id

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

        // Blog etiketini sil
        await prisma.blogTag.delete({
            where: { id: tagId }
        })

        return NextResponse.json(
            { message: 'Blog etiketi başarıyla silindi' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete blog tag error:', error)
        return NextResponse.json(
            { error: 'Blog etiketi silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
