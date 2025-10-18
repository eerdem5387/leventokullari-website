'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, X } from 'lucide-react'
import DynamicMenu from './DynamicMenu'
import { safeLocalStorage, safeSessionStorage, safeWindow, isClient } from '@/lib/browser-utils'

interface HeaderProps {
  siteName?: string
}

export default function Header({ siteName = 'E-Mağaza' }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    if (!isClient) return
    
    setIsClient(true)
    
    const userStr = safeLocalStorage.getItem('user')
    if (userStr) {
      try {
        setUser(JSON.parse(userStr))
      } catch (error) {
        console.error('Error parsing user data:', error)
        safeLocalStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  // Sepet sayısını hesapla
  const calculateCartCount = () => {
    if (!isClient) return
    
    try {
      const cart = safeSessionStorage.getItem('cart')
      if (cart) {
        const cartItems = JSON.parse(cart)
        const totalCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
        setCartCount(totalCount)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('Error calculating cart count:', error)
      setCartCount(0)
    }
  }

  // Sepet sayısını güncelle
  useEffect(() => {
    if (!isClient) return
    
    calculateCartCount()

    // localStorage değişikliklerini dinle
    const handleStorageChange = () => {
      calculateCartCount()
    }

    safeWindow.addEventListener('storage', handleStorageChange)
    
    // Custom event listener for cart updates
    safeWindow.addEventListener('cartUpdated', handleStorageChange)

    return () => {
      safeWindow.removeEventListener('storage', handleStorageChange)
      safeWindow.removeEventListener('cartUpdated', handleStorageChange)
    }
  }, [])

  const handleLogout = () => {
    if (!isClient) return
    
    safeLocalStorage.removeItem('user')
    safeLocalStorage.removeItem('token')
    setUser(null)
    safeWindow.location.assign('/')
  }

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
                    <DynamicMenu location="header" className="navigation" />
                  </div>

                  {/* Action Buttons - Right side */}
                  <div className="tgmenu__action flex-shrink-0">
                    <ul className="list-wrap flex items-center space-x-4">
                      {/* Cart */}
                      <li className="mini-cart-icon">
                        <Link href="/cart" className="cart-count relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                          <ShoppingCart className="h-5 w-5" />
                          {isClient && cartCount > 0 && (
                            <span className="mini-cart-count absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </li>

                      {/* User Menu */}
                      {user ? (
                        <li className="header-btn login-btn">
                          <div className="relative group">
                            <button className="btn bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                              Profile
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <div className="py-2">
                                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  Profilim
                                </Link>
                                <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  Siparişlerim
                                </Link>
                                <button
                                  onClick={handleLogout}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Çıkış Yap
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ) : (
                        <li className="header-btn login-btn">
                          <Link href="/login" className="btn bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Profile
                          </Link>
                        </li>
                      )}
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
                    <DynamicMenu location="header" className="navigation" />
                  </div>

                  <div className="tgmenu__action mt-8">
                    <ul className="list-wrap">
                      <li className="header-btn login-btn">
                        {user ? (
                          <div className="space-y-2">
                            <Link href="/profile" className="block text-gray-600 hover:text-gray-900">
                              Profilim
                            </Link>
                            <Link href="/orders" className="block text-gray-600 hover:text-gray-900">
                              Siparişlerim
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="block text-gray-600 hover:text-gray-900"
                            >
                              Çıkış Yap
                            </button>
                          </div>
                        ) : (
                          <Link href="/login" className="btn bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors w-full text-center">
                            Hesabım
                          </Link>
                        )}
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