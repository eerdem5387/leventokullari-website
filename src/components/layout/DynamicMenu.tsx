'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface MenuItem {
  id: string
  title: string
  url: string
  target: string
  order: number
  isActive: boolean
  children?: MenuItem[]
}

interface Menu {
  id: string
  name: string
  location: string
  isActive: boolean
  items: MenuItem[]
}

interface DynamicMenuProps {
  location: 'header' | 'footer' | 'sidebar'
  className?: string
}

export default function DynamicMenu({ location, className = '' }: DynamicMenuProps) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/menus/${location}`)
        
        if (response.ok) {
          const data = await response.json()
          setMenu(data)
        } else if (response.status === 404) {
          // Menü bulunamadı, bu normal olabilir
          setMenu(null)
        } else {
          throw new Error('Menü yüklenirken bir hata oluştu')
        }
      } catch (error) {
        console.error('Error fetching menu:', error)
        setError(error instanceof Error ? error.message : 'Menü yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [location])

  const renderMenuItem = (item: MenuItem, level: number = 0, isFooter: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isExternal = item.target === '_blank'
    
    if (!item.isActive) return null

    const baseClasses = (() => {
      if (isFooter) {
        return level === 0
          ? 'text-white px-0 py-1 text-base transition-colors'
          : 'text-white px-0 py-1 text-sm block transition-colors'
      }
      return level === 0
        ? 'nav-links text-gray-700 hover:text-gray-600 px-3 py-2 text-base font-medium transition-colors'
        : 'dropdown-items text-gray-600 hover:text-gray-800 px-4 py-2 text-sm block transition-colors'
    })()

    const linkContent = (
      <>
        {item.title}
        {hasChildren && level === 0 && (
          <ChevronDown className="ml-1 h-4 w-4 inline" />
        )}
      </>
    )

    if (isExternal) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
        >
          {linkContent}
        </a>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.url}
        className={baseClasses}
      >
        {linkContent}
      </Link>
    )
  }

  const renderDropdown = (item: MenuItem) => {
    if (!item.children || item.children.length === 0) return null

    return (
      <li key={item.id} className="menu-item menu-item-has-children dropdown has-dropdown nav-item relative group">
        {renderMenuItem(item, 0, false)}
        <ul className="sub-menu absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          {item.children
            .filter(child => child.isActive)
            .sort((a, b) => a.order - b.order)
            .map(child => (
              <li key={child.id} className="menu-item nav-item">
                {renderMenuItem(child, 1, false)}
              </li>
            ))
          }
        </ul>
        <div className="dropdown-btn">
          <span className="plus-line"></span>
        </div>
      </li>
    )
  }

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !menu) {
    // Hata durumunda veya menü yoksa varsayılan menüyü göster
    const defaultMenu = {
      header: [
        { title: 'Ana Sayfa', url: '/' },
        { title: 'Ürünler', url: '/products' },
        { title: 'Kategoriler', url: '/categories' },
        { title: 'Blog', url: '/blog' },
        { title: 'İletişim', url: '/contact' }
      ],
      footer: [
        { title: 'Hakkımızda', url: '/about' },
        { title: 'Gizlilik Politikası', url: '/privacy' },
        { title: 'Kargo Bilgileri', url: '/shipping' },
        { title: 'İade ve Değişim', url: '/returns' }
      ],
      sidebar: [
        { title: 'Son Yazılar', url: '/blog' },
        { title: 'Popüler Ürünler', url: '/products?sort=popular' },
        { title: 'İndirimli Ürünler', url: '/products?sort=discount' }
      ]
    }

    const defaultItems = defaultMenu[location] || []

    return (
      <nav className={className}>
        {location === 'header' ? (
          <ul className="navigation hidden md:flex">
            {defaultItems.map((item, index) => (
              <li key={index} className="menu-item nav-item">
                <Link
                  href={item.url}
                  className="nav-links text-gray-700 hover:text-gray-600 px-3 py-2 text-base font-medium transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : location === 'footer' ? (
          <ul className="space-y-2">
            {defaultItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.url}
                  className="text-white transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {defaultItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.url}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm block transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    )
  }

  const activeItems = menu.items
    .filter(item => item.isActive)
    .sort((a, b) => a.order - b.order)

  if (activeItems.length === 0) {
    return null
  }

  return (
    <nav className={className}>
      {location === 'header' ? (
        <ul className="navigation hidden md:flex">
          {activeItems.map(item => (
            <li key={item.id} className="menu-item nav-item">
              {item.children && item.children.length > 0 
                ? renderDropdown(item)
                : renderMenuItem(item)
              }
            </li>
          ))}
        </ul>
      ) : location === 'footer' ? (
        <ul className="space-y-2">
          {activeItems.map(item => (
            <li key={item.id}>
              {renderMenuItem(item, 0, true)}
              {item.children && item.children.length > 0 && (
                <ul className="ml-4 mt-2 space-y-1">
                  {item.children
                    .filter(child => child.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map(child => (
                      <li key={child.id}>
                        {renderMenuItem(child, 1, true)}
                      </li>
                    ))
                  }
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {activeItems.map(item => (
            <li key={item.id}>
              {renderMenuItem(item)}
              {item.children && item.children.length > 0 && (
                <ul className="ml-4 mt-2 space-y-1">
                  {item.children
                    .filter(child => child.isActive)
                    .sort((a, b) => a.order - b.order)
                    .map(child => (
                      <li key={child.id}>
                        {renderMenuItem(child, 1)}
                      </li>
                    ))
                  }
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
