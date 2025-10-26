import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'
import ProductCard from '@/components/products/ProductCard'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  // Direct database access - Server-side optimization
  const productData = await prisma.product.findUnique({
    where: { slug },
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
      reviews: {
        include: {
          user: {
            select: { name: true }
          }
        },
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { reviews: true }
      }
    }
  })

  if (!productData || !productData.isActive) {
    notFound()
  }

  // Fetch similar products from the same category
  const similarProductsData = await prisma.product.findMany({
    where: {
      categoryId: productData.categoryId,
      id: { not: productData.id },
      isActive: true
    },
    include: {
      category: true,
      _count: {
        select: { reviews: true }
      }
    },
    take: 4,
    orderBy: { createdAt: 'desc' }
  })

  // Convert Decimal to Number for client compatibility
  const product = {
    ...productData,
    price: Number(productData.price),
    comparePrice: productData.comparePrice ? Number(productData.comparePrice) : undefined,
    sku: productData.sku || undefined,
    variations: productData.variations.map(variation => ({
      ...variation,
      price: Number(variation.price)
    }))
  }

  const similarProducts = similarProductsData.map(p => ({
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