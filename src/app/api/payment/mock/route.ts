import { NextRequest, NextResponse } from 'next/server'
import { mockPaymentService } from '@/lib/mock-payment'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const paymentRequestSchema = z.object({
  orderId: z.string().min(1, 'Sipariş ID gereklidir'),
  amount: z.number().min(0, 'Geçerli bir tutar giriniz'),
  customerEmail: z.string().email('Geçerli bir e-posta adresi giriniz'),
  customerName: z.string().min(1, 'Müşteri adı gereklidir'),
  customerPhone: z.string().min(1, 'Telefon numarası gereklidir')
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== MOCK PAYMENT API CALLED ===')

    // Authorization kontrolü
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme gerekli' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = verifyToken(token)
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Mock payment request body:', body)
    console.log('Body amount type:', typeof body.amount)
    console.log('Body amount value:', body.amount)

    // Form verilerini doğrula
    let validatedData
    try {
      validatedData = paymentRequestSchema.parse(body)
    } catch (validationError) {
      console.error('Validation error:', validationError)
      console.error('Validation error details:', validationError instanceof z.ZodError ? validationError.issues : 'Bilinmeyen hata')
      return NextResponse.json({
        error: 'Geçersiz veri formatı',
        details: validationError instanceof z.ZodError ? validationError.issues : 'Bilinmeyen hata'
      }, { status: 400 })
    }

    // Siparişi kontrol et
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }

    // Siparişin kullanıcıya ait olduğunu kontrol et
    if (order.userId !== decodedToken.userId) {
      return NextResponse.json(
        { error: 'Bu siparişe erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    // Sipariş durumunu kontrol et
    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Bu sipariş zaten ödenmiş' },
        { status: 400 }
      )
    }

    // Mock ödeme isteği oluştur
    const paymentRequest = {
      amount: validatedData.amount,
      orderId: validatedData.orderId,
      orderNumber: order.orderNumber,
      customerEmail: validatedData.customerEmail,
      customerName: validatedData.customerName,
      customerPhone: validatedData.customerPhone,
      successUrl: `${process.env.NEXTAUTH_URL}/payment/success?orderId=${validatedData.orderId}`,
      failUrl: `${process.env.NEXTAUTH_URL}/payment/fail?orderId=${validatedData.orderId}`
    }

    const paymentResponse = await mockPaymentService.createPaymentRequest(paymentRequest)

    if (paymentResponse.success && paymentResponse.redirectUrl) {
      // Sipariş durumunu güncelle
      await prisma.order.update({
        where: { id: validatedData.orderId },
        data: {
          paymentStatus: 'PENDING',
          notes: 'Mock ödeme sayfasına yönlendirildi'
        }
      })

      return NextResponse.json({
        success: true,
        redirectUrl: paymentResponse.redirectUrl,
        transactionId: paymentResponse.transactionId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: paymentResponse.error || 'Mock ödeme işlemi başlatılamadı'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Mock payment error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Geçersiz veri formatı',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Mock ödeme işlemi sırasında bir hata oluştu'
    }, { status: 500 })
  }
}
