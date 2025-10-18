import { NextRequest, NextResponse } from 'next/server'
import { mockPaymentService } from '@/lib/mock-payment'
import { z } from 'zod'

const testMockSchema = z.object({
    amount: z.number().positive('Geçerli bir tutar giriniz'),
    orderId: z.string().min(1, 'Sipariş ID gereklidir')
})

export async function POST(request: NextRequest) {
    try {
        console.log('=== TEST MOCK API CALLED ===')

        const body = await request.json()
        console.log('Test Mock data:', body)

        // Form verilerini doğrula
        const { amount, orderId } = testMockSchema.parse(body)

        // Mock test ödeme oluştur
        const paymentResponse = await mockPaymentService.createTestPayment(orderId, amount)

        if (paymentResponse.success && paymentResponse.redirectUrl) {
            return NextResponse.json({
                success: true,
                redirectUrl: paymentResponse.redirectUrl,
                transactionId: paymentResponse.transactionId,
                message: 'Mock ödeme test başarılı'
            }, { status: 200 })
        } else {
            return NextResponse.json({
                success: false,
                error: paymentResponse.error || 'Mock test başarısız'
            }, { status: 400 })
        }

    } catch (error) {
        console.error('Error testing Mock:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Geçersiz veri formatı',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Mock test edilemedi. Lütfen ayarları kontrol edin.'
        }, { status: 500 })
    }
}
