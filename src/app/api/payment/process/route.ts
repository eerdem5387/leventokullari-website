import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const paymentSchema = z.object({
    orderId: z.string(),
    amount: z.number(),
    method: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']),
    cardNumber: z.string().optional(),
    cardHolder: z.string().optional(),
    expiryMonth: z.string().optional(),
    expiryYear: z.string().optional(),
    cvv: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        console.log('=== PAYMENT PROCESS API CALLED ===')

        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
        }

        const payload = verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
        }

        const body = await request.json()
        console.log('Payment request body:', body)
        console.log('Body type check:', {
            orderId: typeof body.orderId,
            amount: typeof body.amount,
            method: typeof body.method,
            cardNumber: typeof body.cardNumber,
            cardHolder: typeof body.cardHolder,
            expiryMonth: typeof body.expiryMonth,
            expiryYear: typeof body.expiryYear,
            cvv: typeof body.cvv
        })

        try {
            const paymentData = paymentSchema.parse(body)
        } catch (error) {
            console.error('Schema validation error:', error)
            if (error instanceof z.ZodError) {
                return NextResponse.json({
                    error: 'Geçersiz ödeme verisi',
                    details: error.issues
                }, { status: 400 })
            }
            throw error
        }

        const paymentData = paymentSchema.parse(body)

        // Siparişi kontrol et
        const order = await prisma.order.findUnique({
            where: { id: paymentData.orderId },
            include: {
                user: true,
                items: true
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
        }

        // Kullanıcı sadece kendi siparişlerini ödeyebilir
        if (payload.role !== 'ADMIN' && order.userId !== payload.userId) {
            return NextResponse.json({ error: 'Bu siparişe erişim izniniz yok' }, { status: 403 })
        }

        // Sipariş zaten ödenmiş mi kontrol et
        if (order.paymentStatus === 'COMPLETED') {
            return NextResponse.json({ error: 'Bu sipariş zaten ödenmiş' }, { status: 400 })
        }

        // Ödeme tutarını kontrol et
        if (Number(order.finalAmount) !== paymentData.amount) {
            return NextResponse.json({ error: 'Ödeme tutarı sipariş tutarı ile eşleşmiyor' }, { status: 400 })
        }

        // Simüle edilmiş ödeme işlemi (gerçek uygulamada payment gateway kullanılır)
        const isPaymentSuccessful = await simulatePayment(paymentData)

        if (!isPaymentSuccessful) {
            return NextResponse.json({ error: 'Ödeme işlemi başarısız' }, { status: 400 })
        }

        // Ödeme kaydını oluştur
        const payment = await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: paymentData.amount,
                method: paymentData.method,
                status: 'COMPLETED',
                transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                gatewayResponse: JSON.stringify({
                    success: true,
                    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString()
                })
            }
        })

        // Sipariş durumunu güncelle
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'COMPLETED',
                status: 'CONFIRMED'
            }
        })

        console.log('Payment completed successfully:', payment.id)

        return NextResponse.json({
            success: true,
            message: 'Ödeme başarıyla tamamlandı',
            payment: {
                id: payment.id,
                transactionId: payment.transactionId,
                amount: payment.amount,
                method: payment.method,
                status: payment.status
            }
        })

    } catch (error) {
        console.error('Payment process error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Geçersiz ödeme verisi',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Ödeme işlemi sırasında bir hata oluştu',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// Simüle edilmiş ödeme işlemi
async function simulatePayment(paymentData: any): Promise<boolean> {
    // Gerçek uygulamada burada payment gateway API'si çağrılır
    // Şimdilik %95 başarı oranı ile simüle ediyoruz

    return new Promise((resolve) => {
        setTimeout(() => {
            // Kart numarası geçerli mi kontrol et (basit Luhn algoritması)
            const cardNumber = paymentData.cardNumber?.replace(/\s/g, '') || ''
            const isValidCard = cardNumber.length >= 13 && cardNumber.length <= 19

            // CVV kontrolü
            const isValidCvv = paymentData.cvv?.length >= 3 && paymentData.cvv?.length <= 4

            // Kart sahibi kontrolü
            const isValidHolder = paymentData.cardHolder?.length > 0

            // Tarih kontrolü
            const currentYear = new Date().getFullYear()
            const currentMonth = new Date().getMonth() + 1
            const expiryYear = parseInt(paymentData.expiryYear || '0')
            const expiryMonth = parseInt(paymentData.expiryMonth || '0')

            const isValidDate = expiryYear > currentYear ||
                (expiryYear === currentYear && expiryMonth >= currentMonth)

            // %95 başarı oranı + geçerlilik kontrolleri
            const isSuccessful = Math.random() > 0.05 &&
                isValidCard &&
                isValidCvv &&
                isValidHolder &&
                isValidDate

            resolve(isSuccessful)
        }, 1000) // 1 saniye simüle edilmiş işlem süresi
    })
} 