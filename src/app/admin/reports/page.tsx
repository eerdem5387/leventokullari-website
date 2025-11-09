'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, ShoppingCart, Users, Download, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface ReportData {
  sales: {
    current: number
    previous: number
    change: string
  }
  orders: {
    current: number
    previous: number
    change: string
  }
  customers: {
    current: number
    previous: number
    change: string
  }
  averageOrder: {
    current: number
    previous: number
    change: string
  }
}

interface MonthlyData {
  month: string
  sales: number
  orders: number
}

interface TopProduct {
  name: string
  sales: number
  revenue: number
  category?: string
}

interface TopCategory {
  name: string
  sales: number
  revenue: number
}

interface CategoryReport {
  categoryName: string
  totalSales: number
  totalOrders: number
  totalRevenue: number
  products: Array<{
    name: string
    quantity: number
    revenue: number
  }>
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [reportData, setReportData] = useState<ReportData>({
    sales: { current: 0, previous: 0, change: '0%' },
    orders: { current: 0, previous: 0, change: '0%' },
    customers: { current: 0, previous: 0, change: '0%' },
    averageOrder: { current: 0, previous: 0, change: '0%' }
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null)

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Token kontrolü
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login?redirect=/admin/reports')
          return
        }

        // Paralel olarak tüm verileri çek (admin endpoint'leri kullan)
        const [productsRes, customersRes, ordersRes, categoriesRes] = await Promise.all([
          fetch('/api/products?admin=true', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/users?role=CUSTOMER', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/categories', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        // Response kontrolü
        if (!productsRes.ok || !customersRes.ok || !ordersRes.ok || !categoriesRes.ok) {
          throw new Error('Veriler yüklenirken hata oluştu')
        }

        const products = await productsRes.json()
        const customers = await customersRes.json()
        const orders = await ordersRes.json()
        const categories = await categoriesRes.json()

        setCategories(categories)

        // Tarih filtreleme
        let filteredOrders = orders
        if (startDate && endDate) {
          filteredOrders = orders.filter((order: any) => {
            const orderDate = new Date(order.createdAt)
            const start = new Date(startDate)
            const end = new Date(endDate)
            return orderDate >= start && orderDate <= end
          })
        }

        // Kategori filtreleme
        if (selectedCategory !== 'all') {
          filteredOrders = filteredOrders.filter((order: any) => {
            return order.items?.some((item: any) => 
              item.product?.category?.id === selectedCategory
            )
          })
        }

        // Mevcut ay verileri
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()

        const currentMonthOrders = filteredOrders.filter((order: any) => {
          const orderDate = new Date(order.createdAt)
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
        })

        const previousMonthOrders = filteredOrders.filter((order: any) => {
          const orderDate = new Date(order.createdAt)
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear
        })

        // Satış hesaplamaları
        const currentSales = currentMonthOrders
          .filter((order: any) => order.paymentStatus === 'COMPLETED')
          .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0)

        const previousSales = previousMonthOrders
          .filter((order: any) => order.paymentStatus === 'COMPLETED')
          .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0)

        const salesChange = previousSales > 0 ? ((currentSales - previousSales) / previousSales * 100).toFixed(1) : '0'
        const salesChangeText = salesChange.startsWith('-') ? `${salesChange}%` : `+${salesChange}%`

        // Sipariş hesaplamaları (sadece tamamlanan ödemeler)
        const currentOrders = currentMonthOrders.filter((order: any) => order.paymentStatus === 'COMPLETED').length
        const previousOrders = previousMonthOrders.filter((order: any) => order.paymentStatus === 'COMPLETED').length
        const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders * 100).toFixed(1) : '0'
        const ordersChangeText = ordersChange.startsWith('-') ? `${ordersChange}%` : `+${ordersChange}%`

        // Müşteri hesaplamaları
        const currentCustomers = customers.filter((customer: any) => {
          const customerDate = new Date(customer.createdAt)
          return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear
        }).length

        const previousCustomers = customers.filter((customer: any) => {
          const customerDate = new Date(customer.createdAt)
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return customerDate.getMonth() === prevMonth && customerDate.getFullYear() === prevYear
        }).length

