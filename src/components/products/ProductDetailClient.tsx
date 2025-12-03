'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Share2, ChevronDown } from 'lucide-react'
import { safeDocument, isClient } from '@/lib/browser-utils'
import { cartService } from '@/lib/cart-service'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/ui/Toast'

interface ProductDetailClientProps {
  product: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    comparePrice?: number
    stock: number
    sku?: string
    images: string[]
    productType: 'SIMPLE' | 'VARIABLE'
    category?: {
      name: string
    }
    variations?: Array<{
      id: string
      price: number
      stock: number
      sku?: string
      attributes: Array<{
        id: string
        variationId: string
        attributeValueId: string
        attributeValue: {
          id: string
          attributeId: string
          value: string
        }
      }>
    }>
  }
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariation, setSelectedVariation] = useState<any>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const { toasts, removeToast, success, error } = useToast()

  const handleAddToCart = () => {
    if (!isClient) return
    
    try {
      if (product.productType === 'VARIABLE' && selectedVariation) {
        // Varyasyonlu ürün için cartService kullan
        cartService.addItem(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            stock: product.stock,
            images: product.images
          },
          quantity,
          selectedVariation
        )
      } else {
        // Basit ürün için
        cartService.addItem(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            stock: product.stock,
            images: product.images
          },
          quantity
        )
      }
      
      success('Ürün sepete eklendi!')
      
    } catch (err) {
      console.error('Sepete ekleme hatası:', err)
      error('Sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    // Sınırsız stok (-1) veya normal stok kontrolü
    const maxStock = product.stock === -1 ? 999 : product.stock
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity)
    }
  }

  // Varyasyon seçimi için yardımcı fonksiyonlar
  const getAvailableAttributes = () => {
    if (!product.variations || product.variations.length === 0) {
      return {}
    }
    
    const attributes: Record<string, string[]> = {}
    product.variations.forEach((variation) => {
      variation.attributes.forEach(attr => {
        // Attribute name'i daha kullanıcı dostu hale getir
        const attributeName = getAttributeDisplayName(attr.attributeValue?.attributeId || 'Özellik')
        const attributeValue = attr.attributeValue?.value || 'Değer'
        
        if (!attributes[attributeName]) {
          attributes[attributeName] = []
        }
        if (!attributes[attributeName].includes(attributeValue)) {
          attributes[attributeName].push(attributeValue)
        }
      })
    })
    
    console.log('Available attributes:', attributes)
    return attributes
  }

  // Attribute ID'lerini kullanıcı dostu isimlere çevir
  const getAttributeDisplayName = (attributeId: string) => {
    const attributeMap: Record<string, string> = {
      'cmdpvbew6000qlaulvoazkpgu': 'Öğrenci',
      'renk': 'Renk',
      'beden': 'Beden',
      'boyut': 'Boyut',
      'model': 'Model',
      'tip': 'Tip',
      'kategori': 'Kategori'
    }
    
    return attributeMap[attributeId] || 'Özellik'
  }

  const findMatchingVariation = () => {
    if (!product.variations) return null
    
    return product.variations.find(variation => {
      return variation.attributes.every(attr => 
        selectedAttributes[attr.attributeValue.attributeId] === attr.attributeValue.value
      )
    })
  }

  const handleAttributeChange = (attributeName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    setSelectedAttributes(newAttributes)
    
    // Seçilen varyasyonu bul
    const matchingVariation = product.variations?.find(variation => {
      const matches = variation.attributes.every(attr => {
        const attributeId = attr.attributeValue.attributeId
        const attributeValue = attr.attributeValue.value
        const selectedValue = newAttributes[getAttributeDisplayName(attributeId)]
        return selectedValue === attributeValue
      })
      return matches
    })
    
    setSelectedVariation(matchingVariation || null)
  }

  const toggleDropdown = (attributeName: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [attributeName]: !prev[attributeName]
    }))
  }

  // Click outside handler for dropdowns
  useEffect(() => {
    if (!isClient) return
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setOpenDropdowns({})
      }
    }

    safeDocument.addEventListener('mousedown', handleClickOutside as any)
    return () => {
      safeDocument.removeEventListener('mousedown', handleClickOutside as any)
    }
  }, [])

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/placeholder-product.svg"
                alt="Ürün görseli yok"
                className="w-full h-full object-contain p-8 opacity-60"
              />
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.category && (
              <p className="text-lg text-gray-600">{product.category.name}</p>
            )}
          </div>

          {/* Price - Sadece basit ürünler veya varyasyon seçilmişse göster */}
          {(product.productType === 'SIMPLE' || (product.productType === 'VARIABLE' && selectedVariation)) && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-gray-900">
                  ₺{selectedVariation ? Number(selectedVariation.price).toLocaleString('tr-TR') : Number(product.price).toLocaleString('tr-TR')}
                </span>
                {product.comparePrice && !selectedVariation && product.productType === 'SIMPLE' && (
                  <span className="text-xl text-gray-500 line-through">
                    ₺{Number(product.comparePrice).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
              
              {/* Stock Info */}
              <div className="flex items-center space-x-2">
                {(() => {
                  const currentStock = selectedVariation ? selectedVariation.stock : product.stock
                  if (currentStock === -1) {
                    return (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Sınırsız Stok</span>
                      </div>
                    )
                  } else if (currentStock > 10) {
                    return (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Stokta: {currentStock} adet</span>
                      </div>
                    )
                  } else if (currentStock > 0) {
                    return (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-orange-700">Son {currentStock} adet!</span>
                      </div>
                    )
                  } else {
                    return (
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">Stokta Yok</span>
                      </div>
                    )
                  }
                })()}
              </div>
              
              {product.comparePrice && !selectedVariation && product.productType === 'SIMPLE' && (
                <div className="text-sm text-green-600">
                  {Math.round(
                    ((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100
                  )}
                  % indirim
                </div>
              )}
            </div>
          )}

          {/* Stock Status - Sadece basit ürünler veya varyasyon seçilmişse göster */}
          {(product.productType === 'SIMPLE' || (product.productType === 'VARIABLE' && selectedVariation)) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedVariation 
                    ? (selectedVariation.stock > 0 ? 'bg-green-500' : 'bg-red-500')
                    : (product.stock > 0 ? 'bg-green-500' : 'bg-red-500')
                }`}></div>
                <span className="text-sm text-gray-600">
                  {selectedVariation 
                    ? (selectedVariation.stock === -1 ? 'Stokta' : (selectedVariation.stock > 0 ? `${selectedVariation.stock} adet stokta` : 'Stokta yok'))
                    : (product.stock === -1 ? 'Stokta' : (product.stock > 0 ? `${product.stock} adet stokta` : 'Stokta yok'))
                  }
                </span>
              </div>
            </div>
          )}

            {/* Add to Cart */}
            <div className="space-y-4">
              {product.productType === 'VARIABLE' ? (
                <div className="space-y-4">
                  {/* Varyasyon Seçimi */}
                  {product.variations && product.variations.length > 0 && (
                    <div className="space-y-4">
                      {Object.entries(getAvailableAttributes()).map(([attributeName, values]) => {
                        // "Özellik" yerine "Öğrenciler" göster
                        const displayName = attributeName === 'Özellik' ? 'Öğrenciler' : attributeName
                        return (
                        <div key={attributeName} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            {displayName}:
                          </label>
                          <div className="relative dropdown-container">
                            <button
                              type="button"
                              onClick={() => toggleDropdown(attributeName)}
                              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <span className={selectedAttributes[attributeName] ? 'text-gray-900' : 'text-gray-500'}>
                                {selectedAttributes[attributeName] || 'Seçiniz'}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                                openDropdowns[attributeName] ? 'rotate-180' : ''
                              }`} />
                            </button>
                            
                            {openDropdowns[attributeName] && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {values.map((value) => (
                                  <button
                                    key={`${attributeName}-${value}`}
                                    onClick={() => {
                                      console.log('Dropdown option clicked:', attributeName, value)
                                      handleAttributeChange(attributeName, value)
                                      toggleDropdown(attributeName)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        )
                      })}
                      
                      {/* Seçilen Varyasyon Bilgileri */}
                      {selectedVariation && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                                     <div className="flex justify-between items-center">
                             <span className="text-sm font-medium text-gray-700">Seçilen Varyasyon:</span>
                             <span className="text-sm text-gray-600">
                               {selectedVariation.attributes.map((attr: any) => 
                                 `${getAttributeDisplayName(attr.attributeValue.attributeId)}: ${attr.attributeValue.value}`
                               ).join(', ')}
                             </span>
                           </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Fiyat:</span>
                            <span className="text-lg font-bold text-gray-900">
                              ₺{Number(selectedVariation.price).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Stok:</span>
                            <span className={`text-sm ${
                              selectedVariation.stock > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {selectedVariation.stock === -1 ? 'Stokta' : 
                               selectedVariation.stock > 0 ? `${selectedVariation.stock} adet` : 'Stokta yok'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Miktar Seçimi ve Sepete Ekle */}
                      {selectedVariation && (
                        <div className="flex space-x-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button 
                              className="px-3 py-2 text-gray-600 hover:text-gray-900"
                              onClick={() => handleQuantityChange(quantity - 1)}
                              disabled={quantity <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={selectedVariation.stock === -1 ? 999 : selectedVariation.stock}
                              value={quantity}
                              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                              className="w-16 text-center border-none focus:ring-0"
                            />
                            <button 
                              className="px-3 py-2 text-gray-600 hover:text-gray-900"
                              onClick={() => handleQuantityChange(quantity + 1)}
                              disabled={quantity >= (selectedVariation.stock === -1 ? 999 : selectedVariation.stock)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleAddToCart()}
                            disabled={selectedVariation.stock === 0}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Sepete Ekle
                          </button>
                        </div>
                      )}
                      
                      {/* Varyasyon Seçilmediğinde Uyarı */}
                      {!selectedVariation && (
                        <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                          Lütfen varyasyon seçeneklerini belirleyin
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button 
                      className="px-3 py-2 text-gray-600 hover:text-gray-900"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock === -1 ? 999 : product.stock}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border-none focus:ring-0"
                    />
                    <button 
                      className="px-3 py-2 text-gray-600 hover:text-gray-900"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.stock === -1 ? 999 : product.stock)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Sepete Ekle
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-1 h-8 bg-blue-600 mr-3 rounded-full"></span>
                Ürün Açıklaması
              </h2>
              <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ürün Detayları</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">SKU:</span>
                  <span className="ml-2 text-gray-900">{product.sku || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Kategori:</span>
                  <span className="ml-2 text-gray-900">{product.category?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ürün Tipi:</span>
                  <span className="ml-2 text-gray-900">
                    {product.productType === 'SIMPLE' ? 'Basit Ürün' : 'Varyasyonlu Ürün'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Toast toasts={toasts} onRemove={removeToast} />
    </>
  )
} 