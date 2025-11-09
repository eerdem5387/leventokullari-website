'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Eye, Mail, Calendar } from 'lucide-react'
import { safeLocalStorage, isClient } from '@/lib/browser-utils'

interface Customer {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    orders: number
    addresses: number
  }
  orders: Array<{
    createdAt: string
    finalAmount: number
  }>
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!isClient) {
        setIsLoading(false)
        return
      }
      
      try {
        // Token'ı localStorage'dan al
        const token = safeLocalStorage.getItem('token')
        if (!token) {
          console.error('No token found')
          setCustomers([])
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/users?role=CUSTOMER', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setCustomers(data)
          } else {
            console.error('API returned non-array data:', data)
            setCustomers([])
          }
        } else {
          console.error('Failed to fetch customers:', response.status)
          setCustomers([])
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Müşteriler</h1>
        <p className="text-sm sm:text-base text-gray-600">Müşteri bilgilerini yönetin</p>
      </div>

      {/* Customers Table - Desktop */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sipariş Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toplam Harcama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers && customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer._count.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₺{customer.orders.reduce((sum, order) => sum + Number(order.finalAmount), 0).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Henüz müşteri bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customers Card View - Mobile */}
      <div className="lg:hidden space-y-3">
        {customers && customers.length > 0 ? (
          customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-base font-medium text-gray-700">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{customer.name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-1">{customer.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sipariş Sayısı</p>
                  <p className="text-sm font-medium text-gray-900">{customer._count.orders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Toplam Harcama</p>
                  <p className="text-sm font-medium text-gray-900">
                    ₺{customer.orders.reduce((sum, order) => sum + Number(order.finalAmount), 0).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Kayıt Tarihi</p>
                  <p className="text-sm text-gray-900">{new Date(customer.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Detay
                </Link>
                <a
                  href={`mailto:${customer.email}`}
                  className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center touch-manipulation min-h-[44px] text-sm font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  E-posta
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
            Henüz müşteri bulunmuyor.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Toplam</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Bu Ay</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {customers.filter(c => {
                  const thisMonth = new Date().getMonth()
                  const thisYear = new Date().getFullYear()
                  const customerDate = new Date(c.createdAt)
                  return customerDate.getMonth() === thisMonth && customerDate.getFullYear() === thisYear
                }).length}
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
              <p className="text-xs sm:text-sm font-medium text-gray-600">Aktif</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {customers.filter(c => c._count.orders > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0 mb-2 sm:mb-0">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="sm:ml-3 lg:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Ortalama</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {customers.length > 0 
                  ? (customers.reduce((sum, c) => sum + c._count.orders, 0) / customers.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 