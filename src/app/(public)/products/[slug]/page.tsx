'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/products/${resolvedParams.slug}`)
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
        } else if (response.status === 404) {
          notFound()
        } else {
          setError('Ürün yüklenemedi')
        }
      } catch (err) {
        setError('Ürün yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !product || !product.isActive) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailClient product={product} />
    </div>
  )
} 