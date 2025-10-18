import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditorClient from './EditorClient'

export const dynamic = 'force-dynamic'

export default async function EditPage({ params }: { params: { id: string } }) {
  const page = await prisma.page.findUnique({
    where: { id: params.id },
    include: { sections: { orderBy: { order: 'asc' } } },
  })
  if (!page) return notFound()

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sayfa Düzenle</h1>
      {/* Client editor wrapper */}
      {/* @ts-expect-error Server-to-Client boundary */}
      <EditorClient page={page as any} />
    </div>
  )
}


