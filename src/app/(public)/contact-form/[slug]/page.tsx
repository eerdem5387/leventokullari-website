'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, CheckCircle } from 'lucide-react'

interface ContactForm {
  id: string
  name: string
  slug: string
  description?: string
  fields: Array<{
    id: string
    type: string
    label: string
    required: boolean
    placeholder?: string
    options?: string[]
  }>
  settings: {
    submitText?: string
    successMessage?: string
    redirectUrl?: string
  }
}

export default function ContactFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const [form, setForm] = useState<ContactForm | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const resolvedParams = await params
        const response = await fetch(`/api/contact-forms/${resolvedParams.slug}`)
        
        if (response.ok) {
          const formData = await response.json()
          setForm(formData)
        } else {
          setError('Form bulunamadı')
        }
      } catch (error) {
        console.error('Error fetching form:', error)
        setError('Form yüklenirken bir hata oluştu')
      }
    }

    fetchForm()
  }, [params])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const resolvedParams = await params
      const response = await fetch(`/api/contact-forms/${resolvedParams.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: formData
        })
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({})
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Form gönderilirken bir hata oluştu')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Form gönderilirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Form yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Mail className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Hata</h1>
          <p className="text-gray-600 mb-8">{error}</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Teşekkürler!</h1>
          <p className="text-gray-600 mb-8">
            {form.settings.successMessage || 'Formunuz başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'}
          </p>
          {form.settings.redirectUrl && (
            <a
              href={form.settings.redirectUrl}
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="text-blue-600 mb-4">
              <Mail className="h-12 w-12 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {form.name}
            </h1>
            {form.description && (
              <p className="text-gray-600">
                {form.description}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'text' || field.type === 'email' || field.type === 'tel' ? (
                  <input
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {field.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map((option, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value={option}
                          checked={formData[field.id] === option}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          required={field.required}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map((option, index) => (
                      <label key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          value={option}
                          checked={formData[field.id]?.includes(option) || false}
                          onChange={(e) => {
                            const currentValues = formData[field.id] || []
                            const newValues = e.target.checked
                              ? [...currentValues, option]
                              : currentValues.filter((v: string) => v !== option)
                            handleInputChange(field.id, newValues)
                          }}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {form.settings.submitText || 'Gönder'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
