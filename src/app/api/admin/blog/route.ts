import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createBlogPostSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir'),
    slug: z.string().min(1, 'Slug gereklidir'),
    content: z.string().min(1, 'İçerik gereklidir'),
    excerpt: z.string().nullable().optional(),
    featuredImage: z.string().nullable().optional(),
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    categoryId: z.string().nullable().optional(),
    tagIds: z.array(z.string()).optional()
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

        const posts = await prisma.blogPost.findMany({
            include: {
                author: {
                    select: { name: true }
                },
                category: {
                    select: { name: true }
                },
                tags: {
                    include: {
                        tag: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(posts)
    } catch (error) {
        console.error('Error fetching blog posts:', error)
        return NextResponse.json(
            { error: 'Blog yazıları getirilemedi' },
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

        // Boş string'leri null'a çevir
        const cleanedBody = {
            ...body,
            categoryId: body.categoryId && body.categoryId.trim() !== '' ? body.categoryId : null,
            featuredImage: body.featuredImage && body.featuredImage.trim() !== '' ? body.featuredImage : null,
            excerpt: body.excerpt && body.excerpt.trim() !== '' ? body.excerpt : null,
            metaTitle: body.metaTitle && body.metaTitle.trim() !== '' ? body.metaTitle : null,
            metaDescription: body.metaDescription && body.metaDescription.trim() !== '' ? body.metaDescription : null
        }

        console.log('Cleaned body:', cleanedBody)
        const validatedData = createBlogPostSchema.parse(cleanedBody)

        // Slug benzersizlik kontrolü
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug: validatedData.slug }
        })

        if (existingPost) {
            return NextResponse.json(
                { error: 'Bu slug zaten kullanılıyor' },
                { status: 400 }
            )
        }

        // Yazar ID'sini token'dan al
        const authorId = decodedToken.userId

        // Kategori kontrolü (eğer verilmişse)
        if (validatedData.categoryId) {
            const category = await prisma.blogCategory.findUnique({
                where: { id: validatedData.categoryId }
            })

            if (!category) {
                return NextResponse.json(
                    { error: 'Kategori bulunamadı' },
                    { status: 404 }
                )
            }
        }

        // Blog yazısını oluştur
        console.log('Creating blog post with data:', {
            title: validatedData.title,
            slug: validatedData.slug,
            content: validatedData.content,
            excerpt: validatedData.excerpt,
            featuredImage: validatedData.featuredImage,
            metaTitle: validatedData.metaTitle,
            metaDescription: validatedData.metaDescription,
            status: validatedData.status,
            categoryId: validatedData.categoryId,
            authorId: authorId,
            publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
        })

        const post = await prisma.blogPost.create({
            data: {
                title: validatedData.title,
                slug: validatedData.slug,
                content: validatedData.content,
                excerpt: validatedData.excerpt,
                featuredImage: validatedData.featuredImage,
                metaTitle: validatedData.metaTitle,
                metaDescription: validatedData.metaDescription,
                status: validatedData.status,
                categoryId: validatedData.categoryId,
                authorId: authorId,
                publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
            }
        })

        console.log('Blog post created successfully:', post.id)

        // Etiketleri ekle (eğer verilmişse)
        if (validatedData.tagIds && validatedData.tagIds.length > 0) {
            for (const tagId of validatedData.tagIds) {
                // Blog yazısı ile etiket arasında ilişki oluştur
                await prisma.blogPostTag.create({
                    data: {
                        postId: post.id,
                        tagId: tagId
                    }
                })
            }
        }

        return NextResponse.json(post, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Validation error:', error.issues)
            return NextResponse.json(
                { error: 'Geçersiz veri formatı', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating blog post:', error)
        return NextResponse.json(
            { error: 'Blog yazısı oluşturulamadı', details: error instanceof Error ? error.message : 'Bilinmeyen hata' },
            { status: 500 }
        )
    }
}
