import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/products/ProductDetailClient'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const productData = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
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

  // Decimal değerlerini number'a çevir
  const product = productData ? {
    ...productData,
    price: Number(productData.price),
    comparePrice: productData.comparePrice ? Number(productData.comparePrice) : undefined,
    sku: productData.sku || undefined,
    variations: productData.variations.map(variation => ({
      ...variation,
      price: Number(variation.price)
    }))
  } : null

  if (!product || !product.isActive) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailClient product={product} />
    </div>
  )
} 