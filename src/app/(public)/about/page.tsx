import { prisma } from '@/lib/prisma'
import { Users, Award, Truck, Shield } from 'lucide-react'
import Link from 'next/link'

// Bu sayfayı dinamik yap
export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  // İstatistikleri getir
  const stats = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } })
  ])

  const [totalProducts, totalCustomers, totalDeliveredOrders] = stats

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hakkımızda
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            2020 yılından beri müşterilerimize en kaliteli ürünleri en uygun fiyatlarla sunuyoruz
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalCustomers.toLocaleString('tr-TR')}</h3>
              <p className="text-gray-600">Mutlu Müşteri</p>
            </div>
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalProducts.toLocaleString('tr-TR')}</h3>
              <p className="text-gray-600">Kaliteli Ürün</p>
            </div>
            <div>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalDeliveredOrders.toLocaleString('tr-TR')}</h3>
              <p className="text-gray-600">Başarılı Teslimat</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Hikayemiz</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  2020 yılında küçük bir ekip olarak başladığımız yolculuğumuzda, 
                  müşterilerimize en kaliteli ürünleri en uygun fiyatlarla sunma 
                  hedefiyle yola çıktık.
                </p>
                <p>
                  Bugün, binlerce mutlu müşterimiz ve yüzlerce kaliteli ürünümüzle 
                  Türkiye&apos;nin önde gelen e-ticaret platformlarından biri haline geldik.
                </p>
                <p>
                  Müşteri memnuniyeti odaklı yaklaşımımız ve sürekli gelişen 
                  teknolojimizle, alışveriş deneyimini daha keyifli hale getirmeye 
                  devam ediyoruz.
                </p>
              </div>
            </div>
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <span className="text-gray-500">Şirket Görseli</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Değerlerimiz</h2>
            <p className="text-lg text-gray-600">
              Bizi biz yapan temel değerler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Güvenilirlik</h3>
              <p className="text-gray-600">
                Müşterilerimizin güvenini kazanmak ve korumak en önemli önceliğimizdir.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Kalite</h3>
              <p className="text-gray-600">
                Sadece en kaliteli ürünleri müşterilerimize sunuyoruz.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hız</h3>
              <p className="text-gray-600">
                Siparişlerinizi en hızlı şekilde kapınıza getiriyoruz.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Odaklılık</h3>
              <p className="text-gray-600">
                Müşteri memnuniyeti bizim için her şeyden önce gelir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ekibimiz</h2>
            <p className="text-lg text-gray-600">
              Başarılarımızın arkasındaki güçlü ekip
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Ahmet Yılmaz',
                position: 'CEO & Kurucu',
                image: '/team/ceo.jpg',
                description: '10+ yıl e-ticaret deneyimi'
              },
              {
                name: 'Ayşe Demir',
                position: 'Operasyon Müdürü',
                image: '/team/operations.jpg',
                description: 'Lojistik ve operasyon uzmanı'
              },
              {
                name: 'Mehmet Kaya',
                position: 'Teknoloji Direktörü',
                image: '/team/tech.jpg',
                description: 'Yazılım ve teknoloji lideri'
              }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center mb-4">
                  <span className="text-gray-500">Fotoğraf</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{member.position}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bizimle Çalışmaya Hazır mısınız?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Kaliteli ürünlerimizi keşfetmek için hemen alışverişe başlayın
          </p>
          <Link
            href="/products"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </section>
    </div>
  )
} 