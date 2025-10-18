import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const productId = resolvedParams.id

        // Ürünü bul
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variations: true,
                orderItems: true
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Ürün bulunamadı' },
                { status: 404 }
            )
        }

        // Ürünün siparişlerde kullanılıp kullanılmadığını kontrol et
        if (product.orderItems.length > 0) {
            return NextResponse.json(
                { error: 'Bu ürün siparişlerde kullanıldığı için silinemez' },
                { status: 400 }
            )
        }

        // Ürünü sil (varyasyonlar cascade ile silinecek)
        await prisma.product.delete({
            where: { id: productId }
        })

        return NextResponse.json(
            { message: 'Ürün başarıyla silindi' },
            { status: 200 }
        )

    } catch (error) {
        console.error('Delete product error:', error)
        return NextResponse.json(
            { error: 'Ürün silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const productId = resolvedParams.id

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                category: true,
                variations: {
                    include: {
                        attributes: {
                            include: {
                                attributeValue: {
                                    include: {
                                        attribute: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Ürün bulunamadı' },
                { status: 404 }
            )
        }

        return NextResponse.json(product)

    } catch (error) {
        console.error('Get product error:', error)
        return NextResponse.json(
            { error: 'Ürün getirilirken bir hata oluştu' },
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
        const productId = resolvedParams.id
        const body = await request.json()

        // Ürünü güncelle
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name: body.name,
                description: body.description,
                price: body.price,
                comparePrice: body.comparePrice,
                stock: body.stock,
                sku: body.sku,
                categoryId: body.categoryId,
                isActive: body.isActive,
                isFeatured: body.isFeatured,
                images: body.images
            },
            include: {
                category: true
            }
        })

        return NextResponse.json(updatedProduct)

    } catch (error) {
        console.error('Update product error:', error)
        return NextResponse.json(
            { error: 'Ürün güncellenirken bir hata oluştu' },
            { status: 500 }
        )
    }
} 