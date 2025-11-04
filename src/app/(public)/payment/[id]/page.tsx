'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CreditCard, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  finalAmount: number
  status: string
  paymentStatus: string
  items: Array<{
    id: string
    product: {
      name: string
      images: string[]
    }
    variation?: {
      id: string
      attributes: Array<{
        attributeValue: {
          attributeId: string
          value: string
        }
      }>
    }
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvv, setCvv] = useState('')

  const provider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'mock'

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const guestEmail = localStorage.getItem('userEmail') || ''

      const url = token
        ? `/api/orders/${orderId}`
        : `/api/orders/${orderId}?guest=${encodeURIComponent(guestEmail)}`

      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Sipariş bulunamadı')
      }

      const orderData = await response.json()
      setOrder(orderData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sipariş yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

      const amount = order?.finalAmount ? parseFloat(order.finalAmount.toString()) : 0
      const paymentData = {
        orderId,
        amount: amount,
        customerEmail: localStorage.getItem('userEmail') || '',
        customerName: localStorage.getItem('userName') || '',
        customerPhone: localStorage.getItem('userPhone') || ''
      }

      const response = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(paymentData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ödeme işlemi başlatılamadı')
      }

      if (result.success && result.redirectUrl) {
        // Ziraat Bankası ödeme sayfasına yönlendir
        window.location.href = result.redirectUrl
      } else {
        throw new Error('Ödeme sayfasına yönlendirilemedi')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Ödeme işlemi sırasında bir hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const getProductDisplayName = (item: any) => {
    console.log('Processing item:', item)
    if (item.variation) {
      console.log('Item has variation:', item.variation)
      const variationDetails = item.variation.attributes.map((attr: any) => {
        console.log('Attribute:', attr)
        return `${attr.attributeValue.attributeId}: ${attr.attributeValue.value}`
      }).join(', ')
      return `${item.product.name} - ${variationDetails}`
    }
    console.log('Item has no variation')
    return item.product.name
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Hata</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sipariş Bulunamadı</h1>
            <p className="text-gray-600 mb-8">
              Aradığınız sipariş bulunamadı veya erişim izniniz yok.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/checkout')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Teslimat Bilgilerine Geri Dön
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ödeme</h1>
          <p className="text-gray-600">Sipariş #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">{provider === 'ziraat' ? 'Kredi Kartı Bilgileri' : 'Kredi Kartı Bilgileri (Test)'}</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-sm font-medium text-blue-800">{provider === 'ziraat' ? 'Ziraat Sanal POS' : 'Test Ödeme Sistemi'}</h3>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  {provider === 'ziraat' ? 'Güvenli ödeme için bankanın 3D Secure sayfasına yönlendirileceksiniz.' : 'Bu bir test ödeme akışıdır. Gerçek kart bilgisi gerektirmez.'}
                </p>
              </div>

              {/* Card inputs (for test UI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Kart Numarası</label>
                  <input value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Ad Soyad</label>
                  <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Ad Soyad" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Ay</label>
                    <input value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="12" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Yıl</label>
                    <input value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="29" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">CVV</label>
                    <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Ödeme Bilgileri</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Toplam Tutar:</span>
                    <span className="font-medium">₺{order.finalAmount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sipariş No:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    setIsProcessing(true)
                    const token = localStorage.getItem('token')
                    const payload = {
                      orderId,
                      amount: order.finalAmount ? Number(order.finalAmount) : 0,
                      customerEmail: localStorage.getItem('userEmail') || '',
                      customerName: localStorage.getItem('userName') || '',
                      customerPhone: localStorage.getItem('userPhone') || ''
                    }

                    const endpoint = provider === 'ziraat' ? '/api/payment/ziraat' : '/api/payment/mock'

                    const res = await fetch(endpoint, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify(payload)
                    })
                    const data = await res.json()
                    if (!res.ok || !data.success || !data.redirectUrl) {
                      throw new Error(data.error || 'Ödeme başlatılamadı')
                    }
                    window.location.href = data.redirectUrl
                  } catch (err: any) {
                    setError(err?.message || 'Ödeme başlatılamadı')
                  } finally {
                    setIsProcessing(false)
                  }
                }}
                disabled={isProcessing || !order || !order.finalAmount}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    {provider === 'ziraat' ? 'Ziraat ile Öde' : 'Ödemeyi Tamamla (Test)'}
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Lock className="h-4 w-4 mr-2" />
                <span>Ödeme bilgileriniz güvenli şekilde şifrelenerek işlenir.</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>
            
            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {item.product.images && item.product.images[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">Resim</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{getProductDisplayName(item)}</h3>
                    <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ₺{item.totalPrice.toLocaleString('tr-TR')}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Ara Toplam</span>
                <span className="font-medium">₺{order.totalAmount.toLocaleString('tr-TR')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Kargo</span>
                <span className="font-medium">
                  {order.finalAmount > order.totalAmount ? 
                    `₺${(order.finalAmount - order.totalAmount).toLocaleString('tr-TR')}` : 
                    'Ücretsiz'
                  }
                </span>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Toplam</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ₺{order.finalAmount.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 