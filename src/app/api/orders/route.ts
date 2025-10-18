import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { emailService } from '@/lib/email'
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError, requireAuth, validateRequest } from '@/lib/error-handler'
import { z } from 'zod'

const orderItemSchema = z.object({
    productId: z.string().min(1, 'Ürün ID gerekli'),
    variationId: z.string().optional(),
    quantity: z.number().min(1, 'Miktar en az 1 olmalı')
})

const addressSchema = z.object({
    title: z.string().min(1, 'Adres başlığı gerekli'),
    firstName: z.string().min(1, 'Ad gerekli'),
    lastName: z.string().min(1, 'Soyad gerekli'),
    phone: z.string().min(1, 'Telefon gerekli'),
    city: z.string().min(1, 'Şehir gerekli'),
    district: z.string().min(1, 'İlçe gerekli'),
    fullAddress: z.string().min(1, 'Adres gerekli')
})

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'En az bir ürün gerekli'),
    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),
    notes: z.string().optional()
})

export async function GET(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        const user = requireAuth(authHeader)

        // Kullanıcıya ait siparişleri getir
        const orders = await prisma.order.findMany({
            where: { userId: user.userId },
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

        return NextResponse.json(orders)
    } catch (error) {
        return handleApiError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        const user = requireAuth(authHeader)

        const body = await request.json()
        const { items, shippingAddress, billingAddress, notes } = validateRequest(createOrderSchema, body)

        // billingAddress undefined ise shippingAddress'i kullan
        const finalBillingAddress = billingAddress || shippingAddress

        // Kullanıcıyı veritabanından al
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId }
        })

        if (!dbUser) {
            throw new NotFoundError('Kullanıcı bulunamadı')
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
                if (!variation) {
                    throw new NotFoundError(`Varyasyon bulunamadı: ${item.variationId}`)
                }
                totalAmount += Number(variation.price) * item.quantity
            } else {
                // Basit ürünler için ana ürün fiyatını kullan
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { price: true }
                })
                if (!product) {
                    throw new NotFoundError(`Ürün bulunamadı: ${item.productId}`)
                }
                totalAmount += Number(product.price) * item.quantity
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
                userId: dbUser.id,
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

        // E-posta bildirimleri gönder (asenkron olarak)
        try {
            // Müşteriye sipariş onay e-postası
            await emailService.sendOrderConfirmation(order, dbUser.email)

            // Admin'e yeni sipariş bildirimi
            await emailService.sendOrderNotificationToAdmin(order)
        } catch (emailError) {
            console.error('E-posta gönderilirken hata:', emailError)
            // E-posta hatası sipariş oluşturmayı etkilemesin
        }

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        return handleApiError(error)
    }
} 