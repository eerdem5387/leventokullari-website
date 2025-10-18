import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const category = searchParams.get('category')
        const tag = searchParams.get('tag')
        const search = searchParams.get('search')

        const skip = (page - 1) * limit

        // Filtreleme koşulları
        const where: any = {
            status: 'PUBLISHED'
        }

        if (category) {
            where.category = {
                slug: category
            }
        }

        if (tag) {
            where.tags = {
                some: {
                    tag: {
                        slug: tag
                    }
                }
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ]
        }

        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                include: {
                    author: {
                        select: { name: true }
                    },
                    category: {
                        select: { name: true, slug: true }
                    },
                    tags: {
                        include: {
                            tag: {
                                select: { name: true, slug: true }
                            }
                        }
                    }
                },
                orderBy: { publishedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.blogPost.count({ where })
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Get blog posts error:', error)
        return NextResponse.json(
            { error: 'Blog yazıları getirilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
