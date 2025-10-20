import Link from 'next/link'
import './page.client'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic'

// Server-side data fetching - Direct database access
async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true
      },
      take: 6,
      include: {
        category: true,
        images: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })
    return products
  } catch (error) {
    console.log('Database error, using fallback:', error)
    return []
  }
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {/* Client side-effect imported above ensures client manifest generation */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Levent Okulları
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Eğitimde Mükemmellik
          </p>
          
          {/* Öne Çıkan Ürünler */}
          {featuredProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Öne Çıkan Ürünler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    <div className="text-blue-600 font-bold">
                      {product.price.toString()} TL
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Kaliteli Eğitim</h3>
              <p className="text-gray-600">
                Modern eğitim anlayışı ile öğrencilerimizi geleceğe hazırlıyoruz.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Deneyimli Öğretmenler</h3>
              <p className="text-gray-600">
                Alanında uzman öğretmen kadromuz ile eğitim kalitesini garanti ediyoruz.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Modern Teknoloji</h3>
              <p className="text-gray-600">
                En son teknolojiler ile donatılmış sınıflarımızda eğitim veriyoruz.
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-x-4">
            <Link 
              href="/about" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Hakkımızda
            </Link>
            <Link 
              href="/products" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ürünler
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}