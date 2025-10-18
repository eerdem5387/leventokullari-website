'use server'

import { prisma } from '@/lib/prisma'

export async function savePage(id: string, payload: { title?: string; slug?: string; status?: 'DRAFT' | 'PUBLISHED'; sections?: any[] }) {
    const page = await prisma.page.update({
        where: { id },
        data: {
            title: payload.title,
            slug: payload.slug,
            status: payload.status as any,
        },
    })

    if (Array.isArray(payload.sections)) {
        await prisma.pageSection.deleteMany({ where: { pageId: id } })
        for (let i = 0; i < payload.sections.length; i++) {
            const s = payload.sections[i]
            await prisma.pageSection.create({
                data: {
                    pageId: id,
                    type: s.type,
                    order: s.order ?? i,
                    data: s.data ?? {},
                },
            })
        }
    }

    return page
}


