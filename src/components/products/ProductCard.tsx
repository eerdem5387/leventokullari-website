'use client'

import Link from 'next/link'
import { Star, ShoppingCart, Search } from 'lucide-react'
import { safeSessionStorage, safeWindow, isClient } from '@/lib/browser-utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    stock: number
    images: string[]
    category?: {
      name: string
    }
    _count: {
      reviews: number
    }
    productType: 'SIMPLE' | 'VARIABLE'
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const handleAddToCart = () => {
    if (!isClient) return
    
    // Varyasyonlu ürünler için ürün detay sayfasına yönlendir
    if (product.productType === 'VARIABLE') {
      safeWindow.location.assign(`/products/${product.slug}`)
      return
    }

    try {
      // Mevcut sepeti al (sessionStorage kullan)
      const existingCart = safeSessionStorage.getItem('cart')
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
        safeSessionStorage.setItem('cart', JSON.stringify(cart))
      } catch (storageError) {
        // Eğer sessionStorage da doluysa, eski verileri temizle
        console.warn('Storage quota exceeded, clearing old cart data')
        safeSessionStorage.clear()
        
        // Tekrar dene
        try {
          safeSessionStorage.setItem('cart', JSON.stringify(cart))
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
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <img
              src="/placeholder-product.svg"
              alt="Ürün görseli yok"
              className="w-full h-full object-cover opacity-60"
              loading="lazy"
            />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
        </div>
      </Link>
      
      <div className="p-6">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-bold text-gray-900 mb-3 hover:text-gray-600 transition-colors text-lg leading-tight">
            {product.name}
          </h3>
        </Link>
        
        {product.category && (
          <p className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block mb-4 font-medium">
            {product.category.name}
          </p>
        )}
        
        {/* Stock Badge */}
        {product.stock !== -1 && product.stock <= 10 && product.stock > 0 && product.productType !== 'VARIABLE' && (
          <div className="mb-3">
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Son {product.stock} adet!
            </span>
          </div>
        )}
        {product.stock === 0 && product.productType !== 'VARIABLE' && (
          <div className="mb-3">
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              Stokta Yok
            </span>
          </div>
        )}
        
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2 font-medium">
            ({product._count.reviews} değerlendirme)
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            {product.productType === 'VARIABLE' ? (
              <span className="text-xl font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-lg inline-block">
                Varyasyon Seçin
              </span>
            ) : (
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  ₺{Number(product.price).toLocaleString('tr-TR')}
                </span>
                {product.comparePrice && (
                  <span className="text-sm text-gray-500 line-through bg-gray-100 px-2 py-1 rounded">
                    ₺{Number(product.comparePrice).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={`w-full px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center transform hover:scale-105 ${
              product.productType === 'VARIABLE' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg' 
                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg'
            }`}
          >
            {product.productType === 'VARIABLE' ? (
              <>
                <Search className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Varyasyon Seç</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Sepete Ekle</span>
              </>
            )}
          </button>
        </div>
        
        {product.productType === 'VARIABLE' && (
          <div className="mt-2 text-center">
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              Varyasyonlu Ürün
            </span>
          </div>
        )}
      </div>
    </div>
  )
} 