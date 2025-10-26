import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import Banner from '@/components/ui/Banner'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
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

  // Fetch data in parallel - Server-side optimization
  const [productsData, total, categories] = await Promise.all([
    (prisma.product as any).findMany({
      where,
      include: {
        category: true,
        variations: {
          include: {
            attributes: {
              include: {
                attributeValue: true
              }
            }
          }
        },
        _count: {
          select: { reviews: true }
        }
      },
      skip,
      take: limit,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  // Convert Decimal to Number for client compatibility
  const products = productsData.map((product: any) => ({
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
    variations: product.variations.map((variation: any) => ({
      ...variation,
      price: Number(variation.price)
    }))
  }))

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner - Only show on first page without filters */}
      {page === 1 && !params.search && !params.category && <Banner />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600 mt-2">
            {total} ürün bulundu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <ProductFilters 
              categories={categories}
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
                  <p className="text-lg font-medium">Ürün bulunamadı</p>
                  <p className="mt-2">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 