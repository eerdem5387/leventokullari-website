'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { use } from 'react'

interface ContentFormData {
  title: string
  slug: string
  content: string
  excerpt: string
  type: 'PAGE' | 'BANNER' | 'BLOG'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featuredImage: string
  metaTitle: string
  metaDescription: string
}

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [content, setContent] = useState<any>(null)
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    type: 'PAGE',
    status: 'DRAFT',
    featuredImage: '',
    metaTitle: '',
    metaDescription: ''
  })

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content/${id}`)
        if (response.ok) {
          const contentData = await response.json()
          setContent(contentData)
          setFormData({
            title: contentData.title,
            slug: contentData.slug,
            content: contentData.content,
            excerpt: contentData.excerpt || '',
            type: contentData.type,
            status: contentData.status,
            featuredImage: contentData.featuredImage || '',
            metaTitle: contentData.metaTitle || '',
            metaDescription: contentData.metaDescription || ''
          })
        } else {
          alert('İçerik bulunamadı')
          router.push('/admin/content')
        }
      } catch (error) {
        console.error('Error fetching content:', error)
        alert('İçerik yüklenirken bir hata oluştu')
        router.push('/admin/content')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchContent()
    }
  }, [id, router])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Başlık değiştiğinde otomatik slug oluştur
    if (name === 'title') {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: generateSlug(value)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/admin/content')
      } else {
        const error = await response.json()
        alert(error.message || 'İçerik güncellenirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error updating content:', error)
      alert('İçerik güncellenirken bir hata oluştu')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">İçerik bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/content"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İçerik Düzenle</h1>
            <p className="text-gray-600">{content.title} içeriğini düzenleyin</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? 'Düzenleme' : 'Önizleme'}
          </button>
          <button
            type="submit"
            form="content-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            <form id="content-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İçerik başlığı"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="icerik-basligi"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL'de kullanılacak kısa isim. Boş bırakırsanız otomatik oluşturulur.
                </p>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Özet
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İçerik özeti"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="İçeriğinizi buraya yazın..."
                />
              </div>
            </form>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Önizleme</h2>
              <div className="prose max-w-none">
                <h1>{formData.title}</h1>
                {formData.excerpt && <p className="text-gray-600 italic">{formData.excerpt}</p>}
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ayarlar</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik Türü
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PAGE">Sayfa</option>
                  <option value="BANNER">Banner</option>
                  <option value="BLOG">Blog</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Taslak</option>
                  <option value="PUBLISHED">Yayında</option>
                  <option value="ARCHIVED">Arşivlenmiş</option>
                </select>
              </div>

              <div>
                <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
                  Öne Çıkan Görsel
                </label>
                <input
                  type="url"
                  id="featuredImage"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Ayarları</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Başlık
                </label>
                <input
                  type="text"
                  id="metaTitle"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO başlığı"
                />
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Açıklama
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="SEO açıklaması"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 