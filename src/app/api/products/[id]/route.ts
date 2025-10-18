import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, NotFoundError, ConflictError, ValidationError, requireAdmin } from '@/lib/error-handler'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Admin yetkisi kontrolü
        const authHeader = request.headers.get('authorization')
        requireAdmin(authHeader)

        const resolvedParams = await params
        const productId = resolvedParams.id

        // ID formatını kontrol et
        if (!productId || typeof productId !== 'string') {
            throw new ValidationError('Geçersiz ürün ID')
        }

        // Ürünü bul
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variations: true,
                orderItems: true
            }
        })

        if (!product) {
            throw new NotFoundError('Ürün bulunamadı')
        }

        // Ürünün siparişlerde kullanılıp kullanılmadığını kontrol et
        if (product.orderItems.length > 0) {
            throw new ConflictError('Bu ürün siparişlerde kullanıldığı için silinemez')
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
        return handleApiError(error)
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const productId = resolvedParams.id

        // ID formatını kontrol et
        if (!productId || typeof productId !== 'string') {
            throw new ValidationError('Geçersiz ürün ID')
        }

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
            throw new NotFoundError('Ürün bulunamadı')
        }

        return NextResponse.json(product)

    } catch (error) {
        return handleApiError(error)
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Admin yetkisi kontrolü
        const authHeader = request.headers.get('authorization')
        requireAdmin(authHeader)

        const resolvedParams = await params
        const productId = resolvedParams.id

        // ID formatını kontrol et
        if (!productId || typeof productId !== 'string') {
            throw new ValidationError('Geçersiz ürün ID')
        }

        const body = await request.json()

        // Ürünün var olup olmadığını kontrol et
        const existingProduct = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!existingProduct) {
            throw new NotFoundError('Ürün bulunamadı')
        }

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
        return handleApiError(error)
    }
} 