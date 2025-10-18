'use client'

import { useState, useEffect } from 'react'
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
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Yetkilendirme gerekli')
        }

        // Paralel olarak tüm verileri çek
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          fetch('/api/products?admin=true', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/users?role=CUSTOMER', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        // Her response'u kontrol et
        if (!productsRes.ok) {
          throw new Error('Ürünler yüklenirken hata oluştu')
        }
        if (!customersRes.ok) {
          throw new Error('Müşteriler yüklenirken hata oluştu')
        }
        if (!ordersRes.ok) {
          throw new Error('Siparişler yüklenirken hata oluştu')
        }

        const products = await productsRes.json()
        const customers = await customersRes.json()
        const orders = await ordersRes.json()

        console.log('Dashboard data loaded:', {
          productsCount: Array.isArray(products) ? products.length : 0,
          customersCount: Array.isArray(customers) ? customers.length : 0,
          ordersCount: Array.isArray(orders) ? orders.length : 0
        })

        // Düşük stok ürünleri bul
        const lowStockProducts = Array.isArray(products) ? products
          .filter((product: any) => {
            // Varyasyonlu ürünler için varyasyon stoklarını kontrol et
            if (product.productType === 'VARIABLE' && product.variations && product.variations.length > 0) {
              // Varyasyonlardaki toplam stok
              const totalVariationStock = product.variations.reduce((sum: number, variation: any) => {
                return sum + (variation.stock > 0 ? variation.stock : 0)
              }, 0)
              
              // Eğer varyasyonlarda stok varsa ve toplam stok düşükse göster
              return totalVariationStock < 10 && totalVariationStock > 0
            } else {
              // Basit ürünler için normal kontrol
              return product.stock < 10 && product.stock !== -1 && product.stock > 0
            }
          })
          .slice(0, 5)
          .map((product: any) => {
            // Varyasyonlu ürünler için toplam stok hesapla
            if (product.productType === 'VARIABLE' && product.variations && product.variations.length > 0) {
              const totalStock = product.variations.reduce((sum: number, variation: any) => {
                return sum + (variation.stock > 0 ? variation.stock : 0)
              }, 0)
              
              return {
                id: product.id,
                name: product.name,
                stock: totalStock
              }
            } else {
              return {
                id: product.id,
                name: product.name,
                stock: product.stock
              }
            }
          }) : []

        // Son siparişleri al
        const recentOrders = Array.isArray(orders) ? orders
          .slice(0, 5)
          .map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            user: order.user,
            finalAmount: Number(order.finalAmount),
            status: order.status,
            createdAt: new Date(order.createdAt)
          })) : []

        // Toplam geliri hesapla
        const totalRevenue = Array.isArray(orders) ? orders
          .filter((order: any) => order.paymentStatus === 'COMPLETED')
          .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0) : 0

        // Trend hesaplamaları (geçen ay vs bu ay)
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Bu ay verileri
        const thisMonthOrders = Array.isArray(orders) ? orders.filter((order: any) => 
          new Date(order.createdAt) >= thisMonth
        ) : []
        const thisMonthRevenue = thisMonthOrders
          .filter((order: any) => order.paymentStatus === 'COMPLETED')
          .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0)

        // Geçen ay verileri (basit hesaplama - gerçek veri yoksa)
        const lastMonthOrders = Array.isArray(orders) ? orders.filter((order: any) => 
          new Date(order.createdAt) >= lastMonth && new Date(order.createdAt) < thisMonth
        ) : []
        const lastMonthRevenue = lastMonthOrders
          .filter((order: any) => order.paymentStatus === 'COMPLETED')
          .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0)

        // Trend yüzdeleri hesapla
        const ordersGrowth = lastMonthOrders.length > 0 
          ? Math.round(((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100)
          : (thisMonthOrders.length > 0 ? 100 : 0) // Bu ay sipariş varsa %100, yoksa %0
        
        const revenueGrowth = lastMonthRevenue > 0 
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : (thisMonthRevenue > 0 ? 100 : 0) // Bu ay gelir varsa %100, yoksa %0
        
        // Müşteri artışı hesapla
        const thisMonthCustomers = Array.isArray(customers) ? customers.filter((customer: any) => 
          new Date(customer.createdAt) >= thisMonth
        ) : []
        const lastMonthCustomers = Array.isArray(customers) ? customers.filter((customer: any) => 
          new Date(customer.createdAt) >= lastMonth && new Date(customer.createdAt) < thisMonth
        ) : []
        const customersGrowth = lastMonthCustomers.length > 0 
          ? Math.round(((thisMonthCustomers.length - lastMonthCustomers.length) / lastMonthCustomers.length) * 100)
          : (thisMonthCustomers.length > 0 ? 100 : 0) // Bu ay müşteri varsa %100, yoksa %0

        // Ürün artışı hesapla
        const thisMonthProducts = Array.isArray(products) ? products.filter((product: any) => 
          new Date(product.createdAt) >= thisMonth
        ) : []
        const lastMonthProducts = Array.isArray(products) ? products.filter((product: any) => 
          new Date(product.createdAt) >= lastMonth && new Date(product.createdAt) < thisMonth
        ) : []
        const productsGrowth = lastMonthProducts.length > 0 
          ? Math.round(((thisMonthProducts.length - lastMonthProducts.length) / lastMonthProducts.length) * 100)
          : (thisMonthProducts.length > 0 ? 100 : 0) // Bu ay ürün varsa %100, yoksa %0

        // Debug logları
        console.log('Dashboard Trend Hesaplamaları:')
        console.log('Bu ay siparişler:', thisMonthOrders.length)
        console.log('Geçen ay siparişler:', lastMonthOrders.length)
        console.log('Sipariş artışı:', ordersGrowth + '%')
        console.log('Bu ay gelir:', thisMonthRevenue)
        console.log('Geçen ay gelir:', lastMonthRevenue)
        console.log('Gelir artışı:', revenueGrowth + '%')
        console.log('Bu ay müşteriler:', thisMonthCustomers.length)
        console.log('Geçen ay müşteriler:', lastMonthCustomers.length)
        console.log('Müşteri artışı:', customersGrowth + '%')
        console.log('Bu ay ürünler:', thisMonthProducts.length)
        console.log('Geçen ay ürünler:', lastMonthProducts.length)
        console.log('Ürün artışı:', productsGrowth + '%')

        // Performans metrikleri
        const salesTarget = 85 // Bu ay hedefi (gerçek veri yoksa varsayılan)
        const customerSatisfaction = 4.8 // Ortalama rating (gerçek veri yoksa varsayılan)
        const completedOrders = Array.isArray(orders) ? orders.filter((order: any) => 
          order.status === 'DELIVERED'
        ).length : 0
        const totalOrdersCount = Array.isArray(orders) ? orders.length : 0
        const deliveryRate = totalOrdersCount > 0 ? Math.round((completedOrders / totalOrdersCount) * 100) : 0

        // Son aktiviteler
        const recentActivities: Array<{
          id: string
          type: 'order' | 'product' | 'customer' | 'content'
          message: string
          timestamp: Date
        }> = []
        
        // Son siparişler
        if (Array.isArray(orders) && orders.length > 0) {
          orders.slice(0, 2).forEach((order: any) => {
            recentActivities.push({
              id: order.id,
              type: 'order' as const,
              message: `Yeni sipariş alındı - ${order.orderNumber}`,
              timestamp: new Date(order.createdAt)
            })
          })
        }
        
        // Son ürünler
        if (Array.isArray(products) && products.length > 0) {
          products.slice(0, 1).forEach((product: any) => {
            recentActivities.push({
              id: product.id,
              type: 'product' as const,
              message: `Yeni ürün eklendi - ${product.name}`,
              timestamp: new Date(product.createdAt)
            })
          })
        }
        
        // Son müşteriler
        if (Array.isArray(customers) && customers.length > 0) {
          customers.slice(0, 1).forEach((customer: any) => {
            recentActivities.push({
              id: customer.id,
              type: 'customer' as const,
              message: `Yeni müşteri kaydoldu - ${customer.name}`,
              timestamp: new Date(customer.createdAt)
            })
          })
        }

        // Aktivite sıralaması (en yeni önce)
        recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setData({
          totalOrders: Array.isArray(orders) ? orders.length : 0,
          totalCustomers: Array.isArray(customers) ? customers.length : 0,
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalRevenue,
          recentOrders,
          lowStockProducts,
          trends: {
            ordersGrowth,
            customersGrowth,
            productsGrowth,
            revenueGrowth
          },
          performance: {
            salesTarget,
            customerSatisfaction,
            deliveryRate
          },
          recentActivities: recentActivities.slice(0, 3)
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error instanceof Error ? error.message : 'Veriler yüklenirken bir hata oluştu')
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Mağaza genel durumu ve istatistikler</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalOrders.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+{data.trends.ordersGrowth}%</span>
            <span className="text-gray-500 ml-1">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalCustomers.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+{data.trends.customersGrowth}%</span>
            <span className="text-gray-500 ml-1">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalProducts.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+{data.trends.productsGrowth}%</span>
            <span className="text-gray-500 ml-1">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900">₺{data.totalRevenue.toLocaleString('tr-TR')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+{data.trends.revenueGrowth}%</span>
            <span className="text-gray-500 ml-1">geçen aya göre</span>
          </div>
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Son Siparişler</h3>
          </div>
          <div className="overflow-x-auto">
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
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Düşük Stok Ürünler</h3>
          </div>
          <div className="overflow-x-auto">
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/admin/products/new')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Ürün Ekle
            </button>
            <button 
              onClick={() => router.push('/admin/orders')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Sipariş Görüntüle
            </button>
            <button 
              onClick={() => router.push('/admin/content/new')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Yeni İçerik Oluştur
            </button>
            <button 
              onClick={() => router.push('/admin/categories/new')}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Yeni Kategori Ekle
            </button>
            <button 
              onClick={() => router.push('/admin/reports')}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Rapor Oluştur
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {data.recentActivities.length > 0 ? (
              data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center text-sm">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'order' ? 'bg-green-500' :
                    activity.type === 'product' ? 'bg-blue-500' :
                    activity.type === 'customer' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span>{activity.message}</span>
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