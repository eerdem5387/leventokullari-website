'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Tag,
  CreditCard,
  ExternalLink,
  Menu,
  X
} from 'lucide-react'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home
  },
  {
    name: 'Ürünler',
    href: '/admin/products',
    icon: Package
  },
  {
    name: 'Kategoriler',
    href: '/admin/categories',
    icon: Tag
  },
  {
    name: 'Müşteriler',
    href: '/admin/customers',
    icon: Users
  },
  {
    name: 'Siparişler',
    href: '/admin/orders',
    icon: ShoppingCart
  },
  {
    name: 'Ödemeler',
    href: '/admin/payments',
    icon: CreditCard
  },
  {
    name: 'Raporlar',
    href: '/admin/reports',
    icon: BarChart3
  },
  {
    name: 'Ayarlar',
    href: '/admin/settings',
    icon: Settings
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Mobile menu'yu kapat (sayfa değiştiğinde)
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Body scroll lock (mobile menu açıkken)
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-20 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Menüyü aç/kapat"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Backdrop */}
      {(isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )) || null}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white shadow-sm border-r border-gray-200 z-10 flex-col">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        </div>
        
        {/* Anasayfa Butonu */}
        <div className="px-6 mb-4 flex-shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Site Anasayfası
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2 pb-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors touch-manipulation ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-16 w-80 max-w-[85vw] h-[calc(100vh-4rem)] bg-white shadow-xl border-r border-gray-200 z-30 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Admin Panel</h2>
        </div>
        
        {/* Anasayfa Butonu */}
        <div className="px-4 sm:px-6 py-4 flex-shrink-0 border-b border-gray-200">
          <Link
            href="/"
            target="_blank"
            className="flex items-center px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px]"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Site Anasayfası
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors touch-manipulation min-w-[44px] min-h-[44px] rounded-lg ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1 px-1 py-2">
          {menuItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors touch-manipulation min-h-[60px] ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
} 