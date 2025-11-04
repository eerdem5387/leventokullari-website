import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import Banner from '@/components/ui/Banner'

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

  // Fetch data in parallel with timeout fallbacks (lighter includes)
  const [productsData, total, categories] = await Promise.all([
    withTimeout(
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
      5000,
      [] as any[]
    ),
    withTimeout(prisma.product.count({ where }), 5000, 0),
    withTimeout(
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      5000,
      [] as any[]
    )
  ])

  // Convert Decimal to Number for client compatibility
  const products = (productsData as any[]).map((product: any) => ({
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined
  }))

  const totalPages = Math.ceil((total as number) / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner - Only show on first page without filters */}
      {page === 1 && !params.search && !params.category && <Banner />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600 mt-2">
            {total as number} ürün bulundu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <ProductFilters 
              categories={categories as any[]}
              currentCategory={params.category}
              currentSearch={params.search}
              currentMinPrice={params.minPrice}
              currentMaxPrice={params.maxPrice}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
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
                )}
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