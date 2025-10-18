'use client'

import { useState } from 'react'
import { Bell, User, LogOut, Settings } from 'lucide-react'

export default function AdminHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl border-b px-6 py-4 z-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-200">E-Mağaza Yönetim Paneli</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button 
            onClick={() => {
              // Bildirimler dropdown'ı burada açılacak
              alert('Bildirimler:\n• 3 yeni sipariş\n• 2 stok uyarısı\n• 1 yeni müşteri kaydı')
            }}
            className="relative p-3 text-white hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 p-3 text-white hover:text-gray-200 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-medium">Admin</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                <a
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </a>
                <a
                  href="/admin/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </a>
                <hr className="my-2" />
                <button 
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    window.location.href = '/login'
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 