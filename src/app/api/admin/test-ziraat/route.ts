import { NextRequest, NextResponse } from 'next/server'
import { ziraatPaymentService } from '@/lib/ziraat-payment'
import { requireAdmin, handleApiError } from '@/lib/error-handler'
import { z } from 'zod'

const testZiraatSchema = z.object({
    amount: z.number().positive('Geçerli bir tutar giriniz'),
    orderId: z.string().min(1, 'Sipariş ID gereklidir')
})

export async function POST(request: NextRequest) {
    try {
        // Admin yetkisi kontrolü
        const authHeader = request.headers.get('authorization')
        requireAdmin(authHeader)

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
        return handleApiError(error)
    }
}
