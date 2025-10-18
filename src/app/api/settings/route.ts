import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { z } from 'zod'

const updateSettingsSchema = z.object({
    settings: z.array(z.object({
        key: z.string(),
        value: z.string(),
        type: z.string().optional(),
        category: z.string().optional()
    }))
})

export async function GET(request: NextRequest) {
    try {
        console.log('Settings API called')

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const where = category ? { category } : {}
        console.log('Where clause:', where)

        const settings = await prisma.settings.findMany({
            where,
            orderBy: { category: 'asc' }
        }).catch((error) => {
            console.log('Settings table not found, returning empty array')
            return []
        })

        console.log('Found settings:', settings.length)

        // Ayarları kategorilere göre grupla
        const groupedSettings = settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = {}
            }

            // Key'den kategori ve alan adını çıkar (örn: "general.siteName" -> "siteName")
            const keyParts = setting.key.split('.')
            const fieldName = keyParts.length > 1 ? keyParts[1] : setting.key

            // Değeri tipine göre dönüştür
            let parsedValue = setting.value
            if (setting.type === 'number') {
                parsedValue = parseFloat(setting.value)
            } else if (setting.type === 'boolean') {
                parsedValue = setting.value === 'true'
            } else if (setting.type === 'json') {
                try {
                    parsedValue = JSON.parse(setting.value)
                } catch {
                    parsedValue = setting.value
                }
            }

            acc[setting.category][fieldName] = parsedValue
            return acc
        }, {} as Record<string, any>)

        console.log('Grouped settings:', groupedSettings)

        return NextResponse.json(groupedSettings)
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Ayarlar getirilirken bir hata oluştu' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { settings } = updateSettingsSchema.parse(body)

        // Mevcut ayarları güncelle veya yeni ayar ekle
        const results = await Promise.all(
            settings.map(async (setting) => {
                return await prisma.settings.upsert({
                    where: { key: setting.key },
                    update: {
                        value: setting.value,
                        type: setting.type || 'string',
                        category: setting.category || 'general'
                    },
                    create: {
                        key: setting.key,
                        value: setting.value,
                        type: setting.type || 'string',
                        category: setting.category || 'general'
                    }
                })
            })
        )

        return NextResponse.json({
            message: 'Ayarlar başarıyla güncellendi',
            updatedCount: results.length
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Geçersiz veri formatı', details: error.issues }, { status: 400 })
        }
        console.error('Error updating settings:', error)
        return NextResponse.json({ error: 'Ayarlar güncellenirken bir hata oluştu' }, { status: 500 })
    }
} 