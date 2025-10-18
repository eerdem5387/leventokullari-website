import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    const page = await prisma.page.findUnique({
        where: { id: params.id },
        include: { sections: { orderBy: { order: 'asc' } } },
    })
    if (!page) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json(page)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const body = await req.json()
    const { slug, title, status, sections } = body

    const page = await prisma.$transaction(async (tx) => {
        const updated = await tx.page.update({
            where: { id: params.id },
            data: { slug, title, status },
        })

        if (Array.isArray(sections)) {
            // Replace sections: simple strategy for MVP
            await tx.pageSection.deleteMany({ where: { pageId: params.id } })
            for (const [index, section] of sections.entries()) {
                await tx.pageSection.create({
                    data: {
                        pageId: params.id,
                        type: section.type,
                        order: section.order ?? index,
                        data: section.data ?? {},
                    },
                })
            }
        }

        return updated
    })

    return NextResponse.json(page)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    await prisma.page.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
}


