import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const orderUpdateSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
    notes: z.string().optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
        }

        const order = await prisma.order.findUnique({
            where: { id: resolvedParams.id },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        product: {
                            include: {
                                category: {
                                    select: { id: true, name: true }
                                }
                            }
                        },
                        variation: {
                            include: {
                                attributes: {
                                    include: {
                                        attributeValue: true
                                    }
                                }
                            }
                        }
                    }
                },
                shippingAddress: true,
                billingAddress: true,
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
        }

        // Kullanıcı sadece kendi siparişlerini görebilir (admin değilse)
        if (payload.role !== 'ADMIN' && order.userId !== payload.userId) {
            return NextResponse.json({ error: 'Bu siparişe erişim izniniz yok' }, { status: 403 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json({ error: 'Sipariş getirilirken bir hata oluştu' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
        }

        // Sadece admin sipariş güncelleyebilir
        if (payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
        }

        const body = await request.json()
        const updateData = orderUpdateSchema.parse(body)

        const order = await prisma.order.update({
            where: { id: resolvedParams.id },
            data: updateData,
            include: {
                user: {
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        product: {
                            select: { name: true, images: true, sku: true },
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
                billingAddress: true,
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        return NextResponse.json(order)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Sipariş güncellenirken bir hata oluştu' }, { status: 500 })
    }
} 