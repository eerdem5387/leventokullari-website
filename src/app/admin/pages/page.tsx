import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminPages() {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sayfalar</h1>
        <form action="/api/pages" method="post" className="flex gap-2">
          <input name="slug" placeholder="slug" className="border px-3 py-2 rounded" />
          <input name="title" placeholder="başlık" className="border px-3 py-2 rounded" />
          <button formAction={async (formData) => {
            'use server'
          }} className="hidden" />
          <Link href="/admin/pages/new" className="px-3 py-2 rounded bg-blue-600 text-white">Yeni Sayfa</Link>
        </form>
      </div>

      <ul className="divide-y border rounded">
        {pages.map(p => (
          <li key={p.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-500">/{p.slug}</div>
            </div>
            <div className="flex gap-3">
              <Link href={`/admin/pages/${p.id}`} className="text-blue-600">Düzenle</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}


