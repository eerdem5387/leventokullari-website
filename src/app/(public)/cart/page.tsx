'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, CheckCircle } from 'lucide-react'
import { safeLocalStorage, safeWindow, isClient } from '@/lib/browser-utils'
import Image from 'next/image'

interface CartItem {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
  stock: number
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    if (!isClient) return

    try {
      const cartData = safeLocalStorage.getItem('cart')
      if (cartData) {
        const parsed = JSON.parse(cartData)
        const items = Array.isArray(parsed) ? parsed : (parsed.items || [])
        setCartItems(items)
      }
    } catch (error) {
      console.error('Cart load error:', error)
      setCartItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateCart = (newItems: CartItem[]) => {
    setCartItems(newItems)
    const cartData = { items: newItems }
    safeLocalStorage.setItem('cart', JSON.stringify(cartData))
    safeWindow.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    const newItems = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    updateCart(newItems)
  }

  const removeItem = (itemId: string) => {
    const newItems = cartItems.filter(item => item.id !== itemId)
    updateCart(newItems)
  }

  const clearCart = () => {
    if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
      updateCart([])
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sepetiniz Boş</h2>
            <p className="text-gray-600 mb-8">Sepetinize henüz ürün eklemediniz.</p>
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Alışverişe Başla
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sepetim</h1>
              <p className="text-gray-600 mt-1">{cartItems.length} ürün</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                        <ShoppingCart className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Birim Fiyat: <span className="font-semibold text-gray-700">{item.price.toFixed(2)} ₺</span>
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500 font-medium">Adet:</span>
                      <div className="flex items-center space-x-2 border-2 border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 rounded-l-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity <= 1}
                          title="Azalt"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="w-12 text-center font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 rounded-r-lg hover:bg-gray-100 transition-colors"
                          title="Artır"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end space-y-3">
                    <p className="text-xl font-bold text-blue-600">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border-2 border-transparent hover:border-red-200"
                      title="Sepetten Kaldır"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-semibold border-2 border-red-200 hover:border-red-300"
              >
                Sepeti Temizle
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Sipariş Özeti</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ara Toplam</span>
                  <span className="font-semibold text-gray-900">{calculateTotal().toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kargo</span>
                  <span className="text-green-600 font-semibold flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Ücretsiz
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Toplam</span>
                  <span className="text-xl font-bold text-blue-600">{calculateTotal().toFixed(2)} ₺</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                Siparişi Tamamla
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <Link
                href="/products"
                className="mt-4 block text-center text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
              >
                ← Alışverişe Devam Et
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
