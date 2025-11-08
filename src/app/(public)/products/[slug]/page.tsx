import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import ProductCard from '@/components/products/ProductCard'

export const revalidate = 300 // Cache for 5 minutes
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

// Removed withTimeout - using Promise.all for better performance

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params
    
    // CRITICAL OPTIMIZATION: Fetch product data first (no timeout for main query)
    const productData = await prisma.product.findUnique({
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
      }
    })

    if (!productData || !productData.isActive) {
      notFound()
    }

    // OPTIMIZATION: Load all data in parallel with error handling
    const [variationsResult, reviewsResult, similarProductsResult] = await Promise.allSettled([
      // Load variations (only if product has variations)
      productData.productType === 'VARIABLE' 
        ? prisma.productVariation.findMany({
            where: { 
              productId: productData.id,
              isActive: true 
            },
            select: {
              id: true,
              price: true,
              stock: true,
              sku: true,
              attributes: {
                select: {
                  id: true,
                  variationId: true,
                  attributeValueId: true,
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
          })
        : Promise.resolve([]),
      
      // Load reviews (limit to 10 most recent)
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
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      
      // Fetch similar products (lazy load - can be moved to client side if needed)
      productData.categoryId
        ? prisma.product.findMany({
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
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        take: 4,
        orderBy: { sortOrder: 'asc', createdAt: 'desc' }
          })
        : Promise.resolve([])
    ])

    // Extract data from results, handling errors gracefully
    const variationsData = variationsResult.status === 'fulfilled' ? variationsResult.value : []
    const reviewsData = reviewsResult.status === 'fulfilled' ? reviewsResult.value : []
    const similarProductsData = similarProductsResult.status === 'fulfilled' ? similarProductsResult.value : []

    // Log errors if any (but don't fail the page)
    if (variationsResult.status === 'rejected') {
      console.error('Error loading variations:', variationsResult.reason)
    }
    if (reviewsResult.status === 'rejected') {
      console.error('Error loading reviews:', reviewsResult.reason)
    }
    if (similarProductsResult.status === 'rejected') {
      console.error('Error loading similar products:', similarProductsResult.reason)
    }

  // Convert Decimal to Number for client compatibility
  const product = {
    ...productData,
    price: Number(productData.price),
    comparePrice: productData.comparePrice ? Number(productData.comparePrice) : undefined,
    sku: productData.sku || undefined,
    variations: Array.isArray(variationsData) 
      ? variationsData.map((variation: any) => ({
          id: variation.id,
          price: Number(variation.price),
          stock: variation.stock,
          sku: variation.sku || undefined,
          attributes: Array.isArray(variation.attributes)
            ? variation.attributes.map((attr: any) => ({
                id: attr.id,
                variationId: attr.variationId || variation.id,
                attributeValueId: attr.attributeValueId || attr.attributeValue?.id,
                attributeValue: {
                  id: attr.attributeValue?.id,
                  attributeId: attr.attributeValue?.attributeId,
                  value: attr.attributeValue?.value
                }
              }))
            : []
        }))
      : [],
    reviews: Array.isArray(reviewsData) 
      ? reviewsData.map((review: any) => ({
          ...review,
          createdAt: review.createdAt instanceof Date 
            ? review.createdAt 
            : new Date(review.createdAt)
        }))
      : [],
    _count: {
      reviews: Array.isArray(reviewsData) ? reviewsData.length : 0
    }
  }

  const similarProducts = Array.isArray(similarProductsData)
    ? similarProductsData
        .filter((p: any) => p && p.id) // Filter out any invalid products
        .map((p: any) => ({
          ...p,
          price: Number(p.price) || 0,
          comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
          _count: p._count || { reviews: 0 },
          category: p.category || { name: '', slug: '', id: '' }
        }))
    : []

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
  } catch (error) {
    console.error('Product page error:', error)
    throw error // Let Next.js error boundary handle it
  }
} 