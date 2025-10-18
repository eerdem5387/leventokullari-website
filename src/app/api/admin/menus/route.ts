import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createMenuSchema = z.object({
    name: z.string().min(1, 'Menü adı gereklidir'),
    location: z.string().min(1, 'Konum gereklidir'),
    isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decodedToken = verifyToken(token)
        if (!decodedToken || decodedToken.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const menus = await prisma.menu.findMany({
            include: {
                items: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(menus)
    } catch (error) {
        console.error('Error fetching menus:', error)
        return NextResponse.json(
            { error: 'Menüler getirilemedi' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decodedToken = verifyToken(token)
        if (!decodedToken || decodedToken.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validatedData = createMenuSchema.parse(body)

        // Konum benzersizlik kontrolü
        const existingMenu = await prisma.menu.findUnique({
            where: { location: validatedData.location }
        })

        if (existingMenu) {
            return NextResponse.json(
                { error: 'Bu konumda zaten bir menü var' },
                { status: 400 }
            )
        }

        const menu = await prisma.menu.create({
            data: validatedData
        })

        return NextResponse.json(menu, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating menu:', error)
        return NextResponse.json(
            { error: 'Menü oluşturulamadı' },
            { status: 500 }
        )
    }
}
