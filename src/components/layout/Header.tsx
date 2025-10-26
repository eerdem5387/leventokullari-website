'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Menu, X, ShoppingCart } from 'lucide-react'
import DynamicMenu from './DynamicMenu'
import { safeLocalStorage, safeSessionStorage, safeWindow, isClient } from '@/lib/browser-utils'

interface HeaderProps {
  siteName?: string
}

export default function Header({ siteName = 'E-Mağaza' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    setIsClient(true)
    
    // Sepet sayısını güncelle
    const updateCartCount = () => {
      const cart = safeLocalStorage.getItem('cart')
      if (cart) {
        try {
          const cartData = JSON.parse(cart)
          const totalItems = cartData.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
          setCartItemCount(totalItems)
        } catch (error) {
          console.error('Cart parse error:', error)
          setCartItemCount(0)
        }
      } else {
        setCartItemCount(0)
      }
    }

    updateCartCount()

    // Storage değişikliklerini dinle
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        updateCartCount()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Custom event dinle (aynı tab içinde)
    window.addEventListener('cartUpdated', updateCartCount)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', updateCartCount)
    }
  }, [])

  

  return (
    <header className="tg-header__style-three">
      {/* Main Header */}
      <div id="sticky-default" className="tg-header__area bg-white">
        <div className="container custom-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row">
            <div className="col-12">
              {/* Mobile Nav Toggler */}
              <div className="mobile-nav-toggler d-xl-none">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Main Navigation */}
              <div className="tgmenu__wrap">
                <nav className="tgmenu__nav flex items-center justify-between h-30">
                  {/* Logo */}
                  <div className="logo flex-shrink-0">
                    <Link href="/" className="main-logo block">
                      <img 
                        src="/uploads/levent-akademik-logo.png" 
                        alt={siteName}
                        className="h-25 w-auto max-w-[140px] object-contain"
                      />
                    </Link>
                  </div>

                  {/* Desktop Navigation - Center */}
                  <div className="tgmenu__navbar-wrap tgmenu__main-menu flex-1 flex justify-center d-none d-xl-flex">
                    <ul className="navigation flex space-x-6">
                      <li><Link href="/products" className="text-gray-700 hover:text-gray-900">Ürünler</Link></li>
                      <li><Link href="/about" className="text-gray-700 hover:text-gray-900">Hakkımızda</Link></li>
                      <li><Link href="/contact" className="text-gray-700 hover:text-gray-900">İletişim</Link></li>
                    </ul>
                  </div>

                  {/* Action Buttons - Right side */}
                  <div className="tgmenu__action flex-shrink-0">
                    <ul className="flex items-center space-x-4">
                      {/* Cart Icon */}
                      <li>
                        <Link href="/checkout" className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                          <ShoppingCart className="h-6 w-6" />
                          {cartItemCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {cartItemCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>

              {/* Mobile Menu */}
              <div className={`tgmobile__menu ${mobileMenuOpen ? 'active' : ''}`}>
                <nav className="tgmobile__menu-box">
                  <div className="close-btn">
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="nav-logo text-center mb-8">
                    <Link href="/" className="main-logo">
                      <img 
                        src="/uploads/levent-akademik-logo.png" 
                        alt={siteName}
                        className="h-25 w-auto mx-auto max-w-[120px] object-contain"
                      />
                    </Link>
                  </div>

                  <div className="tgmobile__search mb-6">
                    <form method="get" action="/products" className="relative">
                      <input 
                        type="text" 
                        name="search" 
                        className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors" 
                        placeholder="Kurs Ara..." 
                      />
                      <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Search className="h-5 w-5" />
                      </button>
                    </form>
                  </div>

                  <div className="tgmobile__menu-outer">
                    <ul className="navigation space-y-4">
                      <li><Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-gray-900">Ürünler</Link></li>
                      <li><Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-gray-900">Hakkımızda</Link></li>
                      <li><Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-gray-700 hover:text-gray-900">İletişim</Link></li>
                    </ul>
                  </div>

                  <div className="tgmenu__action mt-8">
                    <ul className="space-y-4">
                      {/* Mobile Cart */}
                      <li>
                        <Link href="/checkout" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="flex items-center text-gray-700">
                            <ShoppingCart className="h-5 w-5 mr-3" />
                            Sepetim
                          </span>
                          {cartItemCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                              {cartItemCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    </ul>
                  </div>

                  <div className="social-links mt-8 flex justify-center space-x-4">
                    <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <i className="fab fa-instagram"></i>
                    </a>
                  </div>
                </nav>
              </div>
              
              <div className={`tgmobile__menu-backdrop ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}