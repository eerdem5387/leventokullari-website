'use client'

// KALICI ÇÖZÜM: Static generation'ı kapat
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, status: 'DRAFT' }),
      })
      if (!res.ok) throw new Error('Sayfa oluşturulamadı')
      const page = await res.json()
      router.push(`/admin/pages/${page.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Yeni Sayfa</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Başlık</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="home, about, contact..." required />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-60">
          {loading ? 'Oluşturuluyor...' : 'Oluştur'}
        </button>
      </form>
    </div>
  )
}


