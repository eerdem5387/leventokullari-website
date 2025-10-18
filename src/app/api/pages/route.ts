import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const pages = await prisma.page.findMany({
        orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { slug, title, status } = body
    const page = await prisma.page.create({
        data: { slug, title, status },
    })
    return NextResponse.json(page, { status: 201 })
}


