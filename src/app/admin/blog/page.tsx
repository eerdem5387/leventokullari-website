'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Edit, Trash2, Eye, Tag, User } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  author: {
    name: string
  }
  category?: {
    name: string
  }
  tags: Array<{
    tag: {
      name: string
    }
  }>
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        const response = await fetch('/api/admin/blog', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        } else {
          throw new Error('Blog yazıları yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error)
        setError(error instanceof Error ? error.message : 'Blog yazıları yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleDeletePost = async (postId: string) => {
    if (confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/admin/blog/${postId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setPosts(posts.filter(p => p.id !== postId))
          alert('Blog yazısı başarıyla silindi')
        } else {
          const error = await response.json()
          alert(error.message || 'Blog yazısı silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting blog post:', error)
        alert('Blog yazısı silinirken bir hata oluştu')
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Yönetimi</h1>
          <p className="text-gray-600">Blog yazılarını yönetin</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Yönetimi</h1>
          <p className="text-gray-600">Blog yazılarını yönetin</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.href = '/admin/blog/categories'}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <Tag className="h-4 w-4 mr-2" />
            Kategoriler
          </button>
          <button 
            onClick={() => window.location.href = '/admin/blog/new'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Yazı
          </button>
        </div>
      </div>

      {/* Blog Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Yazı</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{posts.filter(p => p.status === 'PUBLISHED').length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{posts.filter(p => p.status === 'DRAFT').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bu Ay</p>
              <p className="text-2xl font-bold text-gray-900">
                {posts.filter(p => {
                  const postDate = new Date(p.createdAt)
                  const now = new Date()
                  return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Blog Yazıları</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başlık
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yazar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yayın Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    {post.excerpt && (
                      <div className="text-sm text-gray-500 mt-1">{post.excerpt}</div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {tag.tag.name}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.author.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.category?.name || 'Kategori Yok'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                      {getStatusText(post.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.publishedAt 
                      ? new Date(post.publishedAt).toLocaleDateString('tr-TR')
                      : 'Yayınlanmamış'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = `/admin/blog/${post.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
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
              onClick={() => window.location.href = '/admin/blog/new'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Blog Yazısı
            </button>
            <button 
              onClick={() => window.location.href = '/admin/blog/categories'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Kategori Yönetimi
            </button>
            <button 
              onClick={() => window.location.href = '/admin/blog/tags'}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Etiket Yönetimi
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blog İpuçları</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Blog yazılarını kategorilere ayırarak organize edebilirsiniz</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Etiketler ile yazıları daha kolay bulunabilir hale getirin</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>SEO için meta başlık ve açıklama ekleyin</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Yazıları taslak olarak kaydedip daha sonra yayınlayabilirsiniz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
