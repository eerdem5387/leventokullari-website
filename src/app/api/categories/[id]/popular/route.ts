import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const body = await request.json()
        const { isPopular } = body

        const category = await prisma.category.update({
            where: { id: resolvedParams.id },
            data: { isPopular }
        })

        return NextResponse.json({
            message: isPopular ? 'Kategori popüler olarak işaretlendi' : 'Kategori popüler olmaktan çıkarıldı',
            category
        })
    } catch (error) {
        console.error('Error updating category popular status:', error)
        return NextResponse.json({ error: 'Kategori güncellenirken bir hata oluştu' }, { status: 500 })
    }
} 