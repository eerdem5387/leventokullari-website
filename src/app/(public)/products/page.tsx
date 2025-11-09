import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'

export const revalidate = 300 // ISR: Cache for 5 minutes (increased for better performance)
export const dynamic = 'force-dynamic' // Force dynamic rendering for search params

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  try {
    const params = await searchParams
    const page = parseInt(params.page || '1', 10)
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

    // CRITICAL OPTIMIZATION: Use select instead of include - only fetch what we need
    // Removed variations, attributes, _count - not needed for product listing
    
    // Fetch all data in parallel with error handling
    const [productsResult, totalResult, categoriesResult] = await Promise.allSettled([
      prisma.product.findMany({
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          // REMOVED: variations, attributes - saves massive query time
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
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true
        }
      })
    ])

    // Handle errors gracefully
    if (productsResult.status === 'rejected') {
      console.error('Error fetching products:', productsResult.reason)
      throw new Error('Ürünler yüklenirken bir hata oluştu')
    }

    const productsData = productsResult.status === 'fulfilled' ? productsResult.value : []
    const total = totalResult.status === 'fulfilled' ? totalResult.value : 0
    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []

    // Convert Decimal to Number for client compatibility
    const products = Array.isArray(productsData) ? productsData.map((product: any) => ({
      ...product,
      price: product.price ? Number(product.price) : 0,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      category: product.category || null
    })) : []

    const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {total} ürün bulundu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Filters Sidebar - Mobile: Hidden by default, can be toggled */}
          <div className="lg:w-64 hidden lg:block">
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
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                        ...(params.search ? { search: params.search } : {}),
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
  } catch (error) {
    console.error('Products page error:', error)
    // Re-throw to let Next.js error boundary handle it
    throw error
  }
}
