'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Star } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  slug: string
  price: number
  comparePrice?: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt?: string
  images?: string[]
  category?: {
    name: string
  }
  _count: {
    reviews: number
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt' | 'stock'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(12)
  
  // Arama ve filtreleme state'leri
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  // Toast notification gösterme fonksiyonu
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        // Token'ı localStorage'dan al
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Yetkilendirme gerekli')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/products?admin=true', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Products data received:', data)
          // API'den gelen veriyi kontrol et
          if (Array.isArray(data)) {
            setProducts(data)
          } else {
            console.error('API returned non-array data:', data)
            setProducts([])
            setError('API\'den beklenmeyen veri formatı alındı')
          }
        } else {
          console.error('Failed to fetch products:', response.status)
          setProducts([])
          setError('Ürünler yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
        setError('Ürünler yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    refreshProducts()

    // Yeni ürün eklendiğinde sayfayı yenile
    const handleProductUpdate = () => {
      refreshProducts()
    }

    // Event listener ekle
    window.addEventListener('productUpdated', handleProductUpdate)

    // Cleanup
    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate)
    }
  }, [])

  // Ürün listesini yenileme fonksiyonu
  const refreshProducts = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Yetkilendirme gerekli')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/products?admin=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
              if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setProducts(data)
          } else {
            console.error('API returned non-array data:', data)
            setProducts([])
            setError('API\'den beklenmeyen veri formatı alındı')
          }
        } else {
          console.error('API error:', response.status)
          setProducts([])
          setError('Ürünler yüklenirken bir hata oluştu')
        }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setError('Ürünler yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Global olarak refresh fonksiyonunu erişilebilir yap
  useEffect(() => {
    ;(window as any).refreshAdminProducts = refreshProducts
  }, [])

  // Filtreleme ve arama fonksiyonu
  useEffect(() => {
    let filtered = [...products]

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Kategori filtresi
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.name === categoryFilter)
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(product => product.isActive)
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(product => !product.isActive)
      } else if (statusFilter === 'featured') {
        filtered = filtered.filter(product => product.isFeatured)
      }
    }

    // Stok filtresi
    if (stockFilter !== 'all') {
      if (stockFilter === 'inStock') {
        filtered = filtered.filter(product => product.stock > 0)
      } else if (stockFilter === 'outOfStock') {
        filtered = filtered.filter(product => product.stock === 0)
      } else if (stockFilter === 'lowStock') {
        filtered = filtered.filter(product => product.stock > 0 && product.stock < 10)
      }
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'stock':
          aValue = a.stock
          bValue = b.stock
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || '').getTime()
          bValue = new Date(b.createdAt || '').getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })


    
    setFilteredProducts(filtered)
    
    // Filtreleme yapıldığında ilk sayfaya dön, ama sadece filtre değiştiğinde
    const hasFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all'
    if (hasFilters) {
      setCurrentPage(1)
    }
  }, [products, searchTerm, categoryFilter, statusFilter, stockFilter, sortBy, sortOrder])

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  
  // Eğer mevcut sayfa, toplam sayfa sayısından büyükse son sayfaya git
  const adjustedCurrentPage = Math.min(currentPage, totalPages || 1)
  
  const indexOfLastProduct = adjustedCurrentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  






  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Sayfa numarasını otomatik düzelt
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Benzersiz kategorileri al
  const uniqueCategories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          showNotification('error', 'Yetkilendirme gerekli')
          return
        }

        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setProducts(products.filter(p => p.id !== productId))
          showNotification('success', 'Ürün başarıyla silindi')
        } else {
          const errorData = await response.json()
          showNotification('error', errorData.error || 'Ürün silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        showNotification('error', 'Ürün silinirken bir hata oluştu')
      }
    }
  }

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showNotification('error', 'Yetkilendirme gerekli')
        return
      }

      const response = await fetch(`/api/products/${productId}/feature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: !currentFeatured })
      })

      if (response.ok) {
        const { message } = await response.json()
        setProducts(products.map(p => 
          p.id === productId ? { ...p, isFeatured: !currentFeatured } : p
        ))
        showNotification('success', message)
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Ürün güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error updating product featured status:', error)
      showNotification('error', 'Ürün güncellenirken bir hata oluştu')
    }
  }

  // Aktif/Pasif durumu değiştirme fonksiyonu
  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showNotification('error', 'Yetkilendirme gerekli')
        return
      }

      const response = await fetch(`/api/products/${productId}/active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, isActive: !currentActive } : p
        ))
        showNotification('success', currentActive ? 'Ürün pasif duruma alındı' : 'Ürün aktif duruma alındı')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'İşlem sırasında bir hata oluştu')
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      showNotification('error', 'İşlem sırasında bir hata oluştu')
    }
  }

  // Sıralama değiştirme fonksiyonu
  const handleSortOrderChange = async (productId: string, newSortOrder: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showNotification('error', 'Yetkilendirme gerekli')
        return
      }

      const response = await fetch(`/api/products/${productId}/sort-order`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sortOrder: newSortOrder })
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, sortOrder: newSortOrder } : p
        ))
        showNotification('success', 'Ürün sıralaması güncellendi')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Sıralama güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error updating product sort order:', error)
      showNotification('error', 'Sıralama güncellenirken bir hata oluştu')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
            <p className="text-gray-600">Tüm ürünleri yönetin</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Hata</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Tüm ürünleri yönetin</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün Ekle
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Arama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı, SKU veya kategori..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Kategori Filtresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
              <option value="featured">Öne Çıkan</option>
            </select>
          </div>

          {/* Stok Filtresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Stoklar</option>
              <option value="inStock">Stokta Var</option>
              <option value="outOfStock">Tükendi</option>
              <option value="lowStock">Düşük Stok</option>
            </select>
          </div>

          {/* Sıralama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-')
                setSortBy(newSortBy as 'name' | 'price' | 'createdAt' | 'stock')
                setSortOrder(newSortOrder as 'asc' | 'desc')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt-desc">En Yeni</option>
              <option value="createdAt-asc">En Eski</option>
              <option value="name-asc">İsim A-Z</option>
              <option value="name-desc">İsim Z-A</option>
              <option value="price-asc">Fiyat Düşük-Yüksek</option>
              <option value="price-desc">Fiyat Yüksek-Düşük</option>
              <option value="stock-asc">Stok Az-Çok</option>
              <option value="stock-desc">Stok Çok-Az</option>
            </select>
          </div>
        </div>

        {/* Filtreleri Temizle */}
        {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setStatusFilter('all')
                setStockFilter('all')
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sıra
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öne Çıkan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts && currentProducts.length > 0 ? (
                currentProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50" style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={product.sortOrder}
                          onChange={(e) => handleSortOrderChange(product.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                        <span className="text-xs text-gray-500">#</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={product.images[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">Resim</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {product.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₺{Number(product.price).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock === -1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Sınırsız
                        </span>
                      ) : (
                        <span className={product.stock === 0 ? 'text-red-600 font-semibold' : product.stock < 10 ? 'text-orange-600 font-semibold' : ''}>
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
                          product.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title={product.isActive ? 'Pasif duruma al' : 'Aktif duruma al'}
                      >
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          product.isFeatured
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        title={product.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                      >
                        <Star className={`h-3 w-3 mr-1 ${product.isFeatured ? 'fill-current' : ''}`} />
                        {product.isFeatured ? 'Öne Çıkan' : 'Öne Çıkar'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Henüz ürün bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{indexOfFirstProduct + 1}</span>
              {' - '}
              <span className="font-medium">
                {Math.min(indexOfLastProduct, filteredProducts.length)}
              </span>
              {' / '}
              <span className="font-medium">{filteredProducts.length}</span>
              {' ürün gösteriliyor'}
            </div>
            
            <div className="flex space-x-2">
              {/* Önceki Sayfa */}
              <button
                onClick={() => handlePageChange(adjustedCurrentPage - 1)}
                disabled={adjustedCurrentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  adjustedCurrentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Önceki
              </button>

              {/* Sayfa Numaraları */}
              {(() => {
                const pages = []
                const maxVisiblePages = 5
                
                if (totalPages <= maxVisiblePages) {
                  // Tüm sayfaları göster
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Akıllı sayfa gösterimi
                  if (adjustedCurrentPage <= 3) {
                    // İlk sayfalardayız
                    for (let i = 1; i <= 4; i++) {
                      pages.push(i)
                    }
                    pages.push('...')
                    pages.push(totalPages)
                  } else if (adjustedCurrentPage >= totalPages - 2) {
                    // Son sayfalardayız
                    pages.push(1)
                    pages.push('...')
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Ortadaki sayfalardayız
                    pages.push(1)
                    pages.push('...')
                    for (let i = adjustedCurrentPage - 1; i <= adjustedCurrentPage + 1; i++) {
                      pages.push(i)
                    }
                    pages.push('...')
                    pages.push(totalPages)
                  }
                }
                
                return pages.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                    disabled={typeof page !== 'number'}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      typeof page === 'number' && adjustedCurrentPage === page
                        ? 'bg-blue-600 text-white'
                        : typeof page === 'number'
                        ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        : 'bg-white text-gray-400 border border-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {page}
                  </button>
                ))
              })()}

              {/* Sonraki Sayfa */}
              <button
                onClick={() => handlePageChange(adjustedCurrentPage + 1)}
                disabled={adjustedCurrentPage === totalPages}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  adjustedCurrentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Sonraki
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplam Ürün Sayısı */}
      <div className="text-center text-sm text-gray-600">
        Toplam {filteredProducts.length} ürün bulundu
        {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all' ? (
          <span className="text-blue-600"> (filtrelenmiş sonuçlar)</span>
        ) : null}
      </div>
    </div>
  )
} 