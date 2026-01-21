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
              
              // Hata koduna göre detaylı mesaj oluştur
              const getDetailedErrorMessage = (procReturnCode: string, errMsg?: string): string | null => {
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
              
              let errorMsg = gatewayData.error
              const procReturnCode = gatewayData.procReturnCode || gatewayData.ProcReturnCode
              
              // Eğer genel mesaj varsa ve hata kodu varsa, detaylı mesaj oluştur
              if (!errorMsg || errorMsg === 'İşlem banka tarafından reddedildi') {
                if (procReturnCode) {
                  const detailedMsg = getDetailedErrorMessage(procReturnCode, gatewayData.ErrMsg || gatewayData.errmsg)
                  if (detailedMsg) {
                    errorMsg = detailedMsg
                  }
                }
              }
              
              // Fallback
              if (!errorMsg || errorMsg === 'İşlem banka tarafından reddedildi') {
                errorMsg = gatewayData.ErrMsg || gatewayData.errmsg || gatewayData.error || gatewayData.Error || 'Ödeme işlemi başarısız oldu'
              }
              
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


