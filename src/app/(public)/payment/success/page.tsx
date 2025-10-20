'use client'

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Başarılı</h1>
        <p className="text-gray-600 mb-6">Siparişiniz başarıyla oluşturuldu.</p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">Sipariş No: {orderId}</p>
        )}
        <button
          onClick={() => router.push('/products')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Ürünlere Dön
        </button>
      </div>
    </div>
  )
}


