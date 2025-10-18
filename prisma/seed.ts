import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Upsert home page
    const page = await prisma.page.upsert({
        where: { slug: 'home' },
        update: { title: 'Anasayfa', status: 'PUBLISHED' },
        create: { slug: 'home', title: 'Anasayfa', status: 'PUBLISHED' },
    })

    const sections = [
        { type: 'hero', order: 0, data: { title: 'Merhaba!', subtitle: 'Yeni siteniz hazır.' } },
        { type: 'rich_text', order: 1, data: { html: '<p>Bu metni yönetim panelinden düzenleyebilirsiniz.</p>' } },
    ]

    await prisma.pageSection.deleteMany({ where: { pageId: page.id } })
    for (const s of sections) {
        await prisma.pageSection.create({ data: { pageId: page.id, ...s } })
    }
}

main().finally(async () => {
    await prisma.$disconnect()
})

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Admin kullanıcısı oluştur
    const adminPassword = await hashPassword('admin123')
    const admin = await prisma.user.upsert({
        where: { email: 'admin@emagaza.com' },
        update: {},
        create: {
            email: 'admin@emagaza.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'ADMIN'
        }
    })

    // Test müşterisi oluştur
    const customerPassword = await hashPassword('customer123')
    const customer = await prisma.user.upsert({
        where: { email: 'customer@test.com' },
        update: {},
        create: {
            email: 'customer@test.com',
            password: customerPassword,
            name: 'Test Customer',
            role: 'CUSTOMER'
        }
    })

    // Kategoriler oluştur
    const electronics = await prisma.category.upsert({
        where: { slug: 'elektronik' },
        update: { isPopular: true },
        create: {
            name: 'Elektronik',
            slug: 'elektronik',
            description: 'Elektronik ürünler',
            isPopular: true
        }
    })

    const clothing = await prisma.category.upsert({
        where: { slug: 'giyim' },
        update: { isPopular: true },
        create: {
            name: 'Giyim',
            slug: 'giyim',
            description: 'Giyim ürünleri',
            isPopular: true
        }
    })

    const home = await prisma.category.upsert({
        where: { slug: 'ev-yasam' },
        update: { isPopular: true },
        create: {
            name: 'Ev & Yaşam',
            slug: 'ev-yasam',
            description: 'Ev ve yaşam ürünleri',
            isPopular: true
        }
    })

    // Ürün özellikleri oluştur
    const colorAttr = await prisma.productAttribute.upsert({
        where: { name: 'Renk' },
        update: {},
        create: {
            name: 'Renk',
            type: 'SELECT'
        }
    })

    const sizeAttr = await prisma.productAttribute.upsert({
        where: { name: 'Beden' },
        update: {},
        create: {
            name: 'Beden',
            type: 'SELECT'
        }
    })

    // Özellik değerleri oluştur
    const redColor = await prisma.productAttributeValue.upsert({
        where: {
            attributeId_value: {
                attributeId: colorAttr.id,
                value: 'Kırmızı'
            }
        },
        update: {},
        create: {
            attributeId: colorAttr.id,
            value: 'Kırmızı'
        }
    })

    const blueColor = await prisma.productAttributeValue.upsert({
        where: {
            attributeId_value: {
                attributeId: colorAttr.id,
                value: 'Mavi'
            }
        },
        update: {},
        create: {
            attributeId: colorAttr.id,
            value: 'Mavi'
        }
    })

    const smallSize = await prisma.productAttributeValue.upsert({
        where: {
            attributeId_value: {
                attributeId: sizeAttr.id,
                value: 'S'
            }
        },
        update: {},
        create: {
            attributeId: sizeAttr.id,
            value: 'S'
        }
    })

    const mediumSize = await prisma.productAttributeValue.upsert({
        where: {
            attributeId_value: {
                attributeId: sizeAttr.id,
                value: 'M'
            }
        },
        update: {},
        create: {
            attributeId: sizeAttr.id,
            value: 'M'
        }
    })

    const largeSize = await prisma.productAttributeValue.upsert({
        where: {
            attributeId_value: {
                attributeId: sizeAttr.id,
                value: 'L'
            }
        },
        update: {},
        create: {
            attributeId: sizeAttr.id,
            value: 'L'
        }
    })

    // Normal ürün oluştur
    const simpleProduct = await prisma.product.upsert({
        where: { slug: 'iphone-15' },
        update: { isFeatured: true },
        create: {
            name: 'iPhone 15',
            slug: 'iphone-15',
            description: 'Apple iPhone 15 128GB - En yeni iPhone modeli',
            price: 29999.99,
            comparePrice: 32999.99,
            images: ['https://via.placeholder.com/400x400?text=iPhone+15'],
            stock: 50,
            sku: 'IPH15-128',
            categoryId: electronics.id,
            productType: 'SIMPLE',
            isActive: true,
            isFeatured: true
        }
    })

    // Varyasyonlu ürün oluştur
    const variableProduct = await prisma.product.upsert({
        where: { slug: 'tshirt-basic' },
        update: { isFeatured: true },
        create: {
            name: 'Basic T-Shirt',
            slug: 'tshirt-basic',
            description: 'Pamuklu basic t-shirt - Rahat ve şık',
            price: 99.99,
            comparePrice: 129.99,
            images: ['https://via.placeholder.com/400x400?text=Basic+T-Shirt'],
            stock: 0, // Varyasyonlarda stok tutulacak
            sku: 'TSHIRT-BASIC',
            categoryId: clothing.id,
            productType: 'VARIABLE',
            isActive: true,
            isFeatured: true
        }
    })

    // Varyasyonlu ürün için varyasyonlar oluştur
    const variation1 = await prisma.productVariation.create({
        data: {
            productId: variableProduct.id,
            sku: 'TSHIRT-BASIC-RED-S',
            price: 99.99,
            stock: 25
        }
    })

    const variation2 = await prisma.productVariation.create({
        data: {
            productId: variableProduct.id,
            sku: 'TSHIRT-BASIC-RED-M',
            price: 99.99,
            stock: 30
        }
    })

    const variation3 = await prisma.productVariation.create({
        data: {
            productId: variableProduct.id,
            sku: 'TSHIRT-BASIC-BLUE-M',
            price: 99.99,
            stock: 20
        }
    })

    // Varyasyon özelliklerini bağla
    await prisma.productVariationAttribute.createMany({
        data: [
            { variationId: variation1.id, attributeValueId: redColor.id },
            { variationId: variation1.id, attributeValueId: smallSize.id },
            { variationId: variation2.id, attributeValueId: redColor.id },
            { variationId: variation2.id, attributeValueId: mediumSize.id },
            { variationId: variation3.id, attributeValueId: blueColor.id },
            { variationId: variation3.id, attributeValueId: mediumSize.id }
        ]
    })

    // Daha fazla ürün ekle
    const products = [
        {
            name: 'Samsung Galaxy S24',
            slug: 'samsung-galaxy-s24',
            description: 'Samsung Galaxy S24 256GB - Güçlü performans',
            price: 24999.99,
            comparePrice: 26999.99,
            images: ['https://via.placeholder.com/400x400?text=Samsung+S24'],
            stock: 30,
            sku: 'SAMS24-256',
            categoryId: electronics.id,
            isFeatured: true
        },
        {
            name: 'MacBook Air M2',
            slug: 'macbook-air-m2',
            description: 'Apple MacBook Air M2 13" 256GB - Hafif ve güçlü',
            price: 39999.99,
            comparePrice: 42999.99,
            images: ['https://via.placeholder.com/400x400?text=MacBook+Air+M2'],
            stock: 15,
            sku: 'MBA-M2-256',
            categoryId: electronics.id,
            isFeatured: true
        },
        {
            name: 'Kot Pantolon',
            slug: 'kot-pantolon',
            description: 'Klasik kot pantolon - Rahat ve şık',
            price: 299.99,
            comparePrice: 399.99,
            images: ['https://via.placeholder.com/400x400?text=Kot+Pantolon'],
            stock: 100,
            sku: 'JEANS-CLASSIC',
            categoryId: clothing.id
        },
        {
            name: 'Kahve Makinesi',
            slug: 'kahve-makinesi',
            description: 'Otomatik kahve makinesi - Lezzetli kahve',
            price: 899.99,
            comparePrice: 1099.99,
            images: ['https://via.placeholder.com/400x400?text=Kahve+Makinesi'],
            stock: 25,
            sku: 'COFFEE-AUTO',
            categoryId: home.id
        }
    ]

    for (const productData of products) {
        await prisma.product.upsert({
            where: { slug: productData.slug },
            update: {},
            create: {
                ...productData,
                productType: 'SIMPLE',
                isActive: true
            }
        })
    }

    // Test adresi oluştur
    await prisma.address.upsert({
        where: { id: 'test-address-1' },
        update: {},
        create: {
            id: 'test-address-1',
            userId: customer.id,
            title: 'Ev',
            firstName: 'Test',
            lastName: 'Customer',
            phone: '+90 555 123 4567',
            country: 'Türkiye',
            city: 'İstanbul',
            district: 'Kadıköy',
            fullAddress: 'Test Mahallesi, Test Sokak No:1 Daire:1',
            isDefault: true
        }
    })

    console.log('✅ Database seeded successfully!')
    console.log('👤 Admin: admin@emagaza.com / admin123')
    console.log('👤 Customer: customer@test.com / customer123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    }) 