        const customersChange = previousCustomers > 0 ? ((currentCustomers - previousCustomers) / previousCustomers * 100).toFixed(1) : '0'
        const customersChangeText = customersChange.startsWith('-') ? `${customersChange}%` : `+${customersChange}%`

        // Ortalama sipariş hesaplamaları (sadece tamamlanan ödemeler)
        const currentAvgOrder = currentOrders > 0 ? currentSales / currentOrders : 0
        const previousAvgOrder = previousOrders > 0 ? previousSales / previousOrders : 0
        const avgOrderChange = previousAvgOrder > 0 ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder * 100).toFixed(1) : '0'
        const avgOrderChangeText = avgOrderChange.startsWith('-') ? `${avgOrderChange}%` : `+${avgOrderChange}%`

        setReportData({
          sales: { current: currentSales, previous: previousSales, change: salesChangeText },
          orders: { current: currentOrders, previous: previousOrders, change: ordersChangeText },
          customers: { current: currentCustomers, previous: previousCustomers, change: customersChangeText },
          averageOrder: { current: currentAvgOrder, previous: previousAvgOrder, change: avgOrderChangeText }
        })

        // Aylık veriler (son 6 ay)
        const monthlyDataArray = []
        for (let i = 5; i >= 0; i--) {
          const month = new Date(currentYear, currentMonth - i, 1)
          const monthOrders = filteredOrders.filter((order: any) => {
            const orderDate = new Date(order.createdAt)
            return orderDate.getMonth() === month.getMonth() && orderDate.getFullYear() === month.getFullYear()
          })
          
          const monthSales = monthOrders
            .filter((order: any) => order.paymentStatus === 'COMPLETED')
            .reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0)

          const monthCompletedOrders = monthOrders.filter((order: any) => order.paymentStatus === 'COMPLETED').length

          monthlyDataArray.push({
            month: month.toLocaleDateString('tr-TR', { month: 'long' }),
            sales: monthSales,
            orders: monthCompletedOrders
          })
        }
        setMonthlyData(monthlyDataArray)

        // En çok satan ürünler (gerçek verilerle hesapla)
        const productSales = new Map<string, { sales: number; revenue: number; category?: string }>()
        
        // Siparişlerden ürün satışlarını hesapla
        filteredOrders.forEach((order: any) => {
          if (order.paymentStatus === 'COMPLETED' && order.items) {
            order.items.forEach((item: any) => {
              const productName = item.product?.name || 'Bilinmeyen Ürün'
              const categoryName = item.product?.category?.name || 'Bilinmeyen Kategori'
              const current = productSales.get(productName) || { sales: 0, revenue: 0, category: categoryName }
              productSales.set(productName, {
                sales: current.sales + item.quantity,
                revenue: current.revenue + (item.quantity * item.unitPrice),
                category: categoryName
              })
            })
          }
        })

        // En çok satan ürünleri sırala
        const topProductsArray = Array.from(productSales.entries())
          .map(([name, data]) => ({
            name,
            sales: data.sales,
            revenue: data.revenue,
            category: data.category
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)

        // Eğer gerçek veri yoksa varsayılan göster
        const finalTopProducts = topProductsArray.length > 0 ? topProductsArray : [
          { name: 'Henüz satış yok', sales: 0, revenue: 0 }
        ]

        setTopProducts(finalTopProducts)

        // En çok satan kategoriler (gerçek verilerle hesapla)
        const categorySales = new Map<string, { sales: number; revenue: number }>()
        
        // Siparişlerden kategori satışlarını hesapla
        filteredOrders.forEach((order: any) => {
          if (order.paymentStatus === 'COMPLETED' && order.items) {
            order.items.forEach((item: any) => {
              const categoryName = item.product?.category?.name || 'Bilinmeyen Kategori'
              const current = categorySales.get(categoryName) || { sales: 0, revenue: 0 }
              categorySales.set(categoryName, {
                sales: current.sales + item.quantity,
                revenue: current.revenue + (item.quantity * item.unitPrice)
              })
            })
          }
        })

        // En çok satan kategorileri sırala
        const topCategoriesArray = Array.from(categorySales.entries())
          .map(([name, data]) => ({
            name,
            sales: data.sales,
            revenue: data.revenue
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)

        // Eğer gerçek veri yoksa varsayılan göster
        const finalTopCategories = topCategoriesArray.length > 0 ? topCategoriesArray : [
          { name: 'Henüz satış yok', sales: 0, revenue: 0 }
        ]

        setTopCategories(finalTopCategories)

        // Seçili kategori raporu
        if (selectedCategory !== 'all') {
          const selectedCategoryData = categories.find((cat: Category) => cat.id === selectedCategory)
          if (selectedCategoryData) {
            const categoryOrders = filteredOrders.filter((order: any) => 
              order.paymentStatus === 'COMPLETED' && 
              order.items?.some((item: any) => item.product?.category?.id === selectedCategory)
            )

            const categoryProducts = new Map<string, { quantity: number; revenue: number }>()
            
            categoryOrders.forEach((order: any) => {
              order.items.forEach((item: any) => {
                if (item.product?.category?.id === selectedCategory) {
                  const productName = item.product.name
                  const current = categoryProducts.get(productName) || { quantity: 0, revenue: 0 }
                  categoryProducts.set(productName, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + (item.quantity * item.unitPrice)
                  })
                }
              })
            })

            const categoryReportData: CategoryReport = {
              categoryName: selectedCategoryData.name,
              totalSales: Array.from(categoryProducts.values()).reduce((sum, p) => sum + p.quantity, 0),
              totalOrders: categoryOrders.length,
              totalRevenue: categoryOrders.reduce((sum: number, order: any) => sum + Number(order.finalAmount), 0),
              products: Array.from(categoryProducts.entries()).map(([name, data]) => ({
                name,
                quantity: data.quantity,
                revenue: data.revenue
              })).sort((a, b) => b.quantity - a.quantity)
            }

            setCategoryReport(categoryReportData)
          }
        } else {
          setCategoryReport(null)
        }

        // Debug logları
        console.log('Rapor Hesaplamaları:')
        console.log('Toplam siparişler:', orders.length)
        console.log('Filtrelenmiş siparişler:', filteredOrders.length)
        console.log('Tamamlanan siparişler:', orders.filter((order: any) => order.paymentStatus === 'COMPLETED').length)
        console.log('Bu ay siparişler (tamamlanan):', currentOrders)
        console.log('Geçen ay siparişler (tamamlanan):', previousOrders)
        console.log('Bu ay satışlar:', currentSales)
        console.log('Geçen ay satışlar:', previousSales)
        console.log('En çok satan ürünler:', finalTopProducts)
        console.log('En çok satan kategoriler:', finalTopCategories)

      } catch (error) {
        console.error('Error fetching report data:', error)
        alert('Rapor verileri yüklenirken bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [selectedPeriod, selectedCategory, startDate, endDate, router])

  const exportToExcel = () => {
    try {
      // Excel verilerini hazırla
      const excelData: Record<string, string[][]> = {
        'Genel Rapor': [
          ['Metrik', 'Değer', 'Değişim'],
          ['Toplam Satış', `₺${reportData.sales.current.toLocaleString('tr-TR')}`, reportData.sales.change],
          ['Toplam Sipariş', reportData.orders.current.toString(), reportData.orders.change],
          ['Yeni Müşteri', reportData.customers.current.toString(), reportData.customers.change],
          ['Ortalama Sipariş', `₺${reportData.averageOrder.current.toFixed(2)}`, reportData.averageOrder.change]
        ],
        'Aylık Satışlar': [
          ['Ay', 'Satış (₺)', 'Sipariş Sayısı'],
          ...monthlyData.map(data => [data.month, data.sales.toString(), data.orders.toString()])
        ],
        'En Çok Satan Ürünler': [
          ['Ürün Adı', 'Satış Adedi', 'Gelir (₺)', 'Kategori'],
          ...topProducts.map(product => [
            product.name, 
            product.sales.toString(), 
            product.revenue.toLocaleString('tr-TR'),
            product.category || 'Bilinmeyen'
          ])
        ],
        'En Çok Satan Kategoriler': [
          ['Kategori', 'Satış Adedi', 'Gelir (₺)'],
          ...topCategories.map(category => [
            category.name, 
            category.sales.toString(), 
            category.revenue.toLocaleString('tr-TR')
          ])
        ]
      }

      // Kategori raporu varsa ekle
      if (categoryReport) {
        excelData['Kategori Detay Raporu'] = [
          ['Kategori', categoryReport.categoryName],
          ['Toplam Satış', categoryReport.totalSales.toString()],
          ['Toplam Gelir', `₺${categoryReport.totalRevenue.toLocaleString('tr-TR')}`],
          [''],
          ['Ürün Adı', 'Satış Adedi', 'Gelir (₺)'],
          ...categoryReport.products.map(product => [
            product.name,
            product.quantity.toString(),
            product.revenue.toLocaleString('tr-TR')
          ])
        ]
      }

      // CSV formatına çevir
      const csvContent = Object.entries(excelData).map(([sheetName, data]) => {
        const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
        return `${sheetName}\n${csv}\n\n`
      }).join('')

      // Dosyayı indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `rapor_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Excel export error:', error)
      alert('Rapor indirilirken bir hata oluştu')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-sm sm:text-base text-gray-600">Mağaza performansı ve satış analizleri</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base"
          >
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          
          <button 
            onClick={exportToExcel}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center touch-manipulation min-h-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 mr-2 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base"
            />
          </div>
          
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => {
                setSelectedCategory('all')
                setStartDate('')
                setEndDate('')
              }}
              className="w-full bg-gray-500 text-white px-4 py-2.5 rounded-lg hover:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Satış</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">₺{reportData.sales.current.toLocaleString('tr-TR')}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0 ml-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            {reportData.sales.change.startsWith('+') ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <span className={reportData.sales.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {reportData.sales.change}
            </span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Toplam Sipariş</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{reportData.orders.current}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            {reportData.orders.change.startsWith('+') ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <span className={reportData.orders.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {reportData.orders.change}
            </span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Yeni Müşteri</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{reportData.customers.current}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0 ml-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            {reportData.customers.change.startsWith('+') ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <span className={reportData.customers.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {reportData.customers.change}
            </span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Ortalama Sipariş</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">₺{reportData.averageOrder.current.toFixed(2)}</p>
            </div>
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0 ml-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center text-xs sm:text-sm flex-wrap">
            {reportData.averageOrder.change.startsWith('+') ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <span className={reportData.averageOrder.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {reportData.averageOrder.change}
            </span>
            <span className="text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
          </div>
        </div>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Aylık Satışlar</h3>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{data.orders} sipariş</span>
                  <span className="text-sm font-medium text-gray-900">₺{data.sales.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">En Çok Satan Ürünler</h3>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satış Adedi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gelir (₺)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || 'Bilinmeyen'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₺{product.revenue.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{product.category || 'Bilinmeyen'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Satış</p>
                    <p className="font-medium text-gray-900">{product.sales}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gelir</p>
                    <p className="font-medium text-gray-900">₺{product.revenue.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">En Çok Satan Kategoriler</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {topCategories.map((category, index) => (
            <div key={index} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">{category.name}</h4>
              <div className="mt-2 space-y-1">
                <p className="text-xs sm:text-sm text-gray-600">{category.sales} sipariş</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">₺{category.revenue.toLocaleString('tr-TR')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kategori Detay Raporu */}
      {categoryReport && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {categoryReport.categoryName} - Kategori Detay Raporu
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900">Toplam Satış</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{categoryReport.totalSales}</p>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-orange-900">Toplam Sipariş</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{categoryReport.totalOrders}</p>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-green-900">Toplam Gelir</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">₺{categoryReport.totalRevenue.toLocaleString('tr-TR')}</p>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium text-purple-900">Ürün Çeşidi</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{categoryReport.products.length}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-4">Ürün Detayları</h4>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satış Adedi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gelir (₺)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryReport.products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₺{product.revenue.toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {categoryReport.products.map((product, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 truncate mb-2">{product.name}</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Satış</p>
                      <p className="font-medium text-gray-900">{product.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gelir</p>
                      <p className="font-medium text-gray-900">₺{product.revenue.toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 