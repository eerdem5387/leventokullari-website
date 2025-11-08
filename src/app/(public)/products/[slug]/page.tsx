import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import ProductCard from '@/components/products/ProductCard'

export const revalidate = 120

interface ProductPageProps {
  params: Promise<{
    slug: string
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  // CRITICAL OPTIMIZATION: Fetch only essential data first, variations later if needed
  const productData = await withTimeout(
    prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        images: true,
        productType: true,
        stock: true,
        sku: true,
        isActive: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        categoryId: true
        // REMOVED: variations, reviews, _count - will load separately if needed
      }
    }),
    2000, // Reduced timeout: 2 seconds
    null
  )

  if (!productData || !productData.isActive) {
    notFound()
  }

  // Load variations separately (only if product has variations)
  const variationsData = productData.productType === 'VARIABLE' 
    ? await withTimeout(
        prisma.productVariation.findMany({
          where: { productId: productData.id },
          select: {
            id: true,
            price: true,
            stock: true,
            sku: true,
            attributes: {
              select: {
                attributeValue: {
                  select: {
                    id: true,
                    attributeId: true,
                    value: true
                  }
                }
              }
            }
          }
        }),
        2000,
        []
      )
    : []

  // Load reviews separately (limit to 10 most recent)
  const reviewsData = await withTimeout(
    prisma.review.findMany({
      where: { 
        productId: productData.id,
        isApproved: true 
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: { name: true }
        }
      },
      take: 10, // Limit to 10 reviews
      orderBy: { createdAt: 'desc' }
    }),
    2000,
    []
  )

  // Fetch similar products - OPTIMIZED: use select instead of include
  const similarProductsData = await withTimeout(
    prisma.product.findMany({
      where: {
        categoryId: productData.categoryId,
        id: { not: productData.id },
        isActive: true
      },
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
        }
        // REMOVED: _count - not needed for listing
      },
      take: 4,
      orderBy: { createdAt: 'desc' }
    }),
    2000,
    [] as any[]
  )

  // Convert Decimal to Number for client compatibility
  const product = {
    ...productData,
    price: Number(productData.price),
    comparePrice: productData.comparePrice ? Number(productData.comparePrice) : undefined,
    sku: productData.sku || undefined,
    variations: variationsData.map((variation: any) => ({
      ...variation,
      price: Number(variation.price),
      attributes: variation.attributes.map((attr: any) => ({
        attributeValue: {
          attributeId: attr.attributeValue.attributeId,
          value: attr.attributeValue.value
        }
      }))
    })),
    reviews: reviewsData,
    _count: {
      reviews: reviewsData.length
    }
  }

  const similarProducts = similarProductsData.map((p: any) => ({
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailClient product={product} />
      
      {/* Similar Products Section */}
      {similarProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="w-1 h-10 bg-blue-600 mr-4 rounded-full"></span>
              Benzer Ürünler
            </h2>
            <p className="text-gray-600 mt-2 ml-5">Aynı kategorideki diğer ürünler</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((similarProduct) => (
              <ProductCard key={similarProduct.id} product={similarProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 