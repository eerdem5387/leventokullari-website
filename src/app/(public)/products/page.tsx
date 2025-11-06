import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import Banner from '@/components/ui/Banner'
import { Suspense } from 'react'

export const revalidate = 60

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(fallback)
      })
  })
}

// Critical: Products data (must load fast)
async function getProducts(where: any, skip: number, limit: number) {
  return withTimeout(
    (prisma.product as any).findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        images: true,
        productType: true,
        stock: true,
        category: { select: { name: true } },
        _count: { select: { reviews: true } }
      },
      skip,
      take: limit,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    }),
    2000, // Reduced timeout: 2 seconds
    [] as any[]
  )
}

// Non-critical: Total count (can load later)
async function getTotal(where: any) {
  return withTimeout(prisma.product.count({ where }), 2000, 0)
}

// Non-critical: Categories (can load later)
async function getCategories() {
  return withTimeout(
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    }),
    2000,
    [] as any[]
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 12
  const skip = (page - 1) * limit

  // Build filter conditions
  const where: {
    isActive: boolean
    category?: { slug: string }
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' }
      description?: { contains: string; mode: 'insensitive' }
      sku?: { contains: string; mode: 'insensitive' }
    }>
    price?: { gte?: number; lte?: number }
  } = {
    isActive: true
  }

  if (params.category) {
    where.category = { slug: params.category }
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } }
    ]
  }

  if (params.minPrice || params.maxPrice) {
    where.price = {}
    if (params.minPrice) where.price.gte = parseFloat(params.minPrice)
    if (params.maxPrice) where.price.lte = parseFloat(params.maxPrice)
  }

  // CRITICAL: Load products immediately (blocking)
  const productsData = await getProducts(where, skip, limit)
  const products = (productsData as any[]).map((product: any) => ({
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined
  }))

  // NON-CRITICAL: Load total and categories in parallel (non-blocking with Suspense)
  const totalPromise = getTotal(where)
  const categoriesPromise = getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner - Only show on first page without filters */}
      {page === 1 && !params.search && !params.category && <Banner />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <Suspense fallback={<p className="text-gray-600 mt-2">Yükleniyor...</p>}>
            <ProductCount totalPromise={totalPromise} />
          </Suspense>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Non-critical, load with Suspense */}
          <div className="lg:w-64">
            <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
              <ProductFiltersWrapper 
                categoriesPromise={categoriesPromise}
                currentCategory={params.category}
                currentSearch={params.search}
                currentMinPrice={params.minPrice}
                currentMaxPrice={params.maxPrice}
              />
            </Suspense>
          </div>

          {/* Products Grid - Critical, render immediately */}
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination - Non-critical, load with Suspense */}
                <Suspense fallback={<div className="mt-8 h-10 bg-gray-100 rounded-lg animate-pulse" />}>
                  <Pagination 
                    totalPromise={totalPromise}
                    page={page}
                    params={params}
                    limit={limit}
                  />
                </Suspense>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">Ürünler yüklenemedi veya bulunamadı</p>
                  <p className="mt-2">Lütfen kısa bir süre sonra tekrar deneyin.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Suspense components for non-critical data
async function ProductCount({ totalPromise }: { totalPromise: Promise<number> }) {
  const total = await totalPromise
  return <p className="text-gray-600 mt-2">{total} ürün bulundu</p>
}

async function ProductFiltersWrapper({ 
  categoriesPromise, 
  currentCategory, 
  currentSearch, 
  currentMinPrice, 
  currentMaxPrice 
}: { 
  categoriesPromise: Promise<any[]>
  currentCategory?: string
  currentSearch?: string
  currentMinPrice?: string
  currentMaxPrice?: string
}) {
  const categories = await categoriesPromise
  return (
    <ProductFilters 
      categories={categories}
      currentCategory={currentCategory}
      currentSearch={currentSearch}
      currentMinPrice={currentMinPrice}
      currentMaxPrice={currentMaxPrice}
    />
  )
}

async function Pagination({ 
  totalPromise, 
  page, 
  params, 
  limit 
}: { 
  totalPromise: Promise<number>
  page: number
  params: any
  limit: number
}) {
  const total = await totalPromise
  const totalPages = Math.ceil(total / limit)
  
  if (totalPages <= 1) return null
  
  return (
    <div className="mt-8 flex justify-center">
      <nav className="flex items-center space-x-2">
        {page > 1 && (
          <a
            href={`/products?${new URLSearchParams({
              ...params,
              page: (page - 1).toString()
            })}`}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Önceki
          </a>
        )}
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <a
            key={pageNum}
            href={`/products?${new URLSearchParams({
              ...params,
              page: pageNum.toString()
            })}`}
            className={`px-3 py-2 text-sm font-medium rounded-lg ${
              pageNum === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </a>
        ))}
        
        {page < totalPages && (
          <a
            href={`/products?${new URLSearchParams({
              ...params,
              page: (page + 1).toString()
            })}`}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Sonraki
          </a>
        )}
      </nav>
    </div>
  )
} 