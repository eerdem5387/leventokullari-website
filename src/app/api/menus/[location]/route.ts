import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ location: string }> }
) {
    try {
        const resolvedParams = await params
        const { location } = resolvedParams

        const menu = await prisma.menu.findUnique({
            where: {
                location: location,
                isActive: true
            },
            include: {
                items: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' },
                    include: {
                        children: {
                            where: { isActive: true },
                            orderBy: { order: 'asc' }
                        }
                    }
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
        console.error('Error fetching menu:', error)
        return NextResponse.json(
            { error: 'Menü getirilemedi' },
            { status: 500 }
        )
    }
}
