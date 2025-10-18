'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Mail, Plus, Edit, Trash2, Eye, MessageSquare } from 'lucide-react'

interface ContactForm {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    submissions: number
  }
}

export default function AdminContactFormsPage() {
  const [forms, setForms] = useState<ContactForm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        const response = await fetch('/api/admin/contact-forms', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setForms(data)
        } else {
          throw new Error('İletişim formları yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching contact forms:', error)
        setError(error instanceof Error ? error.message : 'İletişim formları yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForms()
  }, [])

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Bu iletişim formunu silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/admin/contact-forms/${formId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setForms(forms.filter(f => f.id !== formId))
          alert('İletişim formu başarıyla silindi')
        } else {
          const error = await response.json()
          alert(error.message || 'İletişim formu silinirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error deleting contact form:', error)
        alert('İletişim formu silinirken bir hata oluştu')
      }
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
          <h1 className="text-3xl font-bold text-gray-900">İletişim Formları</h1>
          <p className="text-gray-600">İletişim formlarını yönetin</p>
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
          <h1 className="text-3xl font-bold text-gray-900">İletişim Formları</h1>
          <p className="text-gray-600">İletişim formlarını yönetin</p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/admin/contact-forms/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Form
        </button>
      </div>

      {/* Form Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Form</p>
              <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktif Form</p>
              <p className="text-2xl font-bold text-gray-900">{forms.filter(f => f.isActive).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Gönderim</p>
              <p className="text-2xl font-bold text-gray-900">
                {forms.reduce((sum, form) => sum + form._count.submissions, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ortalama Gönderim</p>
              <p className="text-2xl font-bold text-gray-900">
                {forms.length > 0 ? Math.round(forms.reduce((sum, form) => sum + form._count.submissions, 0) / forms.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Form Listesi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gönderim Sayısı
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
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{form.name}</div>
                    {form.description && (
                      <div className="text-sm text-gray-500">{form.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {form.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form._count.submissions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(form.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => window.location.href = `/admin/contact-forms/${form.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => window.location.href = `/admin/contact-forms/${form.id}/submissions`}
                        className="text-green-600 hover:text-green-900"
                        title="Gönderimleri Görüntüle"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => window.open(`/contact-form/${form.slug}`, '_blank')}
                        className="text-purple-600 hover:text-purple-900"
                        title="Formu Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteForm(form.id)}
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
              onClick={() => window.location.href = '/admin/contact-forms/new'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni İletişim Formu
            </button>
            <button 
              onClick={() => window.location.href = '/admin/contact-forms/new?template=basic'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Basit İletişim Formu
            </button>
            <button 
              onClick={() => window.location.href = '/admin/contact-forms/new?template=detailed'}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Detaylı İletişim Formu
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form İpuçları</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Form alanlarını sürükleyip bırakarak düzenleyebilirsiniz</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Form gönderimlerini e-posta ile alabilirsiniz</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Formları sayfalara kısa kod ile ekleyebilirsiniz</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span>Form gönderimlerini admin panelinden görüntüleyebilirsiniz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
