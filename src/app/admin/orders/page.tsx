'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Eye, Package, DollarSign, Edit } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  finalAmount: number
  createdAt: string
  user: {
    name: string
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    product: {
      name: string
      images: string[]
    }
    variation?: {
      id: string
      attributes: Array<{
        attributeValue: {
          value: string
          attribute: {
            name: string
          }
        }
      }>
    }
  }>
  _count?: {
    items: number
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; currentStatus: string } | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Token'ı localStorage'dan al
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          setOrders([])
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Orders data received:', data)
          if (Array.isArray(data)) {
            setOrders(data)
          } else {
            console.error('API returned non-array data:', data)
            setOrders([])
          }
        } else {
          console.error('Failed to fetch orders:', response.status)
          setOrders([])
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Beklemede'
      case 'COMPLETED':
        return 'Tamamlandı'
      case 'FAILED':
        return 'Başarısız'
      default:
        return status
    }
  }

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    setSelectedOrder({ id: orderId, currentStatus })
    setNewStatus(currentStatus)
    setShowStatusModal(true)
  }

  const handleStatusSave = async () => {
    if (!selectedOrder || !newStatus) return

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Yetkilendirme gerekli')
      }

      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Durum güncellendi: ${getStatusText(selectedOrder.currentStatus)} → ${getStatusText(newStatus)}`
        })
      })

      if (!response.ok) {
        throw new Error('Sipariş durumu güncellenirken bir hata oluştu')
      }

      // Sipariş listesini yenile
      const ordersResponse = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (ordersResponse.ok) {
        const updatedOrders = await ordersResponse.json()
        setOrders(updatedOrders)
      }

      setShowStatusModal(false)
      setSelectedOrder(null)
      setNewStatus('')
      alert('Sipariş durumu başarıyla güncellendi')
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Sipariş durumu güncellenirken bir hata oluştu')
    } finally {
      setIsUpdating(false)
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Siparişler</h1>
        <p className="text-sm sm:text-base text-gray-600">Tüm siparişleri yönetin</p>
      </div>

      {/* Orders Table - Desktop */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden hidden lg:block">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.items && order.items.length > 0 ? (
                            order.items.length === 1 ? (
                              <div>
                                <div>{order.items[0].product.name}</div>
                                {order.items[0].variation && order.items[0].variation.attributes && order.items[0].variation.attributes.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {order.items[0].variation.attributes.map((attr, index) => (
                                      <span key={index}>
                                        {attr.attributeValue.attribute.name}: {attr.attributeValue.value}
                                        {index < order.items[0].variation!.attributes.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              `${order.items[0].product.name} ve ${order.items.length - 1} ürün daha`
                            )
                          ) : (
                            'Ürün bilgisi yok'
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order._count?.items || order.items?.length || 0} ürün
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      ₺{Number(order.finalAmount).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {getPaymentStatusText(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStatusUpdate(order.id, order.status)
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Durum Güncelle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Henüz sipariş bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Card View - Mobile */}
      <div className="lg:hidden space-y-3">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                    {order.items && order.items.length > 0 ? (
                      order.items.length === 1 ? (
                        order.items[0].product.name
                      ) : (
                        `${order.items[0].product.name} ve ${order.items.length - 1} ürün daha`
                      )
                    ) : (
                      'Ürün bilgisi yok'
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.user.name}</p>
                </div>
                <div className="ml-2 flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tutar</p>
                  <p className="text-sm font-semibold text-gray-900">₺{Number(order.finalAmount).toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tarih</p>
                  <p className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Ürün Sayısı</p>
                  <p className="text-sm text-gray-900">{order._count?.items || order.items?.length || 0} ürün</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusUpdate(order.id, order.status)
                  }}
                  className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Durum Güncelle
                </button>
                <a
                  href={`/admin/orders/${order.id}`}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  Detay
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
            Henüz sipariş bulunmuyor.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Gelir</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                ₺{orders
                  .filter(o => o.paymentStatus === 'COMPLETED')
                  .reduce((sum, o) => sum + Number(o.finalAmount), 0)
                  .toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Teslim</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Durum Güncelleme Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 safe-area-inset">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Sipariş Durumu Güncelle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mevcut Durum
                </label>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.currentStatus)}`}>
                    {getStatusText(selectedOrder.currentStatus)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Durum
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base"
                >
                  <option value="PENDING">Beklemede</option>
                  <option value="CONFIRMED">Onaylandı</option>
                  <option value="SHIPPED">Kargoda</option>
                  <option value="DELIVERED">Teslim Edildi</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleStatusSave}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
              >
                {isUpdating ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedOrder(null)
                  setNewStatus('')
                }}
                disabled={isUpdating}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 touch-manipulation min-h-[44px]"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 