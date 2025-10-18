import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const cartItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1)
})

export async function GET() {
    try {
        // Sepet verilerini localStorage'dan almak için client-side'da yapılacak
        // Bu endpoint sadece ürün bilgilerini getirmek için kullanılacak
        return NextResponse.json({ message: 'Sepet verileri client-side\'da yönetiliyor' })
    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json({ error: 'Sepet getirilirken bir hata oluştu' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId, quantity } = cartItemSchema.parse(body)

        // Ürünü kontrol et
        const product = await prisma.product.findUnique({
            where: { id: productId, isActive: true }
        })

        if (!product) {
            return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
        }

        if (product.stock < quantity) {
            return NextResponse.json({ error: 'Yeterli stok bulunmuyor' }, { status: 400 })
        }

        // Ürün bilgilerini döndür (client-side'da sepete eklenecek)
        return NextResponse.json({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0],
            stock: product.stock,
            quantity
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error adding to cart:', error)
        return NextResponse.json({ error: 'Sepete eklenirken bir hata oluştu' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId, quantity } = cartItemSchema.parse(body)

        // Ürünü kontrol et
        const product = await prisma.product.findUnique({
            where: { id: productId, isActive: true }
        })

        if (!product) {
            return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
        }

        if (product.stock < quantity) {
            return NextResponse.json({ error: 'Yeterli stok bulunmuyor' }, { status: 400 })
        }

        return NextResponse.json({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0],
            stock: product.stock,
            quantity
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error updating cart:', error)
        return NextResponse.json({ error: 'Sepet güncellenirken bir hata oluştu' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if (!productId) {
            return NextResponse.json({ error: 'Ürün ID gerekli' }, { status: 400 })
        }

        // Ürünün var olduğunu kontrol et
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Ürün sepetten kaldırıldı' })
    } catch (error) {
        console.error('Error removing from cart:', error)
        return NextResponse.json({ error: 'Sepetten kaldırılırken bir hata oluştu' }, { status: 500 })
    }
} 