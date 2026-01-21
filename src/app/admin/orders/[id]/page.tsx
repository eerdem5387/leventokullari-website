'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Edit, Save, X } from 'lucide-react'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: {
    name: string
    images: string[]
    sku: string
  }
  variation?: {
    id: string
    sku?: string
    price: number
    attributes: Array<{
      attributeValue: {
        value: string
        attribute: {
          name: string
        }
      }
    }>
  }
}

interface Address {
  id: string
  title: string
  firstName: string
  lastName: string
  phone: string
  city: string
  district: string
  fullAddress: string
}

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transactionId?: string
  gatewayResponse?: string
  createdAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  shippingFee: number
  discountAmount: number
  finalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
  user: {
    name: string
    email: string
  }
  items: OrderItem[]
  shippingAddress: Address
  billingAddress: Address
  payments: Payment[]
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedStatus, setEditedStatus] = useState('')
  const [editedNotes, setEditedNotes] = useState('')

  useEffect(() => {
    const fetchOrderData = async () => {
      const resolvedParams = await params
      fetchOrder(resolvedParams.id)
    }
    fetchOrderData()
  }, [params])

  const fetchOrder = async (orderId: string) => {
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Yetkilendirme gerekli')
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Sipariş bulunamadı')
      }
      const data = await response.json()
      setOrder(data)
      setEditedStatus(data.status)
      setEditedNotes(data.notes || '')
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Sipariş yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOrder = async () => {
    if (!order) return

    setIsUpdating(true)
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Yetkilendirme gerekli')
      }

      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editedStatus,
          notes: editedNotes
        })
      })

      if (!response.ok) {
        throw new Error('Sipariş güncellenirken bir hata oluştu')
      }

      const updatedOrder = await response.json()
      setOrder(updatedOrder)
      setIsEditing(false)
      alert('Sipariş başarıyla güncellendi')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Sipariş güncellenirken bir hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Beklemede'
      case 'CONFIRMED':
        return 'Onaylandı'
      case 'SHIPPED':
        return 'Kargoda'
      case 'DELIVERED':
        return 'Teslim Edildi'
      case 'CANCELLED':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5" />
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5" />
      case 'SHIPPED':
        return <Truck className="h-5 w-5" />
      case 'DELIVERED':
        return <Package className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  // Hata kodlarına göre detaylı mesaj döndürür
  const getDetailedErrorMessageFromCode = (procReturnCode: string, errMsg?: string): string | null => {
    const errorCodeMap: Record<string, string> = {
      '0005': 'İşlem onaylanmadı. Kart limiti yetersiz olabilir veya kart bloke olabilir.',
      '0012': 'Geçersiz işlem. İşlem tipi veya parametreler hatalı.',
      '0013': 'Geçersiz tutar. Tutar formatı hatalı veya limit dışında.',
      '0014': 'Geçersiz kart numarası. Kart numarası hatalı veya geçersiz.',
      '0030': 'Format hatası. Gönderilen veri formatı hatalı.',
      '0032': 'İşlem yapılamıyor. Kartın bu işlem tipine izni yok.',
      '0033': 'Hatalı kart. Kart geçersiz veya süresi dolmuş.',
      '0034': 'Dolandırıcılık şüphesi. İşlem güvenlik nedeniyle reddedildi.',
      '0035': 'Kart sahibi işlemi reddetti. 3D Secure doğrulaması başarısız.',
      '0036': 'İşlem zaman aşımına uğradı.',
      '0037': 'Banka işlemi reddetti. Kart sahibi bankası işlemi onaylamadı.',
      '0041': 'Kayıp kart. Kart kayıp olarak işaretlenmiş.',
      '0043': 'Çalıntı kart. Kart çalıntı olarak işaretlenmiş.',
      '0051': 'Yetersiz bakiye. Kart bakiyesi yetersiz.',
      '0054': 'Süresi dolmuş kart. Kartın son kullanma tarihi geçmiş.',
      '0055': 'Hatalı şifre. CVV veya şifre hatalı.',
      '0057': 'Kart sahibi işleme izin vermedi. İnternet alışverişi kapalı olabilir.',
      '0058': 'Terminal işleme izin vermedi.',
      '0061': 'Para çekme limiti aşıldı.',
      '0062': 'Kısıtlı kart. Kart belirli işlemlere kapatılmış.',
      '0065': 'Günlük işlem limiti aşıldı.',
      '0091': 'Banka veya işlem merkezi ulaşılamıyor.',
      '0092': 'Banka veya işlem merkezi yanıt vermiyor.',
      '0093': 'İşlem iptal edildi.',
      '0096': 'Banka sistemi hata verdi.',
      '0121': 'Geçersiz tutar. Minimum tutar altında.',
      '0122': 'Geçersiz tutar. Maximum tutar üstünde.',
    }

    if (errorCodeMap[procReturnCode]) {
      return errorCodeMap[procReturnCode]
    }

    if (errMsg && errMsg.trim() !== '') {
      return errMsg
    }

    return null
  }

  // Durum açıklamaları için helper fonksiyon
  const getStatusExplanation = (orderStatus: string, paymentStatus: string, payments: Payment[]) => {
    // Ödeme durumu açıklamaları
    if (paymentStatus === 'PENDING') {
      return 'Müşteri henüz ödemeyi tamamlamadı'
    }
    
    if (paymentStatus === 'FAILED') {
      // Son başarısız ödeme kaydını bul
      const failedPayment = payments.find(p => p.status === 'FAILED')
      if (failedPayment?.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(failedPayment.gatewayResponse)
          
          // Önce detaylı hata mesajını kontrol et (error field'ı)
          if (gatewayData.error && gatewayData.error !== 'İşlem banka tarafından reddedildi') {
            return gatewayData.error
          }
          
          // Hata koduna göre detaylı mesaj oluştur
          const procReturnCode = gatewayData.procReturnCode || gatewayData.ProcReturnCode
          const errMsg = gatewayData.ErrMsg || gatewayData.errmsg
          
          if (procReturnCode) {
            const detailedMessage = getDetailedErrorMessageFromCode(procReturnCode, errMsg)
            if (detailedMessage) {
              return detailedMessage
            }
          }
          
          // Fallback: Diğer hata alanlarını kontrol et
          const errorMsg = 
            errMsg ||
            gatewayData.ErrorMessage || 
            gatewayData.errorMessage ||
            gatewayData.Error ||
            gatewayData.error ||
            gatewayData.responseCode ||
            gatewayData.ResponseCode
          if (errorMsg) {
            return errorMsg
          }
        } catch (e) {
          console.error('Error parsing gateway response:', e)
        }
      }
      return 'Ödeme işlemi başarısız oldu'
    }

    // Sipariş durumu açıklamaları
    if (orderStatus === 'PENDING' && paymentStatus === 'COMPLETED') {
      return 'Ödeme tamamlandı, sipariş onay bekliyor'
    }

    if (orderStatus === 'CONFIRMED') {
      return 'Sipariş onaylandı ve hazırlanıyor'
    }

    if (orderStatus === 'SHIPPED') {
      return 'Sipariş kargoya verildi'
    }

    if (orderStatus === 'DELIVERED') {
      return 'Sipariş müşteriye teslim edildi'
    }

    if (orderStatus === 'CANCELLED') {
      return 'Sipariş iptal edildi'
    }

    return null
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sipariş Bulunamadı</h1>
          <button
            onClick={() => router.push('/admin/orders')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Siparişlere Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sipariş #{order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleUpdateOrder}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedStatus(order.status)
                    setEditedNotes(order.notes || '')
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Durumu</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durum
                    </label>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">Beklemede</option>
                      <option value="CONFIRMED">Onaylandı</option>
                      <option value="SHIPPED">Kargoda</option>
                      <option value="DELIVERED">Teslim Edildi</option>
                      <option value="CANCELLED">İptal Edildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notlar
                    </label>
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Durum:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{getStatusText(order.status)}</span>
                      </span>
                    </div>
                    {getStatusExplanation(order.status, order.paymentStatus, order.payments) && (
                      <p className="text-sm text-gray-500 mt-2 pl-1">
                        {getStatusExplanation(order.status, order.paymentStatus, order.payments)}
                      </p>
                    )}
                  </div>
                  {order.notes && (
                    <div>
                      <span className="text-gray-600">Notlar:</span>
                      <p className="mt-1 text-gray-900">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ad Soyad:</span>
                  <span className="font-medium">{order.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-posta:</span>
                  <span className="font-medium">{order.user.email}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Kalemleri</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">Resim</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                      {item.variation && item.variation.attributes && item.variation.attributes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Seçilen Özellikler:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.variation.attributes.map((attr, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {attr.attributeValue.attribute.name}: {attr.attributeValue.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ₺{Number(item.unitPrice).toLocaleString('tr-TR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Toplam: ₺{Number(item.totalPrice).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Teslimat Adresi
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                  <p className="text-gray-600">{order.shippingAddress.fullAddress}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.district}, {order.shippingAddress.city}
                  </p>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Fatura Adresi
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  <p className="text-gray-600">{order.billingAddress.phone}</p>
                  <p className="text-gray-600">{order.billingAddress.fullAddress}</p>
                  <p className="text-gray-600">
                    {order.billingAddress.district}, {order.billingAddress.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ara Toplam</span>
                  <span className="font-medium">₺{Number(order.totalAmount).toLocaleString('tr-TR')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Kargo</span>
                  <span className="font-medium">₺{Number(order.shippingFee).toLocaleString('tr-TR')}</span>
                </div>
                
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-₺{Number(order.discountAmount).toLocaleString('tr-TR')}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Toplam</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₺{Number(order.finalAmount).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-2">Ödeme Durumu</h3>
                <div className="space-y-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'COMPLETED' 
                      ? 'bg-green-100 text-green-800' 
                      : order.paymentStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus === 'COMPLETED' ? 'Ödendi' : 
                     order.paymentStatus === 'PENDING' ? 'Beklemede' : 'Başarısız'}
                  </span>
                  {order.paymentStatus === 'PENDING' && (
                    <p className="text-xs text-gray-500">
                      Müşteri henüz ödemeyi tamamlamadı
                    </p>
                  )}
                  {order.paymentStatus === 'FAILED' && (() => {
                    const failedPayment = order.payments.find(p => p.status === 'FAILED')
                    if (failedPayment?.gatewayResponse) {
                      try {
                        const gatewayData = JSON.parse(failedPayment.gatewayResponse)
                        
                        // Önce detaylı hata mesajını kontrol et
                        let errorMsg = gatewayData.error
                        const procReturnCode = gatewayData.procReturnCode || gatewayData.ProcReturnCode
                        
                        // Eğer genel mesaj varsa ve hata kodu varsa, detaylı mesaj oluştur
                        if (!errorMsg || errorMsg === 'İşlem banka tarafından reddedildi') {
                          if (procReturnCode) {
                            const detailedMsg = getDetailedErrorMessageFromCode(procReturnCode, gatewayData.ErrMsg || gatewayData.errmsg)
                            if (detailedMsg) {
                              errorMsg = detailedMsg
                            }
                          }
                        }
                        
                        // Fallback: Diğer hata alanlarını kontrol et
                        if (!errorMsg || errorMsg === 'İşlem banka tarafından reddedildi') {
                          errorMsg = 
                            gatewayData.ErrMsg || 
                            gatewayData.errmsg || 
                            gatewayData.ErrorMessage || 
                            gatewayData.errorMessage ||
                            gatewayData.Error ||
                            gatewayData.error ||
                            'Ödeme işlemi başarısız oldu'
                        }
                        
                        return (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-900 mb-1">Reddedilme Sebebi:</p>
                            <p className="text-sm text-red-700">{errorMsg}</p>
                            {procReturnCode && (
                              <p className="text-xs text-red-600 mt-1">Hata Kodu: {procReturnCode}</p>
                            )}
                          </div>
                        )
                      } catch (e) {
                        console.error('Error parsing gateway response:', e)
                      }
                    }
                    return (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">Ödeme işlemi başarısız oldu</p>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Payment History */}
              {order.payments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Ödeme Geçmişi</h3>
                  <div className="space-y-2">
                    {order.payments.map((payment) => (
                      <div key={payment.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                          <span className="font-medium">
                            ₺{Number(payment.amount).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          {payment.method === 'CREDIT_CARD' ? 'Kredi Kartı' : 'Diğer'}
                        </div>
                        {payment.transactionId && (
                          <div className="text-gray-500 text-xs">
                            ID: {payment.transactionId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 