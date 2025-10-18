const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedMenus() {
  console.log('🌱 Seeding menus...')
  
  try {
    // Header menüsü oluştur
    const headerMenu = await prisma.menu.upsert({
      where: { location: 'header' },
      update: {},
      create: {
        name: 'Ana Menü',
        location: 'header',
        isActive: true
      }
    })

    // Header menü öğeleri
    const headerItems = [
      { title: 'Ana Sayfa', url: '/', order: 1 },
      { title: 'Ürünler', url: '/products', order: 2 },
      { title: 'Kategoriler', url: '/categories', order: 3 },
      { title: 'Blog', url: '/blog', order: 4 },
      { title: 'İletişim', url: '/contact', order: 5 }
    ]

    for (const item of headerItems) {
      await prisma.menuItem.create({
        data: {
          menuId: headerMenu.id,
          title: item.title,
          url: item.url,
          order: item.order,
          isActive: true
        }
      })
    }

    // Footer menüsü oluştur
    const footerMenu = await prisma.menu.upsert({
      where: { location: 'footer' },
      update: {},
      create: {
        name: 'Footer Menü',
        location: 'footer',
        isActive: true
      }
    })

    // Footer menü öğeleri
    const footerItems = [
      { title: 'Hakkımızda', url: '/about', order: 1 },
      { title: 'Gizlilik Politikası', url: '/privacy', order: 2 },
      { title: 'Kargo Bilgileri', url: '/shipping', order: 3 },
      { title: 'İade ve Değişim', url: '/returns', order: 4 }
    ]

    for (const item of footerItems) {
      await prisma.menuItem.create({
        data: {
          menuId: footerMenu.id,
          title: item.title,
          url: item.url,
          order: item.order,
          isActive: true
        }
      })
    }

    console.log('✅ Menus seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding menus:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMenus()
