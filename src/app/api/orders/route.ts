import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { emailService } from '@/lib/email'

export async function GET(request: NextRequest) {
    try {
        console.log('=== ORDERS LIST API CALLED ===')

        // Authorization header'dan token'ı al
        const authHeader = request.headers.get('authorization')
        console.log('Auth header:', authHeader)

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Auth error: Invalid authorization header')
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        console.log('Token:', token)

        // JWT token'ı doğrula
        const decodedToken = verifyToken(token)
        console.log('Decoded token:', decodedToken)

        if (!decodedToken) {
            console.log('Token verification failed')
            return NextResponse.json(
                { error: 'Geçersiz token' },
                { status: 401 }
            )
        }

        // Kullanıcıya ait siparişleri getir
        const orders = await prisma.order.findMany({
            where: { userId: decodedToken.userId },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                images: true
                            },
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                shippingAddress: true,
                billingAddress: true
            },
            orderBy: { createdAt: 'desc' }
        })

        console.log('Found orders:', orders.length)
        return NextResponse.json(orders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json(
            { error: 'Siparişler getirilemedi' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('=== ORDER API CALLED ===')
        const body = await request.json()
        console.log('Request body:', body)

        const { items, shippingAddress, billingAddress, notes } = body

        // billingAddress undefined ise shippingAddress'i kullan
        const finalBillingAddress = billingAddress || shippingAddress

        // Authorization header'dan token'ı al
        const authHeader = request.headers.get('authorization')
        console.log('Auth header:', authHeader)

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Auth error: Invalid authorization header')
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        console.log('Token:', token)

        // JWT token'ı doğrula
        const decodedToken = verifyToken(token)
        console.log('Decoded token:', decodedToken)

        if (!decodedToken) {
            console.log('Token verification failed')
            return NextResponse.json(
                { error: 'Geçersiz token' },
                { status: 401 }
            )
        }

        // Kullanıcıyı token'dan al
        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId }
        })
        console.log('Found user:', user ? 'Yes' : 'No')

        if (!user) {
            console.log('User not found error')
            return NextResponse.json(
                { error: 'Kullanıcı bulunamadı' },
                { status: 404 }
            )
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'Ürünler gereklidir' },
                { status: 400 }
            )
        }

        // Toplam tutarı hesapla
        let totalAmount = 0
        for (const item of items) {
            // Varyasyonlu ürünler için varyasyon fiyatını kullan
            if (item.variationId) {
                const variation = await prisma.productVariation.findUnique({
                    where: { id: item.variationId },
                    select: { price: true }
                })
                if (variation) {
                    totalAmount += Number(variation.price) * item.quantity
                }
            } else {
                // Basit ürünler için ana ürün fiyatını kullan
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { price: true }
                })
                if (product) {
                    totalAmount += Number(product.price) * item.quantity
                }
            }
        }

        // Adresleri kontrol et veya oluştur
        const findOrCreateAddress = async (addressData: any) => {
            // Mevcut adresi ara
            const existingAddress = await prisma.address.findFirst({
                where: {
                    userId: user.id,
                    title: addressData.title,
                    firstName: addressData.firstName,
                    lastName: addressData.lastName,
                    phone: addressData.phone,
                    city: addressData.city,
                    district: addressData.district,
                    fullAddress: addressData.fullAddress
                }
            })

            if (existingAddress) {
                console.log('Using existing address:', existingAddress.id)
                return existingAddress
            } else {
                console.log('Creating new address')
                return await prisma.address.create({
                    data: {
                        userId: user.id,
                        title: addressData.title,
                        firstName: addressData.firstName,
                        lastName: addressData.lastName,
                        phone: addressData.phone,
                        country: 'Türkiye', // Default değer
                        city: addressData.city,
                        district: addressData.district,
                        fullAddress: addressData.fullAddress
                    }
                })
            }
        }

        const shippingAddressRecord = await findOrCreateAddress(shippingAddress)
        const billingAddressRecord = await findOrCreateAddress(finalBillingAddress)

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                orderNumber: `ORD-${Date.now()}`,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                totalAmount: totalAmount,
                finalAmount: totalAmount,
                shippingAddressId: shippingAddressRecord.id,
                billingAddressId: billingAddressRecord.id,
                paymentMethod: 'CREDIT_CARD',
                notes: notes || ''
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        // Sipariş kalemlerini oluştur
        for (const item of items) {
            let unitPrice = 0

            // Varyasyonlu ürünler için varyasyon fiyatını kullan
            if (item.variationId) {
                const variation = await prisma.productVariation.findUnique({
                    where: { id: item.variationId },
                    select: { price: true }
                })
                if (variation) {
                    unitPrice = Number(variation.price)
                }
            } else {
                // Basit ürünler için ana ürün fiyatını kullan
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { price: true }
                })
                if (product) {
                    unitPrice = Number(product.price)
                }
            }

            if (unitPrice > 0) {
                await prisma.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        variationId: item.variationId || null,
                        quantity: item.quantity,
                        unitPrice: unitPrice,
                        totalPrice: unitPrice * item.quantity
                    }
                })
            }
        }

        console.log('Order created successfully:', order.id)

        // E-posta bildirimleri gönder (asenkron olarak)
        try {
          // Müşteriye sipariş onay e-postası
          await emailService.sendOrderConfirmation(order, user.email)
          
          // Admin'e yeni sipariş bildirimi
          await emailService.sendOrderNotificationToAdmin(order)
        } catch (emailError) {
          console.error('E-posta gönderilirken hata:', emailError)
          // E-posta hatası sipariş oluşturmayı etkilemesin
        }

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })
        return NextResponse.json(
            { error: 'Sipariş oluşturulamadı', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 