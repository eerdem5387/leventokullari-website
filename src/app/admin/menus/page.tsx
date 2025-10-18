'use client'

import { useState, useEffect } from 'react'
import { Menu, Plus, Edit, Trash2, Eye } from 'lucide-react'

interface MenuData {
  id: string
  name: string
  location: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  items: MenuItem[]
}

interface MenuItem {
  id: string
  title: string
  url: string
  target: string
  order: number
  isActive: boolean
  children?: MenuItem[]
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<MenuData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        const response = await fetch('/api/admin/menus', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setMenus(data)
        } else {
          throw new Error('Menüler yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching menus:', error)
        setError(error instanceof Error ? error.message : 'Menüler yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenus()
  }, [])

  const handleDeleteMenu = async (menuId: string) => {
    if (confirm('Bu menüyü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/admin/menus/${menuId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setMenus(menus.filter(m => m.id !== menuId))
          alert('Menü başarıyla silindi')
        } else {
          const error = await response.json()
          alert(error.message || 'Menü silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting menu:', error)
        alert('Menü silinirken bir hata oluştu')
      }
    }
  }

  const getLocationText = (location: string) => {
    switch (location) {
      case 'header':
        return 'Header Menü'
      case 'footer':
        return 'Footer Menü'
      case 'sidebar':
        return 'Sidebar Menü'
      default:
        return location
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menü Yönetimi</h1>
          <p className="text-gray-600">Site menülerini yönetin</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menü Yönetimi</h1>
          <p className="text-gray-600">Site menülerini yönetin</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/admin/menus/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Menü
        </button>
      </div>

      {/* Menu Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Menu className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Menü</p>
              <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Menü</p>
              <p className="text-2xl font-bold text-gray-900">{menus.filter(m => m.isActive).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Menu className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Menü Öğesi</p>
              <p className="text-2xl font-bold text-gray-900">
                {menus.reduce((sum, menu) => sum + menu.items.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menus Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Menü Listesi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menü Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğe Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{menu.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getLocationText(menu.location)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      menu.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {menu.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {menu.items.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(menu.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = `/admin/menus/${menu.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMenu(menu.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/admin/menus/new?location=header'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Header Menü Oluştur
            </button>
            <button 
              onClick={() => window.location.href = '/admin/menus/new?location=footer'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Footer Menü Oluştur
            </button>
            <button 
              onClick={() => window.location.href = '/admin/menus/new?location=sidebar'}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Sidebar Menü Oluştur
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menü İpuçları</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Header menüsü sitenin üst kısmında görünür</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Footer menüsü sitenin alt kısmında görünür</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Menü öğelerini sürükleyip bırakarak sıralayabilirsiniz</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Alt menüler oluşturmak için menü öğelerini iç içe yerleştirin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
