import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params
        const slug = resolvedParams.slug

        const form = await prisma.contactForm.findUnique({
            where: {
                slug,
                isActive: true
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params
        const slug = resolvedParams.slug
        const body = await request.json()

        // Formu bul
        const form = await prisma.contactForm.findUnique({
            where: {
                slug,
                isActive: true
            }
        })

        if (!form) {
            return NextResponse.json(
                { error: 'İletişim formu bulunamadı' },
                { status: 404 }
            )
        }

        // Form gönderimini kaydet
        const submission = await prisma.contactFormSubmission.create({
            data: {
                formId: form.id,
                data: body.data,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        })

        return NextResponse.json(
            { message: 'Form başarıyla gönderildi', submissionId: submission.id },
            { status: 201 }
        )
    } catch (error) {
        console.error('Submit contact form error:', error)
        return NextResponse.json(
            { error: 'Form gönderilirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
