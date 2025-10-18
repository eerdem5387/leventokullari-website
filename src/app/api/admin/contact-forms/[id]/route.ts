import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const formId = resolvedParams.id

        const form = await prisma.contactForm.findUnique({
            where: { id: formId },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
        })

        if (!form) {
            return NextResponse.json(
                { error: 'İletişim formu bulunamadı' },
                { status: 404 }
            )
        }

        return NextResponse.json(form)
    } catch (error) {
        console.error('Get contact form error:', error)
        return NextResponse.json(
            { error: 'İletişim formu getirilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const formId = resolvedParams.id
        const body = await request.json()

        // Yetkilendirme kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        // İletişim formunu güncelle
        const updatedForm = await prisma.contactForm.update({
            where: { id: formId },
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description,
                fields: body.fields,
                settings: body.settings,
                isActive: body.isActive
            },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
        })

        return NextResponse.json(updatedForm)
    } catch (error) {
        console.error('Update contact form error:', error)
        return NextResponse.json(
            { error: 'İletişim formu güncellenirken bir hata oluştu' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params
        const formId = resolvedParams.id

        // Yetkilendirme kontrolü
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Yetkilendirme gerekli' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const decoded = verifyToken(token)
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin yetkisi gerekli' },
                { status: 403 }
            )
        }

        // İletişim formunu sil (gönderimler cascade ile silinecek)
        await prisma.contactForm.delete({
            where: { id: formId }
        })

        return NextResponse.json(
            { message: 'İletişim formu başarıyla silindi' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Delete contact form error:', error)
        return NextResponse.json(
            { error: 'İletişim formu silinirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
