'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'

interface ProductFiltersProps {
  categories: {
    id: string
    name: string
    slug: string
  }[]
  currentCategory?: string
  currentSearch?: string
  currentMinPrice?: string
  currentMaxPrice?: string
}

export default function ProductFilters({
  categories,
  currentCategory,
  currentSearch,
  currentMinPrice,
  currentMaxPrice
}: ProductFiltersProps) {
  const [search, setSearch] = useState(currentSearch || '')
  const [minPrice, setMinPrice] = useState(currentMinPrice || '')
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || '')

  const buildQueryString = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value)
    })
    return searchParams.toString()
  }

  const handleSearch = () => {
    const params = {
      search,
      minPrice,
      maxPrice,
      category: currentCategory || ''
    }
    const queryString = buildQueryString(params)
    window.location.href = `/products?${queryString}`
  }

  const handleCategoryChange = (categorySlug: string) => {
    const params = {
      search,
      minPrice,
      maxPrice,
      category: categorySlug
    }
    const queryString = buildQueryString(params)
    window.location.href = `/products?${queryString}`
  }

  const clearFilters = () => {
    window.location.href = '/products'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        <Filter className="h-5 w-5 text-gray-400" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Arama
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Ara
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategoriler
        </label>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentCategory
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tüm Kategoriler
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentCategory === category.slug
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fiyat Aralığı
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min Fiyat</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max Fiyat</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentSearch || currentMinPrice || currentMaxPrice) && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4 mr-2" />
          Filtreleri Temizle
        </button>
      )}
    </div>
  )
} 