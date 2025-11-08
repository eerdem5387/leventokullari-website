import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 8 // Reduced from 12 to 8 for better performance
  const skip = (page - 1) * limit

  // Build filter conditions - simplified (no price range)
  const where: {
    isActive: boolean
    category?: { slug: string }
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' }
      description?: { contains: string; mode: 'insensitive' }
      sku?: { contains: string; mode: 'insensitive' }
    }>
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

                {/* Simple Previous/Next Navigation */}
                <div className="mt-8 flex justify-center items-center space-x-4">
                  {page > 1 && (
                    <a
                      href={`/products?${new URLSearchParams({
                        ...(params.category ? { category: params.category } : {}),
                        ...(params.search ? { search: params.search } : {}),
                        page: (page - 1).toString()
                      })}`}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Önceki
                    </a>
                  )}
                  
                  <span className="text-sm text-gray-600">
                    Sayfa {page} / {totalPages}
                  </span>
                  
                  {page < totalPages && (
                    <a
                      href={`/products?${new URLSearchParams({
                        ...(params.category ? { category: params.category } : {}),
                        page: (page + 1).toString()
                      })}`}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Sonraki →
                    </a>
                  )}
                </div>
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