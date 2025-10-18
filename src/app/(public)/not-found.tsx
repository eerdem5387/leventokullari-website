'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sayfa Bulunamadı
          </h1>
          <p className="text-gray-600 mb-8">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Ana Sayfaya Dön
          </Link>

          <Link
            href="/products"
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Search className="h-5 w-5 mr-2" />
            Ürünleri Keşfet
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Yardıma mı ihtiyacınız var?</p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700">
            Bizimle iletişime geçin
          </Link>
        </div>
      </div>
    </div>
  )
} 