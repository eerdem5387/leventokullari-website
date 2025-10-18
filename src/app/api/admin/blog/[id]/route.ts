import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const postId = resolvedParams.id

        const post = await prisma.blogPost.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: { name: true }
                },
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        })

        if (!post) {
            return NextResponse.json(
                { error: 'Blog yazısı bulunamadı' },
                { status: 404 }
            )
        }

        return NextResponse.json(post)
    } catch (error) {
        console.error('Get blog post error:', error)
        return NextResponse.json(
            { error: 'Blog yazısı getirilirken bir hata oluştu' },
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
        const postId = resolvedParams.id
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

        // Boş string'leri null'a çevir
        const cleanedBody = {
            ...body,
            categoryId: body.categoryId && body.categoryId.trim() !== '' ? body.categoryId : null,
            featuredImage: body.featuredImage && body.featuredImage.trim() !== '' ? body.featuredImage : null,
            excerpt: body.excerpt && body.excerpt.trim() !== '' ? body.excerpt : null,
            metaTitle: body.metaTitle && body.metaTitle.trim() !== '' ? body.metaTitle : null,
            metaDescription: body.metaDescription && body.metaDescription.trim() !== '' ? body.metaDescription : null
        }

        console.log('Updating blog post with data:', cleanedBody)

        // Blog yazısını güncelle
        const updatedPost = await prisma.blogPost.update({
            where: { id: postId },
            data: {
                title: cleanedBody.title,
                slug: cleanedBody.slug,
                content: cleanedBody.content,
                excerpt: cleanedBody.excerpt,
                featuredImage: cleanedBody.featuredImage,
                metaTitle: cleanedBody.metaTitle,
                metaDescription: cleanedBody.metaDescription,
                status: cleanedBody.status,
                publishedAt: cleanedBody.status === 'PUBLISHED' ? new Date() : null,
                categoryId: cleanedBody.categoryId
            },
            include: {
                author: {
                    select: { name: true }
                },
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        })

        // Etiketleri güncelle (tagIds olarak geliyor)
        if (body.tagIds && Array.isArray(body.tagIds)) {
            // Mevcut etiketleri sil
            await prisma.blogPostTag.deleteMany({
                where: { postId }
            })

            // Yeni etiketleri ekle
            for (const tagId of body.tagIds) {
                await prisma.blogPostTag.create({
                    data: {
                        postId,
                        tagId
                    }
                })
            }
        }

        return NextResponse.json(updatedPost)
    } catch (error) {
        console.error('Update blog post error:', error)
        return NextResponse.json(
            { error: 'Blog yazısı güncellenirken bir hata oluştu' },
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
        const postId = resolvedParams.id

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

        // Blog yazısını sil (etiketler cascade ile silinecek)
        await prisma.blogPost.delete({
            where: { id: postId }
        })

        return NextResponse.json(
            { message: 'Blog yazısı başarıyla silindi' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete blog post error:', error)
        return NextResponse.json(
            { error: 'Blog yazısı silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
