'use client'

import { useState } from 'react'
import { safeLocalStorage, safeWindow, isClient } from '@/lib/browser-utils'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    price: number
    images?: string[]
  }
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const addToCart = () => {
    if (!isClient) return
    
    setIsLoading(true)
    
    try {
      // Mevcut sepeti al (localStorage kullan)
      const existingCart = safeLocalStorage.getItem('cart')
      let cart: any = { items: [] }
      
      if (existingCart) {
        try {
          cart = JSON.parse(existingCart)
          // Eski format kontrolü (array ise yeni formata çevir)
          if (Array.isArray(cart)) {
            cart = { items: cart }
          }
          if (!cart.items) {
            cart.items = []
          }
        } catch (e) {
          cart = { items: [] }
        }
      }
      
      // Ürünü sepete ekle
      const existingItem = cart.items.find((item: any) => item.id === product.id)
      
      if (existingItem) {
        // Ürün zaten sepette varsa miktarını artır
        existingItem.quantity += 1
      } else {
        // Yeni ürün ekle
        const cartItem: any = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: 999
        }
        
        // Resim varsa ekle
        if (product.images && product.images.length > 0) {
          cartItem.image = product.images[0]
        }
        
        cart.items.push(cartItem)
      }
      
      // Sepeti localStorage'a kaydet
      try {
        safeLocalStorage.setItem('cart', JSON.stringify(cart))
      } catch (storageError) {
        console.warn('Storage quota exceeded, clearing old cart data')
        safeLocalStorage.removeItem('cart')
        
        try {
          safeLocalStorage.setItem('cart', JSON.stringify(cart))
        } catch (finalError) {
          console.error('Final storage error:', finalError)
          alert('Sepet verileri çok büyük. Lütfen sepetinizi temizleyip tekrar deneyin.')
          return
        }
      }
      
      // Custom event tetikle
      safeWindow.dispatchEvent(new Event('cartUpdated'))
      
      // Başarı mesajı göster
      alert('Ürün sepete eklendi!')
      
    } catch (error) {
      console.error('Sepete ekleme hatası:', error)
      alert('Sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      onClick={addToCart}
      disabled={isLoading}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
    </button>
  )
} 