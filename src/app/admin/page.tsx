'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import ClientRef from '@/app/ClientRef'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign,
  Eye,
  Star
} from 'lucide-react'
import { safeLocalStorage, isClient } from '@/lib/browser-utils'

interface DashboardData {
  totalOrders: number
  totalCustomers: number
  totalProducts: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    user: { name: string; email: string }
    finalAmount: number
    status: string
    createdAt: Date
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stock: number
  }>
  trends: {
    ordersGrowth: number
    customersGrowth: number
    productsGrowth: number
    revenueGrowth: number
  }
  performance: {
    salesTarget: number
    customerSatisfaction: number
    deliveryRate: number
  }
  recentActivities: Array<{
    id: string
    type: 'order' | 'product' | 'customer' | 'content'
    message: string
    timestamp: Date
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: [],
    trends: {
      ordersGrowth: 0,
      customersGrowth: 0,
      productsGrowth: 0,
      revenueGrowth: 0
    },
    performance: {
      salesTarget: 0,
      customerSatisfaction: 0,
      deliveryRate: 0
    },
    recentActivities: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Sipariş durumunu Türkçe'ye çevir
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Beklemede'
      case 'CONFIRMED':
        return 'Onaylandı'
      case 'SHIPPED':
        return 'Kargoda'
      case 'DELIVERED':
        return 'Teslim Edildi'
      case 'CANCELLED':
        return 'İptal Edildi'
      default:
        return status
    }
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null)
        setIsLoading(true)
        
        // Token'ı localStorage'dan al
        if (!isClient) {
          throw new Error('Client-side only')
        }
        
        const token = safeLocalStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        // AbortController ile timeout (daha verimli ve temiz)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 saniye timeout

        try {
          // Optimize edilmiş dashboard API'sini kullan
          const dashboardRes = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId) // Başarılı olursa timeout'u temizle

          if (!dashboardRes.ok) {
            const errorData = await dashboardRes.json().catch(() => ({}))
            throw new Error(errorData.error || 'Dashboard verileri yüklenirken hata oluştu')
          }

          const dashboardData = await dashboardRes.json()

        // Dashboard API'den gelen verileri kullan
        const products: any[] = [] // Dashboard'da ürün listesi gerekmiyor
        const customers: any[] = [] // Dashboard'da müşteri listesi gerekmiyor
        const orders: any[] = [] // Dashboard'da sipariş listesi gerekmiyor (sadece recentOrders)

        console.log('Dashboard data loaded:', dashboardData)

        // Dashboard API'den gelen verileri kullan
        const recentOrders = dashboardData.recentOrders || []
        const lowStockProducts = dashboardData.lowStockProducts || []
        
        // Son aktiviteler (recent orders'dan oluştur)
        const recentActivities: Array<{
          id: string
          type: 'order' | 'product' | 'customer' | 'content'
          message: string
          timestamp: Date
        }> = []
        
        if (recentOrders.length > 0) {
          recentOrders.slice(0, 2).forEach((order: any) => {
            recentActivities.push({
              id: order.id,
              type: 'order' as const,
              message: `Yeni sipariş alındı - ${order.orderNumber}`,
              timestamp: new Date(order.createdAt)
            })
          })
        }

        setData({
          totalOrders: dashboardData.totalOrders || 0,
          totalCustomers: dashboardData.totalCustomers || 0,
          totalProducts: dashboardData.totalProducts || 0,
          totalRevenue: dashboardData.totalRevenue || 0,
          recentOrders: recentOrders.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt)
          })),
          lowStockProducts,
          trends: dashboardData.trends || {
            ordersGrowth: 0,
            customersGrowth: 0,
            productsGrowth: 0,
            revenueGrowth: 0
          },
          performance: dashboardData.performance || {
            salesTarget: 85,
            customerSatisfaction: 4.8,
            deliveryRate: 0
          },
          recentActivities: recentActivities.slice(0, 3)
        })
        } catch (fetchError: any) {
          clearTimeout(timeoutId) // Hata durumunda da timeout'u temizle
          
          // Abort hatası kontrolü
          if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
            throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
          }
          
          throw fetchError
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Veriler yüklenirken bir hata oluştu'
        setError(errorMessage)
        
        // Hata durumunda bile temel verileri göster (eğer varsa)
        // Bu sayede sayfa tamamen boş kalmaz
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Mağaza genel durumu ve istatistikler</p>
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Dashboard verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Hata</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Mağaza genel durumu ve istatistikler</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Sipariş</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-600">+{data.trends.ordersGrowth}%</span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Müşteri</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-600">+{data.trends.customersGrowth}%</span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Ürün</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{data.totalProducts.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-600">+{data.trends.productsGrowth}%</span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-3 lg:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Gelir</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">₺{data.totalRevenue.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            <span className="text-green-600">+{data.trends.revenueGrowth}%</span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Son Siparişler</h3>
          </div>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sipariş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{order.finalAmount.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Henüz sipariş bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.user.name}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">₺{order.finalAmount.toLocaleString('tr-TR')}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Henüz sipariş bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Düşük Stok Ürünler</h3>
          </div>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.lowStockProducts.length > 0 ? (
                  data.lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock === 0 
                            ? 'bg-red-100 text-red-800' 
                            : product.stock < 5
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.stock === 0 ? 'Tükendi' : 
                           product.stock < 5 ? 'Kritik Stok' : 'Düşük Stok'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      Düşük stok ürün bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Stok: {product.stock}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                      product.stock === 0 
                        ? 'bg-red-100 text-red-800' 
                        : product.stock < 5
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.stock === 0 ? 'Tükendi' : 
                       product.stock < 5 ? 'Kritik' : 'Düşük'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Düşük stok ürün bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
            <button 
              onClick={() => router.push('/admin/products/new')}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              Yeni Ürün Ekle
            </button>
            <button 
              onClick={() => router.push('/admin/orders')}
              className="bg-green-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-green-700 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              Sipariş Görüntüle
            </button>
            <button 
              onClick={() => router.push('/admin/content/new')}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-purple-700 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              Yeni İçerik
            </button>
            <button 
              onClick={() => router.push('/admin/categories/new')}
              className="bg-orange-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-orange-700 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              Yeni Kategori
            </button>
            <button 
              onClick={() => router.push('/admin/reports')}
              className="bg-indigo-600 text-white px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-indigo-700 transition-colors touch-manipulation min-h-[44px] text-sm sm:text-base col-span-2 sm:col-span-1"
            >
              Rapor Oluştur
            </button>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {data.recentActivities.length > 0 ? (
              data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                    activity.type === 'order' ? 'bg-green-500' :
                    activity.type === 'product' ? 'bg-blue-500' :
                    activity.type === 'customer' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="break-words">{activity.message}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Henüz aktivite bulunmuyor.</div>
            )}
          </div>
        </div>

        {/* Performans alanı geçici olarak yorum satırı yapıldı
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performans</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Satış Hedefi</span>
              <span className="text-sm font-medium text-gray-900">{data.performance.salesTarget}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${data.performance.salesTarget}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Müşteri Memnuniyeti</span>
              <span className="text-sm font-medium text-gray-900">{data.performance.customerSatisfaction}/5</span>
            </div>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= data.performance.customerSatisfaction ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Teslimat Oranı</span>
              <span className="text-sm font-medium text-gray-900">{data.performance.deliveryRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${data.performance.deliveryRate}%` }}
              ></div>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  )
} 