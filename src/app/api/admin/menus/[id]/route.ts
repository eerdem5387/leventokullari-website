import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const menuId = resolvedParams.id

        const menu = await prisma.menu.findUnique({
            where: { id: menuId },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!menu) {
            return NextResponse.json(
                { error: 'Menü bulunamadı' },
                { status: 404 }
            )
        }

        return NextResponse.json(menu)
    } catch (error) {
        console.error('Get menu error:', error)
        return NextResponse.json(
            { error: 'Menü getirilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const menuId = resolvedParams.id
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

        const updatedMenu = await prisma.menu.update({
            where: { id: menuId },
            data: {
                name: body.name,
                location: body.location,
                isActive: body.isActive
            },
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        return NextResponse.json(updatedMenu)
    } catch (error) {
        console.error('Update menu error:', error)
        return NextResponse.json(
            { error: 'Menü güncellenirken bir hata oluştu' },
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
        const menuId = resolvedParams.id

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

        // Menüyü ve tüm öğelerini sil
        await prisma.menuItem.deleteMany({
            where: { menuId }
        })

        await prisma.menu.delete({
            where: { id: menuId }
        })

        return NextResponse.json(
            { message: 'Menü başarıyla silindi' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete menu error:', error)
        return NextResponse.json(
            { error: 'Menü silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
