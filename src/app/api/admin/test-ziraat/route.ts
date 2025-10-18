import { NextRequest, NextResponse } from 'next/server'
import { ziraatPaymentService } from '@/lib/ziraat-payment'
import { z } from 'zod'

const testZiraatSchema = z.object({
    amount: z.number().positive('Geçerli bir tutar giriniz'),
    orderId: z.string().min(1, 'Sipariş ID gereklidir')
})

export async function POST(request: NextRequest) {
    try {
        console.log('=== TEST ZIRAAT API CALLED ===')

        const body = await request.json()
        console.log('Test Ziraat data:', body)

        // Form verilerini doğrula
        const { amount, orderId } = testZiraatSchema.parse(body)

        // Test ödeme oluştur
        const paymentResponse = await ziraatPaymentService.createTestPayment(orderId, amount)

        if (paymentResponse.success && paymentResponse.redirectUrl) {
            return NextResponse.json({
                success: true,
                redirectUrl: paymentResponse.redirectUrl,
                transactionId: paymentResponse.transactionId,
                message: 'Ziraat Bankası test başarılı'
            }, { status: 200 })
        } else {
            return NextResponse.json({
                success: false,
                error: paymentResponse.error || 'Ziraat test başarısız'
            }, { status: 400 })
        }

    } catch (error) {
        console.error('Error testing Ziraat:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Geçersiz veri formatı',
                details: error.issues
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Ziraat test edilemedi. Lütfen ayarları kontrol edin.'
        }, { status: 500 })
    }
}
