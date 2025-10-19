import { NextRequest, NextResponse } from 'next/server'
import { ziraatPaymentService } from '@/lib/ziraat-payment'
import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        console.log('=== ZIRAAT CALLBACK API CALLED ===')

        // Form verilerini al
        const formData = await request.formData()
        const callbackData: any = {}

        // Form verilerini objeye çevir
        for (const [key, value] of formData.entries()) {
            callbackData[key] = value.toString()
        }

        console.log('Callback data:', callbackData)

        // Callback'i işle
        const result = await ziraatPaymentService.processCallback(callbackData)

        if (result.success && result.orderId) {
            // Siparişi güncelle
            const order = await prisma.order.update({
                where: { id: result.orderId },
                data: {
                    paymentStatus: 'COMPLETED',
                    status: 'CONFIRMED',
                    notes: `Ödeme başarılı. Transaction ID: ${result.transactionId}`
                },
                include: {
                    user: {
                        select: { name: true, email: true }
                    },
                    items: {
                        include: {
                            product: true,
                            variation: {
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
                    }
                }
            })

            // Ödeme kaydı oluştur
            await prisma.payment.create({
                data: {
                    orderId: result.orderId,
                    amount: result.amount || 0,
                    method: 'BANK_TRANSFER',
                    status: 'COMPLETED',
                    transactionId: result.transactionId || '',
                    responseCode: result.responseCode || '',
                    responseMessage: result.responseMessage || ''
                }
            })

            // E-posta bildirimleri gönder
            try {
                // Müşteriye ödeme onay e-postası
                await emailService.sendOrderStatusUpdate(order, order.user.email, 'CONFIRMED')

                // Admin'e ödeme bildirimi
                await emailService.sendOrderNotificationToAdmin(order)
            } catch (emailError) {
                console.error('E-posta gönderilirken hata:', emailError)
            }

            // Başarılı sayfasına yönlendir
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/success?orderId=${result.orderId}`)
        } else {
            // Siparişi güncelle (başarısız)
            if (result.orderId) {
                await prisma.order.update({
                    where: { id: result.orderId },
                    data: {
                        paymentStatus: 'FAILED',
                        notes: `Ödeme başarısız. Hata: ${result.error}`
                    }
                })

                // Başarısız ödeme kaydı oluştur
                await prisma.payment.create({
                    data: {
                        orderId: result.orderId,
                        amount: result.amount || 0,
                        method: 'BANK_TRANSFER',
                        status: 'FAILED',
                        transactionId: result.transactionId || '',
                        responseCode: result.responseCode || '',
                        responseMessage: result.error || ''
                    }
                })
            }

            // Başarısız sayfasına yönlendir
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/fail?orderId=${result.orderId}&error=${encodeURIComponent(result.error || '')}`)
        }

    } catch (error) {
        console.error('Ziraat callback error:', error)

        // Hata durumunda başarısız sayfasına yönlendir
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/fail?error=${encodeURIComponent('Callback işlemi başarısız')}`)
    }
}

// GET isteği için de aynı işlemi yap (bazı bankalar GET kullanabilir)
export async function GET(request: NextRequest) {
    try {
        console.log('=== ZIRAAT CALLBACK GET API CALLED ===')

        const { searchParams } = new URL(request.url)
        const callbackData: any = {}

        // Query parametrelerini objeye çevir
        for (const [key, value] of searchParams.entries()) {
            callbackData[key] = value
        }

        console.log('Callback data (GET):', callbackData)

        // POST ile aynı işlemi yap
        const result = await ziraatPaymentService.processCallback(callbackData)

        if (result.success && result.orderId) {
            // Siparişi güncelle
            const order = await prisma.order.update({
                where: { id: result.orderId },
                data: {
                    paymentStatus: 'COMPLETED',
                    status: 'CONFIRMED',
                    notes: `Ödeme başarılı. Transaction ID: ${result.transactionId}`
                },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            })

            // Ödeme kaydı oluştur
            await prisma.payment.create({
                data: {
                    orderId: result.orderId,
                    amount: result.amount || 0,
                    method: 'BANK_TRANSFER',
                    status: 'COMPLETED',
                    transactionId: result.transactionId || '',
                    responseCode: result.responseCode || '',
                    responseMessage: result.responseMessage || ''
                }
            })

            // E-posta bildirimleri gönder
            try {
                await emailService.sendOrderStatusUpdate(order, order.user.email, 'CONFIRMED')
                await emailService.sendOrderNotificationToAdmin(order)
            } catch (emailError) {
                console.error('E-posta gönderilirken hata:', emailError)
            }

            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/success?orderId=${result.orderId}`)
        } else {
            // Siparişi güncelle (başarısız)
            if (result.orderId) {
                await prisma.order.update({
                    where: { id: result.orderId },
                    data: {
                        paymentStatus: 'FAILED',
                        notes: `Ödeme başarısız. Hata: ${result.error}`
                    }
                })

                await prisma.payment.create({
                    data: {
                        orderId: result.orderId,
                        amount: result.amount || 0,
                        method: 'BANK_TRANSFER',
                        status: 'FAILED',
                        transactionId: result.transactionId || '',
                        responseCode: result.responseCode || '',
                        responseMessage: result.error || ''
                    }
                })
            }

            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/fail?orderId=${result.orderId}&error=${encodeURIComponent(result.error || '')}`)
        }

    } catch (error) {
        console.error('Ziraat callback GET error:', error)
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payment/fail?error=${encodeURIComponent('Callback işlemi başarısız')}`)
    }
}
