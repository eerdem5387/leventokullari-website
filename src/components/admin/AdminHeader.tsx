'use client'

import { useState, useEffect } from 'react'
import { Bell, User, LogOut, Settings, ShoppingCart, AlertTriangle, UserPlus, Package } from 'lucide-react'

interface Notification {
  id: string
  type: 'order' | 'stock' | 'customer' | 'product'
  message: string
  timestamp: Date
  read: boolean
}

export default function AdminHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    // Dışarıya tıklayınca dropdown'ları kapat
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
        setIsNotificationsOpen(false)
      }
      if (!target.closest('.user-dropdown') && !target.closest('.user-button')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Paralel olarak verileri çek
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/products?admin=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users?role=CUSTOMER', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const orders = await ordersRes.json()
      const products = await productsRes.json()
      const customers = await customersRes.json()

      const newNotifications: Notification[] = []

      // Yeni siparişler (son 24 saat)
      const recentOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return orderDate > dayAgo && order.status === 'PENDING'
      })
      
      if (recentOrders.length > 0) {
        newNotifications.push({
          id: 'new-orders',
          type: 'order',
          message: `${recentOrders.length} yeni sipariş`,
          timestamp: new Date(),
          read: false
        })
      }

      // Düşük stok uyarıları
      const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock < 10)
      if (lowStockProducts.length > 0) {
        newNotifications.push({
          id: 'low-stock',
          type: 'stock',
          message: `${lowStockProducts.length} ürün düşük stokta`,
          timestamp: new Date(),
          read: false
        })
      }

      // Yeni müşteriler (son 7 gün)
      const recentCustomers = customers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return customerDate > weekAgo
      })

      if (recentCustomers.length > 0) {
        newNotifications.push({
          id: 'new-customers',
          type: 'customer',
          message: `${recentCustomers.length} yeni müşteri kaydı`,
          timestamp: new Date(),
          read: false
        })
      }

      setNotifications(newNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-5 w-5 text-blue-600" />
      case 'stock': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'customer': return <UserPlus className="h-5 w-5 text-green-600" />
      case 'product': return <Package className="h-5 w-5 text-purple-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl border-b px-3 sm:px-4 lg:px-6 py-3 sm:py-4 z-20 safe-area-inset-top">
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Admin Panel</h1>
          <p className="text-xs sm:text-sm text-gray-200 hidden sm:block">E-Mağaza Yönetim Paneli</p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="notification-button relative p-2 sm:p-3 text-white hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Bildirimler"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="notification-dropdown absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] bg-white rounded-lg shadow-2xl border z-50 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
                  <p className="text-xs text-gray-500">{unreadCount} okunmamış bildirim</p>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {isLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Yeni bildirim yok</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString('tr-TR')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })))
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center"
                    >
                      Tümünü Okundu İşaretle
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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