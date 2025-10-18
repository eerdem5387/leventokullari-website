import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const tags = await prisma.blogTag.findMany({
            include: {
                _count: {
                    select: { posts: true }
                }
            },
            orderBy: {
                posts: {
                    _count: 'desc'
                }
            },
            take: 20
        }).catch((error) => {
            console.log('BlogTag table not found, returning empty array')
            return []
        })

        return NextResponse.json(tags)
    } catch (error) {
        console.error('Get blog tags error:', error)
        return NextResponse.json(
            { error: 'Blog etiketleri getirilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
