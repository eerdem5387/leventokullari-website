'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')
  const error = searchParams.get('error')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Eğer orderId varsa, payment bilgisini çek ve hata mesajını göster
    if (orderId) {
      fetchPaymentError()
    }
  }, [orderId])

  const fetchPaymentError = async () => {
    if (!orderId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const order = await response.json()
        if (order.payments && order.payments.length > 0) {
          const failedPayment = order.payments.find((p: any) => p.status === 'FAILED')
          if (failedPayment?.gatewayResponse) {
            try {
              const gatewayData = JSON.parse(failedPayment.gatewayResponse)
              const errorMsg = gatewayData.ErrMsg || gatewayData.errmsg || gatewayData.error || gatewayData.Error
              if (errorMsg) {
                setPaymentError(errorMsg)
              }
            } catch (e) {
              console.error('Error parsing gateway response:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching payment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarısız</h1>
          <p className="text-gray-600 mb-4">Ödeme işleminiz tamamlanamadı.</p>
        </div>

        {orderId && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Sipariş No:</p>
            <p className="text-sm font-medium text-gray-900">{orderId}</p>
          </div>
        )}

        {/* Banka hata mesajı */}
        {isLoading ? (
          <div className="mb-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : paymentError ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Reddedilme Sebebi
            </h3>
            <p className="text-red-700 text-sm">{paymentError}</p>
          </div>
        ) : error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{decodeURIComponent(error)}</p>
          </div>
        ) : null}

        <div className="flex gap-3 justify-center">
          {orderId && (
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sipariş Detayı
            </button>
          )}
          <button
            onClick={() => router.push('/products')}
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ürünlere Dön
          </button>
        </div>
      </div>
    </div>
  )
}


