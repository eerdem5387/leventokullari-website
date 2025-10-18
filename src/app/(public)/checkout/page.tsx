'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Truck, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
  stock: number
  variationId?: string
  variationKey?: string
}

interface Address {
  id?: string
  title: string
  firstName: string
  lastName: string
  phone: string
  city: string
  district: string
  fullAddress: string
  isDefault?: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState<Address>({
    title: 'Ev',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: ''
  })
  const [useSameAddress, setUseSameAddress] = useState(true)
  const [billingAddress, setBillingAddress] = useState<Address>({
    title: 'Ev',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      // SessionStorage'dan sepet verilerini al
      const savedCart = sessionStorage.getItem('cart')
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }

      // Kullanıcının kayıtlı adreslerini getir
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('/api/users/addresses', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const addresses = await response.json()
            console.log('Fetched addresses:', addresses)
            setSavedAddresses(addresses)
            
            // Varsayılan adresi seç
            const defaultAddress = addresses.find((addr: Address) => addr.isDefault)
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id || '')
              setShippingAddress({
                title: defaultAddress.title,
                firstName: defaultAddress.firstName,
                lastName: defaultAddress.lastName,
                phone: defaultAddress.phone,
                city: defaultAddress.city,
                district: defaultAddress.district,
                fullAddress: defaultAddress.fullAddress
              })
            }
          }
        } catch (error) {
          console.error('Error fetching addresses:', error)
        }
      }
      
      setIsLoading(false)
    }

    fetchData()
  }, []) // Boş dependency array - sadece component mount olduğunda çalışır

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 500 ? 0 : 29.99
  const total = subtotal + shipping

  const handleAddressSelect = (address: Address) => {
    setSelectedAddressId(address.id || '')
    setShippingAddress({
      title: address.title,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      fullAddress: address.fullAddress
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login?redirect=/checkout')
        return
      }

      const orderData = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          variationId: item.variationId
        })),
        shippingAddress,
        billingAddress: useSameAddress ? undefined : billingAddress,
        notes
      }

      console.log('Sending order data:', orderData)
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error data:', errorData)
        throw new Error(errorData.error || 'Sipariş oluşturulurken bir hata oluştu')
      }

      const order = await response.json()
      
      // Ödeme sayfasına yönlendir (sepet verilerini henüz silme)
      router.push(`/payment/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Sipariş oluşturulurken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
            <p className="text-gray-600 mb-8">
              Ödeme yapmak için sepetinizde ürün bulunması gerekiyor.
            </p>
            <button
              onClick={() => router.push('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Alışverişe Başla
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sepete Geri Dön
            </button>
          </div>
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Teslimat Bilgileri</span>
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Ödeme</span>
            </div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Onay</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Teslimat Adresi
                </h2>

                {/* Kayıtlı Adresler */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Kayıtlı Adresleriniz</h3>
                    <div className="space-y-2">
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === address.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{address.title}</p>
                              <p className="text-sm text-gray-600">
                                {address.firstName} {address.lastName} - {address.phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.fullAddress}, {address.district}, {address.city}
                              </p>
                            </div>
                            {address.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Varsayılan
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres Başlığı
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.title}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.firstName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Soyad
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.lastName}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İlçe
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.district}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, district: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tam Adres
                    </label>
                    <textarea
                      value={shippingAddress.fullAddress}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, fullAddress: e.target.value }))}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Fatura Adresi
                  </h2>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useSameAddress}
                      onChange={(e) => setUseSameAddress(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Teslimat adresi ile aynı</span>
                  </label>
                </div>
                
                {!useSameAddress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Billing address fields - same as shipping */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres Başlığı
                      </label>
                      <input
                        type="text"
                        value={billingAddress.title}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad
                      </label>
                      <input
                        type="text"
                        value={billingAddress.firstName}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Soyad
                      </label>
                      <input
                        type="text"
                        value={billingAddress.lastName}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Şehir
                      </label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        İlçe
                      </label>
                      <input
                        type="text"
                        value={billingAddress.district}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tam Adres
                      </label>
                      <textarea
                        value={billingAddress.fullAddress}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, fullAddress: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sipariş Notları</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Siparişinizle ilgili özel notlarınızı buraya yazabilirsiniz..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">Resim</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Adet: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ara Toplam</span>
                  <span className="font-medium">₺{subtotal.toLocaleString('tr-TR')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Kargo</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Ücretsiz' : `₺${shipping.toLocaleString('tr-TR')}`}
                  </span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Toplam</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₺{total.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sipariş Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Siparişi Tamamla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 