'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Sepetiniz Boş</h2>
            <p className="mt-2 text-gray-600">Sepetinize henüz ürün eklemediniz.</p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sepetim</h1>
          <p className="text-gray-600 mt-2">{cartItems.length} ürün</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Birim Fiyat: {item.price.toFixed(2)} ₺
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-bold text-gray-900 w-24 text-right">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sepetten Kaldır"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={clearCart}
              className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              Sepeti Temizle
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{calculateTotal().toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span className="text-green-600 font-medium">Ücretsiz</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Toplam</span>
                  <span>{calculateTotal().toFixed(2)} ₺</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Siparişi Tamamla
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <Link
                href="/products"
                className="mt-4 block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Alışverişe Devam Et
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
