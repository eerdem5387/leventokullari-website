import crypto from 'crypto'
import { prisma } from './prisma'

interface ZiraatPaymentSettings {
  merchantId: string
  storeKey: string
  posUrl: string // API endpoint URL
  storeType: string
  testMode: boolean
}

interface PaymentRequest {
  amount: number
  orderId: string
  orderNumber?: string
  successUrl: string
  failUrl: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
}

interface PaymentResponse {
  success: boolean
  redirectUrl?: string // Banka formunun post edileceği URL
  formParams?: Record<string, string> // Bankaya post edilecek parametreler
  transactionId?: string
  error?: string
}

class ZiraatPaymentService {
  private settings: ZiraatPaymentSettings | null = null

  /**
   * Veritabanından ayarları çeker ve servisi başlatır.
   */
  async initialize(): Promise<boolean> {
    try {
      // Veritabanında ayarlar 'payment.ziraatClientId' gibi saklanıyor.
      // 'payment' kategorisindeki tüm ayarları çekelim.
      const paymentSettings = await prisma.settings.findMany({
        where: {
          category: 'payment',
          key: {
            startsWith: 'payment.ziraat' // payment.ziraatClientId, payment.ziraatStoreKey vb.
          }
        }
      })

      if (paymentSettings.length === 0) {
        console.warn('Ziraat Bankası ayarları veritabanında bulunamadı')
        return false
      }

      const settings: any = {
        testMode: false,
        storeType: '3d_pay_hosting' // Varsayılan
      }

      // Key Mapping: DB Key -> Internal Settings Key
      paymentSettings.forEach(setting => {
        const dbKey = setting.key // Örn: payment.ziraatClientId
        
        if (dbKey === 'payment.ziraatClientId') settings.merchantId = setting.value
        if (dbKey === 'payment.ziraatStoreKey') settings.storeKey = setting.value
        // 3D Ödeme için kullanılacak URL, API URL DEĞİL!
        // Öncelik: ziraat3dUrl (est3Dgate). Eğer bu yoksa, eski konfig'e uyum için ziraatApiUrl'i fallback olarak kullanıyoruz.
        if (dbKey === 'payment.ziraat3dUrl') settings.posUrl = setting.value
        if (!settings.posUrl && dbKey === 'payment.ziraatApiUrl') settings.posUrl = setting.value
        if (dbKey === 'payment.ziraatStoreType') settings.storeType = setting.value
        if (dbKey === 'payment.ziraatTestMode') settings.testMode = setting.value === 'true'
        // Eski formata göre de kontrol (payment.ziraat.merchantId gibi)
        if (dbKey.split('.').length === 3) {
            const subKey = dbKey.split('.')[2]
            if (subKey === 'merchantId') settings.merchantId = setting.value
            if (subKey === 'storeKey') settings.storeKey = setting.value
            if (subKey === 'posUrl') settings.posUrl = setting.value
            if (subKey === 'storeType') settings.storeType = setting.value
            if (subKey === 'testMode') settings.testMode = setting.value === 'true'
        }
      })

      // Gerekli alan kontrolü
      if (!settings.merchantId || !settings.storeKey || !settings.posUrl) {
        console.warn('Ziraat Bankası kritik ayarları eksik:', {
            hasMerchantId: !!settings.merchantId,
            hasStoreKey: !!settings.storeKey,
            hasPosUrl: !!settings.posUrl
        })
        return false
      }

      this.settings = {
        merchantId: settings.merchantId,
        storeKey: settings.storeKey,
        posUrl: settings.posUrl,
        storeType: settings.storeType,
        testMode: settings.testMode
      }

      return true
    } catch (error) {
      console.error('Ziraat servisi başlatılamadı:', error)
      return false
    }
  }

  /**
   * Ziraat v3 (3D Pay Hosting) hash oluşturma algoritması.
   * 1. Parametre anahtarlarını case-insensitive sırala.
   * 2. Değerlerdeki | ve \ karakterlerini escape et.
   * 3. Değerleri | ile birleştir.
   * 4. Sona escape edilmiş storeKey ekle.
   * 5. SHA512 hash al ve Base64'e çevir.
   */
  private createHash(params: Record<string, string>): string {
    if (!this.settings) throw new Error('Servis başlatılmadı')

    // Hash ve encoding parametrelerini hariç tut
    const keys = Object.keys(params).filter(k => {
        const lk = k.toLowerCase()
        return lk !== "hash" && lk !== "encoding"
    }).sort((a, b) => {
        // Case-insensitive sıralama
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        if (aLower !== bLower) return aLower.localeCompare(bLower, undefined, { numeric: true, sensitivity: "base" })
        return 0
    })

    // Değerleri escape et ve birleştir
    const escapedJoin = keys.map(k => {
        const v = String(params[k] ?? "")
        return v.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")
    }).join("|") + "|" + this.settings.storeKey.replace(/\\/g, "\\\\").replace(/\|/g, "\\|")

    // SHA512 -> Base64
    const sha512hex = crypto.createHash("sha512").update(escapedJoin, "utf8").digest("hex")
    return Buffer.from(sha512hex, "hex").toString("base64")
  }

