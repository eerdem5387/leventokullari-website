import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.blogCategory.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: { name: 'asc' }
        }).catch((error) => {
            console.log('BlogCategory table not found, returning empty array')
            return []
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
