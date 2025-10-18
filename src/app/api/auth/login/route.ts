import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Geçerli bir email adresi giriniz'),
    password: z.string().min(1, 'Şifre gereklidir'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        // Kullanıcıyı bul
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Geçersiz email veya şifre' },
                { status: 401 }
            )
        }

        // Şifreyi kontrol et
        const isPasswordValid = await comparePassword(password, user.password)

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Geçersiz email veya şifre' },
                { status: 401 }
            )
        }

        // JWT token oluştur
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        })

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Geçersiz veri formatı', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Giriş işlemi sırasında bir hata oluştu' },
            { status: 500 }
        )
    }
} 