  /**
   * Ödeme isteği oluşturur ve bankaya gönderilecek form verilerini hazırlar.
   */
  async createPaymentRequest(data: PaymentRequest): Promise<PaymentResponse> {
    if (!this.settings) {
        const init = await this.initialize()
        if (!init) return { success: false, error: 'Ödeme sistemi yapılandırılamadı (Ayarlar eksik)' }
    }

    try {
        const rnd = String(Date.now())
        const amountStr = data.amount.toFixed(2) // 100.00 formatı
        
        // Temel parametreler. Taksit seçimi Ziraat ödeme sayfasında müşteri tarafından yapılır; instalment parametresi gönderilmiyor.
        const baseParams: Record<string, string> = {
            clientid: this.settings!.merchantId,
            storetype: this.settings!.storeType,
            hashAlgorithm: "ver3",
            oid: data.orderId,
            amount: amountStr,
            currency: "949", // TRY
            TranType: "Auth",
            rnd: rnd,
            okurl: data.successUrl,
            failUrl: data.failUrl,
            callbackUrl: data.successUrl, // Callback URL
            lang: "tr",
            encoding: "utf-8"
        }

        // Hash hesapla
        const hash = this.createHash(baseParams)
        
        // Final parametreler
        const finalParams = {
            ...baseParams,
            hash: hash, // Küçük harf hash parametresi (bazı entegrasyonlarda HASH olarak da istenebilir, burada her ikisi de denenebilir ama v3 genelde hash ister)
            HASH: hash  // Güvenlik için her ikisini de gönderiyoruz
        }

        // Banka URL'i
        const actionUrl = this.settings!.posUrl.startsWith("http") 
            ? this.settings!.posUrl 
            : `https://${this.settings!.posUrl}`

        return {
            success: true,
            redirectUrl: actionUrl, // Frontend bu URL'e POST yapacak
            formParams: finalParams
        }

    } catch (error) {
        console.error('Ödeme isteği hatası:', error)
        return { success: false, error: 'Ödeme isteği oluşturulurken hata oluştu' }
    }
  }

  /**
   * Hata kodlarına göre detaylı hata mesajı döndürür
   */
  private getDetailedErrorMessage(procReturnCode: string, errMsg: string): string | null {
    // Ziraat Sanal Pos hata kodları ve açıklamaları
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

    // Hata koduna göre mesaj döndür
    if (errorCodeMap[procReturnCode]) {
      return errorCodeMap[procReturnCode]
    }

    // Eğer kod yoksa ama ErrMsg varsa onu döndür
    if (errMsg && errMsg.trim() !== '') {
      return errMsg
    }

    return null
  }

  /**
   * Bankadan dönen callback isteğini doğrular.
   */
  async verifyCallback(data: Record<string, any>): Promise<{ success: boolean; error?: string; errorCode?: string; rawError?: string }> {
    if (!this.settings) {
        await this.initialize()
    }

    try {
        // Gelen verideki hash
        const incomingHash = (data["HASH"] || data["hash"] || "").toString()
        
        if (!incomingHash) {
            return { success: false, error: 'Hash bilgisi bulunamadı' }
        }

        // Hash doğrulama için veriyi hazırla (Gelen parametrelerle aynı algoritmayı çalıştır)
        const verifyParams: Record<string, string> = {}
        Object.keys(data).forEach(k => {
            verifyParams[k] = String(data[k])
        })

        const calculatedHash = this.createHash(verifyParams)

        if (calculatedHash !== incomingHash) {
            console.error('Hash uyuşmazlığı:', { incoming: incomingHash, calculated: calculatedHash })
            return { success: false, error: 'Güvenlik doğrulaması başarısız (Hash mismatch)' }
        }

        // İşlem sonucu kontrolü
        const mdStatus = data["mdStatus"] || data["MdStatus"]
        const response = data["Response"] || data["response"] || ""

        // mdStatus 1: Tam doğrulama, 2,3,4: Kart saklama vs. (Genelde 1 beklenir)
        // Response: Approved olmalı
        if (mdStatus === "1" && response.toLowerCase() === "approved") {
            return { success: true }
        }

        // Ziraat API'sinden gelen hata bilgilerini topla
        const procReturnCode = data["ProcReturnCode"] || data["procReturnCode"] || ''
        const responseCode = data["ResponseCode"] || data["responseCode"] || ''
        const errMsg = data["ErrMsg"] || data["errmsg"] || ''
        
        // Hata kodlarına göre detaylı mesaj oluştur
        let errorMessage = errMsg || 'İşlem banka tarafından reddedildi'
        
        // ProcReturnCode'a göre daha detaylı açıklama ekle
        if (procReturnCode) {
            const detailedMessage = this.getDetailedErrorMessage(procReturnCode, errMsg)
            if (detailedMessage) {
                errorMessage = detailedMessage
            }
        }
        
        // ResponseCode varsa ekle
        if (responseCode && responseCode !== procReturnCode) {
            errorMessage += ` (Kod: ${responseCode})`
        }

        return { 
            success: false, 
            error: errorMessage,
            errorCode: procReturnCode || responseCode || null,
            rawError: errMsg || null
        }

    } catch (error) {
        console.error('Callback doğrulama hatası:', error)
        return { success: false, error: 'Doğrulama sırasında hata oluştu' }
    }
  }
}

export const ziraatPaymentService = new ZiraatPaymentService()
