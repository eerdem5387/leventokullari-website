'use client'

import { useState } from 'react'

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
    setIsLoading(true)
    
    try {
      // Mevcut sepeti al (sessionStorage kullan)
      const existingCart = sessionStorage.getItem('cart')
      const cart = existingCart ? JSON.parse(existingCart) : []
      
      // Ürünü sepete ekle
      const existingItem = cart.find((item: any) => item.id === product.id)
      
      if (existingItem) {
        // Ürün zaten sepette varsa miktarını artır
        existingItem.quantity += 1
      } else {
        // Yeni ürün ekle (maksimum optimize edilmiş veri)
        const cartItem: any = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: 999
        }
        
        // Sadece resim varsa ekle, yoksa ekleme
        if (product.images && product.images.length > 0) {
          // Resim URL'sini kısalt (sadece dosya adını al)
          const imageUrl = product.images[0]
          if (imageUrl && imageUrl.length < 200) { // Sadece kısa URL'leri ekle
            cartItem.image = imageUrl
          }
        }
        
        cart.push(cartItem)
      }
      
      // Sepeti sessionStorage'a kaydet
      try {
        sessionStorage.setItem('cart', JSON.stringify(cart))
      } catch (storageError) {
        // Eğer sessionStorage da doluysa, eski verileri temizle
        console.warn('Storage quota exceeded, clearing old cart data')
        sessionStorage.clear()
        
        // Tekrar dene
        try {
          sessionStorage.setItem('cart', JSON.stringify(cart))
        } catch (finalError) {
          console.error('Final storage error:', finalError)
          alert('Sepet verileri çok büyük. Lütfen sepetinizi temizleyip tekrar deneyin.')
          return
        }
      }
      
      // Custom event tetikle
      window.dispatchEvent(new Event('cartUpdated'))
      
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