'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react'
import Link from 'next/link'
import { safeLocalStorage, safeWindow, isClient } from '@/lib/browser-utils'

interface UserData {
  id: string
  name: string
  email: string
  phone?: string
  addresses?: Address[]
  orderCount?: number
}

interface Address {
  id: string
  title: string
  firstName: string
  lastName: string
  phone: string
  city: string
  district: string
  fullAddress: string
  isDefault: boolean
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editData, setEditData] = useState({
    name: '',
    phone: ''
  })
  
  // Adres yönetimi state'leri
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState({
    title: '',
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    district: '',
    fullAddress: '',
    isDefault: false
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isClient) {
        setIsLoading(false)
        return
      }
      
      const token = safeLocalStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        setUserData(null)
        // Token yoksa login sayfasına yönlendir
        safeWindow.location.href = '/login?redirect=/profile'
        return
      }
      
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.status === 401) {
          // Token geçersiz, localStorage'ı temizle ve login'e yönlendir
          safeLocalStorage.removeItem('token')
          safeLocalStorage.removeItem('user')
          setUserData(null)
          safeWindow.location.href = '/login?redirect=/profile'
          return
        }
        
        if (!res.ok) {
          throw new Error('Profil getirilemedi')
        }
        
        const user = await res.json()
        setUserData(user)
        setEditData({
          name: user.name || '',
          phone: user.phone || ''
        })
        safeLocalStorage.setItem('user', JSON.stringify(user))
      } catch (error) {
        console.error('Profile fetch error:', error)
        setUserData(null)
        // Hata durumunda da login'e yönlendir
        safeWindow.location.href = '/login?redirect=/profile'
      }
      setIsLoading(false)
    }
    
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token bulunamadı')
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Profil güncellenirken bir hata oluştu')
      }

      const updatedUser = await response.json()
      setUserData(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu')
    }
  }

  const handleCancel = () => {
    setEditData({
      name: userData?.name || '',
      phone: userData?.phone || ''
    })
    setIsEditing(false)
  }

  // Adres yönetimi fonksiyonları
  const handleAddAddress = () => {
    setEditingAddress(null)
    setAddressForm({
      title: '',
      firstName: '',
      lastName: '',
      phone: '',
      city: '',
      district: '',
      fullAddress: '',
      isDefault: false
    })
    setShowAddressForm(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setAddressForm({
      title: address.title,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      city: address.city,
      district: address.district,
      fullAddress: address.fullAddress,
      isDefault: address.isDefault
    })
    setShowAddressForm(true)
  }

  const handleSaveAddress = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token bulunamadı')
      }

      const response = await fetch('/api/users/addresses' + (editingAddress ? `/${editingAddress.id}` : ''), {
        method: editingAddress ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Adres kaydedilirken bir hata oluştu')
      }

      // Profili yeniden yükle
      const profileResponse = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (profileResponse.ok) {
        const updatedUser = await profileResponse.json()
        setUserData(updatedUser)
      }

      setShowAddressForm(false)
      setEditingAddress(null)
      alert(editingAddress ? 'Adres güncellendi!' : 'Adres eklendi!')
    } catch (error) {
      console.error('Error saving address:', error)
      alert(error instanceof Error ? error.message : 'Adres kaydedilirken bir hata oluştu')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token bulunamadı')
      }

      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Adres silinirken bir hata oluştu')
      }

      // Profili yeniden yükle
      const profileResponse = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (profileResponse.ok) {
        const updatedUser = await profileResponse.json()
        setUserData(updatedUser)
      }

      alert('Adres silindi!')
    } catch (error) {
      console.error('Error deleting address:', error)
      alert(error instanceof Error ? error.message : 'Adres silinirken bir hata oluştu')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profil Bilgileri</h1>
          <p className="text-gray-600 mt-2">Kişisel bilgilerinizi yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Kaydet
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      İptal
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta
                    </label>
                    <p className="text-gray-900">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.phone || '-'}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Address List */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Adreslerim</h2>
                <button 
                  onClick={handleAddAddress}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Yeni Adres Ekle
                </button>
              </div>

              {userData.addresses && userData.addresses.length > 0 ? (
                <div className="space-y-4">
                  {userData.addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{address.title}</h3>
                            {address.isDefault && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-1">{address.firstName} {address.lastName}</p>
                          <p className="text-gray-600 mb-1">{address.phone}</p>
                          <p className="text-gray-600 mb-1">{address.fullAddress}</p>
                          <p className="text-gray-600">{address.district}, {address.city}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Henüz adres eklenmemiş</p>
                  <button 
                    onClick={handleAddAddress}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    İlk Adresinizi Ekleyin
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
              
              <div className="space-y-3">
                <Link
                  href="/orders"
                  className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Siparişlerim</div>
                  <div className="text-sm text-gray-600">
                    {userData.orderCount || 0} sipariş - Geçmişinizi görüntüleyin
                  </div>
                </Link>

                <Link
                  href="/products"
                  className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Ürünler</div>
                  <div className="text-sm text-gray-600">Tüm ürünleri görüntüleyin</div>
                </Link>

                <Link
                  href="/profile"
                  className="block w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Profil Ayarları</div>
                  <div className="text-sm text-gray-600">Kişisel bilgilerinizi düzenleyin</div>
                </Link>

                <button
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    window.location.href = '/'
                  }}
                  className="block w-full text-left px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                >
                  <div className="font-medium">Çıkış Yap</div>
                  <div className="text-sm">Hesabınızdan güvenli çıkış</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adres Formu Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAddress ? 'Adres Düzenle' : 'Yeni Adres Ekle'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres Başlığı
                </label>
                <input
                  type="text"
                  value={addressForm.title}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ev, İş vb."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad
                  </label>
                  <input
                    type="text"
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad
                  </label>
                  <input
                    type="text"
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tam Adres
                </label>
                <textarea
                  value={addressForm.fullAddress}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, fullAddress: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Varsayılan adres olarak ayarla
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveAddress}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAddress ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                onClick={() => {
                  setShowAddressForm(false)
                  setEditingAddress(null)
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 