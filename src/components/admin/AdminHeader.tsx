'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Settings } from 'lucide-react'

export default function AdminHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    // Dışarıya tıklayınca dropdown'ları kapat
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.user-dropdown') && !target.closest('.user-button')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl border-b px-3 sm:px-4 lg:px-6 py-3 sm:py-4 z-20 safe-area-inset-top">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Admin Panel</h1>
          <p className="text-xs sm:text-sm text-gray-200 hidden sm:block">Levent Kolej Ürün Hizmeti Yönetim Paneli</p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* User Menu */}
          <div className="relative">
            <button
              className="user-button flex items-center space-x-1 sm:space-x-2 p-2 sm:p-3 text-white hover:text-gray-200 rounded-lg hover:bg-white/10 transition-colors touch-manipulation min-w-[44px] min-h-[44px]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Kullanıcı menüsü"
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Admin</span>
            </button>

            {isDropdownOpen && (
              <div className="user-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                <a
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 touch-manipulation min-h-[44px]"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </a>
                <a
                  href="/admin/settings"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 touch-manipulation min-h-[44px]"
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
                  className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gray-100 touch-manipulation min-h-[44px] text-left"
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