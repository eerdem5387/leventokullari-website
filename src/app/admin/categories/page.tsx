'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
  isPopular: boolean
  createdAt: string
  _count: {
    products: number
  }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Token'ı localStorage'dan al
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          setCategories([])
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setCategories(data)
          } else {
            console.error('API returned non-array data:', data)
            setCategories([])
          }
        } else {
          console.error('Failed to fetch categories:', response.status)
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setCategories(categories.filter(c => c.id !== categoryId))
          alert('Kategori başarıyla silindi')
        } else {
          const error = await response.json()
          alert(error.message || 'Kategori silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Kategori silinirken bir hata oluştu')
      }
    }
  }

  const handleTogglePopular = async (categoryId: string, currentPopular: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/categories/${categoryId}/popular`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPopular: !currentPopular })
      })

      if (response.ok) {
        const { message } = await response.json()
        setCategories(categories.map(c => 
          c.id === categoryId ? { ...c, isPopular: !currentPopular } : c
        ))
        alert(message)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Kategori güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error updating category popular status:', error)
      alert('Kategori güncellenirken bir hata oluştu')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kategoriler</h1>
          <p className="text-sm sm:text-base text-gray-600">Ürün kategorilerini yönetin</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Kategori Ekle
        </Link>
      </div>

      {/* Categories Table - Desktop */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ürün Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Popüler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category._count.products}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePopular(category.id, category.isPopular)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          category.isPopular
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        title={category.isPopular ? 'Popüler olmaktan çıkar' : 'Popüler yap'}
                      >
                        {category.isPopular ? 'Popüler' : 'Popüler Yap'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/categories/${category.slug}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/categories/${category.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Henüz kategori bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories Card View - Mobile */}
      <div className="lg:hidden space-y-3">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{category.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{category.slug}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                  category.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {category.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-900">{category._count.products}</span> ürün
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePopular(category.id, category.isPopular)}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full transition-colors touch-manipulation min-h-[32px] ${
                    category.isPopular
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category.isPopular ? 'Popüler' : 'Popüler Yap'}
                </button>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                <Link
                  href={`/categories/${category.slug}`}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Görüntüle
                </Link>
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Link>
                <button
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  onClick={() => handleDeleteCategory(category.id)}
                  aria-label="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
            Henüz kategori bulunmuyor.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Aktif</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {categories.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Edit className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Ürün</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {categories.reduce((sum, cat) => sum + cat._count.products, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 