import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createContactFormSchema = z.object({
    name: z.string().min(1, 'Form adı gereklidir'),
    slug: z.string().min(1, 'Slug gereklidir'),
    description: z.string().optional(),
    fields: z.string(), // JSON string
    settings: z.string().optional(), // JSON string
    isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decodedToken = verifyToken(token)
        if (!decodedToken || decodedToken.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const forms = await prisma.contactForm.findMany({
            include: {
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(forms)
    } catch (error) {
        console.error('Error fetching contact forms:', error)
        return NextResponse.json(
            { error: 'İletişim formları getirilemedi' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authorization kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decodedToken = verifyToken(token)
        if (!decodedToken || decodedToken.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validatedData = createContactFormSchema.parse(body)

        // Slug benzersizlik kontrolü
        const existingForm = await prisma.contactForm.findUnique({
            where: { slug: validatedData.slug }
        })

        if (existingForm) {
            return NextResponse.json(
                { error: 'Bu slug zaten kullanılıyor' },
                { status: 400 }
            )
        }

        const form = await prisma.contactForm.create({
            data: validatedData
        })

        return NextResponse.json(form, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating contact form:', error)
        return NextResponse.json(
            { error: 'İletişim formu oluşturulamadı' },
            { status: 500 }
        )
    }
}
