'use client'

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
  FileText,
  CreditCard,
  Menu,
  Mail
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
    name: 'Blog',
    href: '/admin/blog',
    icon: FileText
  },
  {
    name: 'İçerik',
    href: '/admin/content',
    icon: FileText
  },
  {
    name: 'Menüler',
    href: '/admin/menus',
    icon: Menu
  },
  {
    name: 'İletişim Formları',
    href: '/admin/contact-forms',
    icon: Mail
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

  return (
    <aside className="fixed left-0 top-16 w-64 h-full bg-white shadow-sm border-r border-gray-200 z-10">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
} 