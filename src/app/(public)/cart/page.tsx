'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react'

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

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // SessionStorage'dan sepet verilerini al
    const savedCart = sessionStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
    setIsLoading(false)
  }, [])

  const updateQuantity = (itemId: string, newQuantity: number) => {
    const updatedItems = cartItems.map(item => {
      // Varyasyonlu ürünler için variationKey kullan, değilse id kullan
      const itemIdentifier = item.variationKey || item.id
      if (itemIdentifier === itemId) {
        const quantity = Math.max(1, Math.min(newQuantity, item.stock || 999))
        return { ...item, quantity }
      }
      return item
    })
    setCartItems(updatedItems)
    sessionStorage.setItem('cart', JSON.stringify(updatedItems))
    
    // Header'daki sepet sayısını güncelle
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const removeItem = (itemId: string) => {
    const updatedItems = cartItems.filter(item => {
      // Varyasyonlu ürünler için variationKey kullan, değilse id kullan
      const itemIdentifier = item.variationKey || item.id
      return itemIdentifier !== itemId
    })
    setCartItems(updatedItems)
    sessionStorage.setItem('cart', JSON.stringify(updatedItems))
    
    // Header'daki sepet sayısını güncelle
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const clearCart = () => {
    if (confirm('Sepetinizi tamamen temizlemek istediğinizden emin misiniz?')) {
      setCartItems([])
      sessionStorage.removeItem('cart')
      window.dispatchEvent(new Event('cartUpdated'))
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 500 ? 0 : 29.99
  const total = subtotal + shipping

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sepet yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
            <p className="text-gray-600 mb-8">
              Alışverişe başlamak için ürünlerimize göz atın
            </p>
            <Link
              href="/products"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ürünleri Keşfet
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Alışveriş Sepeti</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sepetinizdeki Ürünler ({cartItems.length})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Sepeti Temizle
                  </button>
                </div>
                
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    // Varyasyonlu ürünler için variationKey kullan, değilse id kullan
                    const itemIdentifier = item.variationKey || item.id
                    
                    return (
                      <div key={itemIdentifier} className="flex items-center space-x-4 p-4 border rounded-lg">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-500">Resim</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-gray-600">₺{Number(item.price).toLocaleString('tr-TR')}</p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(itemIdentifier, item.quantity - 1)}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center">{Number(item.quantity)}</span>
                          <button
                            onClick={() => updateQuantity(itemIdentifier, item.quantity + 1)}
                            className="p-1 text-gray-600 hover:text-gray-900"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Total Price */}
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(itemIdentifier)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>
              
              <div className="space-y-4">
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
                
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Toplam</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₺{total.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {shipping > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    ₺{shipping.toLocaleString('tr-TR')} daha alışveriş yapın, kargo ücretsiz olsun!
                  </div>
                )}
              </div>

              <Link
                href="/checkout"
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Ödemeye Geç
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Alışverişe devam et
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 