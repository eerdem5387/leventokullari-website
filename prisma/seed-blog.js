const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBlog() {
  console.log('🌱 Seeding blog data...')
  
  try {
    // Blog kategorileri oluştur
    const categories = [
      { name: 'Teknoloji', slug: 'teknoloji', description: 'Teknoloji haberleri ve incelemeler' },
      { name: 'E-ticaret', slug: 'e-ticaret', description: 'E-ticaret ipuçları ve rehberler' },
      { name: 'Pazarlama', slug: 'pazarlama', description: 'Dijital pazarlama stratejileri' },
      { name: 'Ürün İncelemeleri', slug: 'urun-incelemeleri', description: 'Detaylı ürün incelemeleri' }
    ]

    const createdCategories = []
    for (const category of categories) {
      const created = await prisma.blogCategory.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      })
      createdCategories.push(created)
    }

    // Blog etiketleri oluştur
    const tags = [
      { name: 'Next.js', slug: 'nextjs' },
      { name: 'React', slug: 'react' },
      { name: 'E-ticaret', slug: 'e-ticaret' },
      { name: 'SEO', slug: 'seo' },
      { name: 'Pazarlama', slug: 'pazarlama' },
      { name: 'Teknoloji', slug: 'teknoloji' },
      { name: 'Web Geliştirme', slug: 'web-gelistirme' },
      { name: 'Mobil', slug: 'mobil' }
    ]

    const createdTags = []
    for (const tag of tags) {
      const created = await prisma.blogTag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag
      })
      createdTags.push(created)
    }

    // Admin kullanıcısını bul
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      console.log('❌ Admin kullanıcısı bulunamadı')
      return
    }

    // Blog yazıları oluştur
    const posts = [
      {
        title: 'Modern E-ticaret Trendleri 2024',
        slug: 'modern-e-ticaret-trendleri-2024',
        content: 'E-ticaret sektörü 2024 yılında önemli değişimler yaşıyor. Yapay zeka, kişiselleştirme ve mobil ödeme çözümleri öne çıkıyor.',
        excerpt: '2024 yılında e-ticaret sektöründe öne çıkan trendler ve gelecek öngörüleri.',
        featuredImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        metaTitle: 'Modern E-ticaret Trendleri 2024 | Blog',
        metaDescription: '2024 yılında e-ticaret sektöründe öne çıkan trendler ve gelecek öngörüleri.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: createdCategories[1].id, // E-ticaret
        tagIds: [createdTags[2].id, createdTags[5].id] // E-ticaret, Teknoloji
      },
      {
        title: 'Next.js 15 ile Modern Web Geliştirme',
        slug: 'nextjs-15-modern-web-gelistirme',
        content: 'Next.js 15 ile birlikte gelen yeni özellikler ve modern web geliştirme teknikleri.',
        excerpt: 'Next.js 15 ile modern web uygulamaları geliştirme rehberi.',
        featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
        metaTitle: 'Next.js 15 ile Modern Web Geliştirme | Blog',
        metaDescription: 'Next.js 15 ile modern web uygulamaları geliştirme rehberi.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: createdCategories[0].id, // Teknoloji
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[6].id] // Next.js, React, Web Geliştirme
      },
      {
        title: 'E-ticaret SEO Stratejileri',
        slug: 'e-ticaret-seo-stratejileri',
        content: 'E-ticaret siteleri için etkili SEO stratejileri ve uygulama yöntemleri.',
        excerpt: 'E-ticaret sitenizi Google\'da üst sıralara çıkarmak için SEO stratejileri.',
        featuredImage: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=400&fit=crop',
        metaTitle: 'E-ticaret SEO Stratejileri | Blog',
        metaDescription: 'E-ticaret sitenizi Google\'da üst sıralara çıkarmak için SEO stratejileri.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: createdCategories[1].id, // E-ticaret
        tagIds: [createdTags[2].id, createdTags[3].id] // E-ticaret, SEO
      }
    ]

    for (const post of posts) {
      const { tagIds, ...postData } = post
      
      const createdPost = await prisma.blogPost.create({
        data: {
          ...postData,
          authorId: admin.id
        }
      })

      // Etiketleri ekle
      for (const tagId of tagIds) {
        await prisma.blogPostTag.create({
          data: {
            postId: createdPost.id,
            tagId: tagId
          }
        })
      }
    }

    console.log('✅ Blog data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding blog data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedBlog()
