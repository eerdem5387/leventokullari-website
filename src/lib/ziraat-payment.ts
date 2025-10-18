import crypto from 'crypto'
import { prisma } from './prisma'

interface ZiraatPaymentSettings {
  merchantId: string
  password: string
  storeKey: string
  testMode: boolean
}

interface PaymentRequest {
  amount: number
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  customerPhone: string
  successUrl: string
  failUrl: string
}

interface PaymentResponse {
  success: boolean
  redirectUrl?: string
  error?: string
  transactionId?: string
}

interface PaymentCallback {
  success: boolean
  transactionId?: string
  orderId?: string
  amount?: number
  error?: string
  responseCode?: string
  responseMessage?: string
}

class ZiraatPaymentService {
  private settings: ZiraatPaymentSettings | null = null

  async initialize(): Promise<boolean> {
    try {
      // Ziraat ayarlarını veritabanından al
      const paymentSettings = await prisma.settings.findMany({
        where: {
          category: 'payment',
          key: {
            startsWith: 'payment.ziraat'
          }
        }
      })

      if (paymentSettings.length === 0) {
        console.warn('Ziraat Bankası ayarları bulunamadı')
        return false
      }

      // Ayarları düzenle
      const settings: ZiraatPaymentSettings = {
        merchantId: '',
        password: '',
        storeKey: '',
        testMode: false
      }

      paymentSettings.forEach(setting => {
        const key = setting.key.split('.')[1] as keyof ZiraatPaymentSettings
        if (key in settings) {
          if (key === 'testMode') {
            settings[key] = setting.value === 'true'
          } else {
            settings[key] = setting.value
          }
        }
      })

      // Gerekli ayarların varlığını kontrol et
      if (!settings.merchantId || !settings.password || !settings.storeKey) {
        console.warn('Ziraat Bankası ayarları eksik')
        return false
      }

      this.settings = settings
      console.log('Ziraat Bankası servisi başarıyla başlatıldı')
      return true
    } catch (error) {
      console.error('Ziraat Bankası servisi başlatılamadı:', error)
      return false
    }
  }

  private getApiUrl(): string {
    if (!this.settings) {
      throw new Error('Ziraat Bankası ayarları yüklenmedi')
    }

    return this.settings.testMode
      ? 'https://entegrasyon.asseco-see.com.tr/fim/api' // Test URL
      : 'https://sanalpos2.ziraatbank.com.tr/fim/api' // Production URL
  }

  private createHash(data: string): string {
    if (!this.settings) {
      throw new Error('Ziraat Bankası ayarları yüklenmedi')
    }

    return crypto.createHash('sha512').update(data + this.settings.storeKey).digest('hex')
  }

  async createPaymentRequest(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!this.settings) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Ziraat Bankası servisi başlatılamadı')
        }
      }

      const amount = Math.round(paymentData.amount * 100) // Kuruş cinsinden
      const currency = '949' // TRY
      const installments = '0' // Tek çekim
      const transactionType = 'Auth' // Yetkilendirme
      const okUrl = paymentData.successUrl
      const failUrl = paymentData.failUrl
      const rnd = Date.now().toString()
      const storeType = '3d_pay' // 3D Secure
      const lang = 'tr'

      // Hash oluştur
      const hashStr = `${this.settings!.merchantId}${paymentData.orderId}${amount}${okUrl}${failUrl}${transactionType}${installments}${rnd}${this.settings!.password}`
      const hash = this.createHash(hashStr)

      // Form verileri
      const formData = new URLSearchParams({
        clientid: this.settings!.merchantId,
        amount: amount.toString(),
        oid: paymentData.orderId,
        okUrl: okUrl,
        failUrl: failUrl,
        rnd: rnd,
        currency: currency,
        islemtipi: transactionType,
        taksit: installments,
        storetype: storeType,
        lang: lang,
        hash: hash,
        email: paymentData.customerEmail,
        tel: paymentData.customerPhone,
        BillToName: paymentData.customerName,
        BillToStreet1: 'Adres bilgisi',
        BillToCity: 'Şehir',
        BillToCountry: 'TR',
        ShipToName: paymentData.customerName,
        ShipToStreet1: 'Adres bilgisi',
        ShipToCity: 'Şehir',
        ShipToCountry: 'TR'
      })

      const apiUrl = this.getApiUrl()

      // POST isteği gönder
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      const responseText = await response.text()
      console.log('Ziraat API Response:', responseText)

      // Response'u parse et
      const responseData = this.parseResponse(responseText)

      if (responseData.Response === 'Approved') {
        return {
          success: true,
          redirectUrl: responseData.redirectUrl || responseData.redirecturl,
          transactionId: responseData.TransId || responseData.transId
        }
      } else {
        return {
          success: false,
          error: responseData.ErrMsg || responseData.errMsg || 'Ödeme işlemi başarısız'
        }
      }

    } catch (error) {
      console.error('Ziraat ödeme hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ödeme işlemi başarısız'
      }
    }
  }

  async processCallback(callbackData: any): Promise<PaymentCallback> {
    try {
      if (!this.settings) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Ziraat Bankası servisi başlatılamadı')
        }
      }

      // Hash doğrulama
      const hashStr = `${callbackData.clientid}${callbackData.oid}${callbackData.authCode}${callbackData.procReturnCode}${callbackData.transId}${callbackData.eci}${callbackData.cavv}${callbackData.md}${this.settings!.password}`
      const expectedHash = this.createHash(hashStr)

      if (callbackData.hash !== expectedHash) {
        return {
          success: false,
          error: 'Hash doğrulama başarısız'
        }
      }

      // Response kodunu kontrol et
      if (callbackData.procReturnCode === '00') {
        return {
          success: true,
          transactionId: callbackData.transId,
          orderId: callbackData.oid,
          amount: parseFloat(callbackData.amount) / 100, // Kuruştan TL'ye çevir
          responseCode: callbackData.procReturnCode,
          responseMessage: 'İşlem başarılı'
        }
      } else {
        return {
          success: false,
          error: callbackData.errMsg || 'İşlem başarısız',
          responseCode: callbackData.procReturnCode,
          responseMessage: callbackData.errMsg
        }
      }

    } catch (error) {
      console.error('Ziraat callback hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Callback işlemi başarısız'
      }
    }
  }

  private parseResponse(responseText: string): any {
    const lines = responseText.split('\n')
    const result: any = {}

    lines.forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        result[key.trim()] = value.trim()
      }
    })

    return result
  }

  // Test ödeme oluştur
  async createTestPayment(orderId: string, amount: number): Promise<PaymentResponse> {
    const testData: PaymentRequest = {
      amount: amount,
      orderId: orderId,
      orderNumber: `TEST-${orderId}`,
      customerEmail: 'test@example.com',
      customerName: 'Test Müşteri',
      customerPhone: '5551234567',
      successUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
      failUrl: `${process.env.NEXTAUTH_URL}/payment/fail`
    }

    return this.createPaymentRequest(testData)
  }
}

export const ziraatPaymentService = new ZiraatPaymentService() 