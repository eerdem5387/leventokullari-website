'use client'

import { useState, useEffect } from 'react'
import { FileText, Edit, Plus, Trash2, Eye } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  slug: string
  type: 'PAGE' | 'BANNER' | 'BLOG'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export default function AdminContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        // Token'ı localStorage'dan al
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        const response = await fetch('/api/content', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setContents(data)
        } else {
          throw new Error('İçerikler yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching contents:', error)
        setError(error instanceof Error ? error.message : 'İçerikler yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContents()
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900">İçerik Yönetimi</h1>
          <p className="text-gray-600">Sayfa ve banner içeriklerini yönetin</p>
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

  const handleDeleteContent = async (contentId: string) => {
    if (confirm('Bu içeriği silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/content/${contentId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setContents(contents.filter(c => c.id !== contentId))
          alert('İçerik başarıyla silindi')
        } else {
          const error = await response.json()
          alert(error.message || 'İçerik silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting content:', error)
        alert('İçerik silinirken bir hata oluştu')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Yayında'
      case 'DRAFT':
        return 'Taslak'
      case 'ARCHIVED':
        return 'Arşivlenmiş'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'PAGE':
        return 'Sayfa'
      case 'BANNER':
        return 'Banner'
      case 'BLOG':
        return 'Blog'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İçerik Yönetimi</h1>
          <p className="text-gray-600">Sayfa ve banner içeriklerini yönetin</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/admin/content/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni İçerik
        </button>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam İçerik</p>
              <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Yayında</p>
              <p className="text-2xl font-bold text-gray-900">{contents.filter(c => c.status === 'PUBLISHED').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taslak</p>
              <p className="text-2xl font-bold text-gray-900">{contents.filter(c => c.status === 'DRAFT').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">İçerik Listesi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturulma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Güncellenme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contents.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTypeText(content.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(content.status)}`}>
                      {getStatusText(content.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(content.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(content.updatedAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = `/admin/content/${content.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => window.open(`/content/${content.slug}`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContent(content.id)}
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
              onClick={() => window.location.href = '/admin/content/new?type=PAGE'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Sayfa Oluştur
            </button>
            <button 
              onClick={() => window.location.href = '/admin/content/new?type=BANNER'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Banner Yönetimi
            </button>
            <button 
              onClick={() => window.location.href = '/admin/content/new?type=BLOG'}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Blog Yazısı
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {contents.slice(0, 3).map((content) => (
              <div key={content.id} className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  content.status === 'PUBLISHED' ? 'bg-green-500' : 
                  content.status === 'DRAFT' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <span>
                  {content.title} {content.status === 'PUBLISHED' ? 'yayınlandı' : 
                  content.status === 'DRAFT' ? 'taslak olarak kaydedildi' : 'güncellendi'}
                </span>
              </div>
            ))}
            {contents.length === 0 && (
              <div className="text-sm text-gray-500">
                Henüz içerik bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 