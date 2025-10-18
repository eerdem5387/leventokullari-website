import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categoryUpdateSchema = z.object({
    name: z.string().min(1, 'Kategori adı gerekli').optional(),
    description: z.string().optional(),
    slug: z.string().min(1, 'Slug gerekli').optional(),
    isActive: z.boolean().optional(),
    isPopular: z.boolean().optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const category = await prisma.category.findUnique({
            where: { id: resolvedParams.id },
            include: {
                products: {
                    where: { isActive: true },
                    include: {
                        _count: {
                            select: { reviews: true }
                        }
                    }
                },
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!category) {
            return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 })
        }

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error fetching category:', error)
        return NextResponse.json({ error: 'Kategori getirilirken bir hata oluştu' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const body = await request.json()
        const updateData = categoryUpdateSchema.parse(body)

        // Slug benzersizlik kontrolü (eğer slug güncelleniyorsa)
        if (updateData.slug) {
            const existingCategory = await prisma.category.findFirst({
                where: {
                    slug: updateData.slug,
                    id: { not: resolvedParams.id }
                }
            })

            if (existingCategory) {
                return NextResponse.json({ error: 'Bu slug zaten kullanılıyor' }, { status: 400 })
            }
        }

        const category = await prisma.category.update({
            where: { id: resolvedParams.id },
            data: updateData,
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error updating category:', error)
        return NextResponse.json({ error: 'Kategori güncellenirken bir hata oluştu' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params

        // Kategoride ürün var mı kontrol et
        const categoryWithProducts = await prisma.category.findUnique({
            where: { id: resolvedParams.id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!categoryWithProducts) {
            return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 })
        }

        // Eğer kategoride ürünler varsa, onları "Kategorisiz" kategorisine taşı
        if (categoryWithProducts._count.products > 0) {
            // "Kategorisiz" kategorisini bul
            const uncategorizedCategory = await prisma.category.findUnique({
                where: { slug: 'kategorisiz' }
            })

            if (!uncategorizedCategory) {
                return NextResponse.json({
                    error: 'Kategorisiz kategori bulunamadı'
                }, { status: 500 })
            }

            // Bu kategorideki tüm ürünleri "Kategorisiz" kategorisine taşı
            await prisma.product.updateMany({
                where: { categoryId: resolvedParams.id },
                data: { categoryId: uncategorizedCategory.id }
            })

            console.log(`📦 Moved ${categoryWithProducts._count.products} products to uncategorized category`)
        }

        // Kategoriyi sil
        await prisma.category.delete({
            where: { id: resolvedParams.id }
        })

        return NextResponse.json({
            message: 'Kategori başarıyla silindi',
            movedProducts: categoryWithProducts._count.products > 0 ? categoryWithProducts._count.products : 0
        })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json({ error: 'Kategori silinirken bir hata oluştu' }, { status: 500 })
    }
} 