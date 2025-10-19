'use client'

import { useState, useEffect } from 'react'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await searchParams
        setParams(resolvedParams)
        
        const queryParams = new URLSearchParams()
        Object.entries(resolvedParams).forEach(([key, value]) => {
          if (value) queryParams.append(key, value)
        })
        
        const response = await fetch(`/api/products?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
          setTotal(data.total || 0)
        }
        
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData || [])
        }
      } catch (error) {
        console.log('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

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

  const page = parseInt(params?.page || '1')
  const limit = 12
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600 mt-2">
            {total} ürün bulundu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <ProductFilters 
              categories={categories}
              currentCategory={params?.category}
              currentSearch={params?.search}
              currentMinPrice={params?.minPrice}
              currentMaxPrice={params?.maxPrice}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      {page > 1 && (
                        <a
                          href={`/products?${new URLSearchParams({
                            ...params,
                            page: (page - 1).toString()
                          })}`}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Önceki
                        </a>
                      )}
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <a
                          key={pageNum}
                          href={`/products?${new URLSearchParams({
                            ...params,
                            page: pageNum.toString()
                          })}`}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            pageNum === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </a>
                      ))}
                      
                      {page < totalPages && (
                        <a
                          href={`/products?${new URLSearchParams({
                            ...params,
                            page: (page + 1).toString()
                          })}`}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Sonraki
                        </a>
                      )}
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">Ürün bulunamadı</p>
                  <p className="mt-2">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 