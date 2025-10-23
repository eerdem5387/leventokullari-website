import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyToken } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
    try {
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

        const data = await request.formData()
        const file: File | null = data.get('file') as unknown as File

        if (!file) {
            return NextResponse.json(
                { error: 'Dosya bulunamadı' },
                { status: 400 }
            )
        }

        // Dosya tipini kontrol et
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Sadece görsel dosyaları yüklenebilir' },
                { status: 400 }
            )
        }

        // Dosya boyutunu kontrol et (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Dosya boyutu 5MB\'dan büyük olamaz' },
                { status: 400 }
            )
        }

        // Dosya adını oluştur
        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const fileName = `products/${timestamp}.${extension}`

        // Vercel Blob'a yükle
        const blob = await put(fileName, file, {
            access: 'public',
            addRandomSuffix: false,
        })

        return NextResponse.json({
            success: true,
            url: blob.url,
            fileName: fileName
        })

    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Dosya yüklenirken bir hata oluştu' },
            { status: 500 }
        )
    }
}
