import Link from 'next/link'
import { ArrowRight, Star, Truck, Shield, CreditCard } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import AddToCartButton from '@/components/products/AddToCartButton'

// Force dynamic rendering to ensure database connection works
export const dynamic = 'force-dynamic'

  // Öne çıkan ürünleri getiren fonksiyon
  async function getFeaturedProducts() {
    try {
      console.log('🔍 Fetching featured products...')
      
      const productsData = await (prisma.product as any).findMany({
        where: {
          isFeatured: true,
          isActive: true
        },
        include: {
          category: true,
          _count: {
            select: { reviews: true }
          }
        },
        take: 4,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      })
      
      console.log('📦 Found featured products:', productsData.length)
      productsData.forEach(product => {
        console.log('  -', product.name, '| Featured:', product.isFeatured, '| Active:', product.isActive)
      })
      
      // Decimal değerlerini number'a çevir
      return productsData.map(product => ({
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined
      }))
    } catch (error) {
      console.error('❌ Error fetching featured products:', error)
      return []
    }
  }

// İstatistikleri getiren fonksiyon
async function getStats() {
  try {
    const [totalProducts, totalCustomers] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } })
    ])
    
    return { totalProducts, totalCustomers }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { totalProducts: 0, totalCustomers: 0 }
  }
}

// Popüler ürünleri getiren fonksiyon
async function getPopularProducts() {
  try {
    console.log('🔍 Fetching popular products...')
    
    const productsData = await (prisma.product as any).findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        _count: {
          select: { reviews: true }
        }
      },
      take: 8,
      orderBy: [
        { createdAt: 'desc' }
      ]
    })
    
    console.log('📦 Found popular products:', productsData.length)
    
    // Decimal değerlerini number'a çevir
    return productsData.map(product => ({
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined
    }))
  } catch (error) {
    console.error('❌ Error fetching popular products:', error)
    return []
  }
}

// Popüler kategorileri getiren fonksiyon
async function getPopularCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { 
        isActive: true,
        isPopular: true 
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: {
          select: { products: true }
        }
      },
      take: 8
    })
    
    return categories
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    return []
  }
}

export default async function Home() {
  const [featuredProducts, popularProducts, stats, popularCategories] = await Promise.all([
    getFeaturedProducts(),
    getPopularProducts(),
    getStats(),
    getPopularCategories()
  ])

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
      
      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gray-200/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gray-300/20 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-60 left-1/4 w-12 h-12 bg-gray-400/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-80 right-1/3 w-14 h-14 bg-gray-200/30 rounded-full animate-bounce" style={{animationDelay: '3s'}}></div>
      <div className="absolute bottom-40 left-1/3 w-18 h-18 bg-gray-300/20 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
      
      {/* Hero Section - Eduvalt Style */}
      <section className="relative text-gray-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/90 to-gray-200/90"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-gray-900" style={{fontFamily: 'var(--tg-heading-font-family)'}}>
              Modern E-Ticaret
              <span className="block text-gray-700">
                Deneyimi
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto leading-relaxed" style={{fontFamily: 'var(--tg-body-font-family)'}}>
              Kaliteli ürünleri uygun fiyatlarla keşfedin. Hızlı teslimat, güvenli ödeme ve müşteri memnuniyeti garantisi.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/products"
                className="bg-gray-800 text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 shadow-xl inline-flex items-center justify-center"
                style={{fontFamily: 'var(--tg-heading-font-family)'}}
              >
                Ürünleri Keşfet
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
              <Link
                href="/categories"
                className="border-2 border-gray-800 text-gray-800 px-10 py-4 rounded-xl font-bold hover:bg-gray-800 hover:text-white transition-all duration-300 transform hover:scale-105"
                style={{fontFamily: 'var(--tg-heading-font-family)'}}
              >
                Kategoriler
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Neden Bizi Seçmelisiniz?
            </h2>
            <p className="text-lg text-gray-600">
              Müşteri memnuniyeti odaklı hizmet anlayışımız
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hızlı Teslimat
              </h3>
              <p className="text-gray-600">
                24 saat içinde kargoya teslim ve ücretsiz kargo
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Güvenli Alışveriş
              </h3>
              <p className="text-gray-600">
                256-bit SSL şifreleme ile güvenli ödeme
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Kolay Ödeme
              </h3>
              <p className="text-gray-600">
                Taksitli ödeme seçenekleri ve güvenli ödeme
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products Section */}
      <section className="py-16 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popüler Ürünler
            </h2>
            <p className="text-lg text-gray-600">
              En çok tercih edilen ürünlerimizi keşfedin
            </p>
          </div>

          {popularProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-gray-500">Ürün Resmi</span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full inline-block mb-4 font-medium">
                      {product.category?.name}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 hover:text-gray-600 transition-colors text-lg leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        ({product._count.reviews} değerlendirme)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          ₺{Number(product.price).toLocaleString('tr-TR')}
                        </span>
                        {product.comparePrice && (
                          <span className="text-sm text-gray-500 line-through bg-gray-100 px-2 py-1 rounded ml-2">
                            ₺{Number(product.comparePrice).toLocaleString('tr-TR')}
                          </span>
                        )}
                      </div>
                      <AddToCartButton product={product} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Henüz popüler ürün bulunmuyor.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/products"
              className="inline-flex items-center bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Tüm Ürünleri Gör
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800/90 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold mb-2">{stats.totalProducts}</h3>
              <p className="text-gray-200">Toplam Ürün</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">{stats.totalCustomers}</h3>
              <p className="text-gray-200">Mutlu Müşteri</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popüler Kategoriler
            </h2>
            <p className="text-lg text-gray-600">
              İhtiyacınız olan her şey kategorilerimizde
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularCategories.length > 0 ? (
              popularCategories.map((category, index) => {
                const colors = ['bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800']
                const color = colors[index % colors.length]
                
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className={`${color} text-white rounded-lg p-6 text-center hover:opacity-90 transition-opacity`}
                  >
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <p className="text-sm opacity-90 mt-2">{category._count.products} ürün</p>
                  </Link>
                )
              })
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-gray-500">Henüz popüler kategori bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-800/90 backdrop-blur-sm text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Güncel Kalın
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Yeni ürünler ve kampanyalardan haberdar olun
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="E-posta adresiniz"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Abone Ol
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
