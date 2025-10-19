import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailClient product={product} />
    </div>
  )
} 