'use client'

import { useState } from 'react'
import SectionEditor, { Section } from './editor/SectionEditor'
import { savePage } from './actions'
import { useRouter } from 'next/navigation'

interface Props {
  page: { id: string; title: string; slug: string; status: 'DRAFT'|'PUBLISHED'; sections: Section[] }
}

export default function EditorClient({ page }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const [status, setStatus] = useState(page.status)
  const [sections, setSections] = useState<Section[]>(page.sections)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await savePage(page.id, { title, slug, status, sections })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Başlık</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm mb-1">Durum</label>
          <select value={status} onChange={e=>setStatus(e.target.value as any)} className="w-full border px-3 py-2 rounded">
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayında</option>
          </select>
        </div>
      </div>
      <SectionEditor sections={sections} onChange={setSections} />
      {error && <div className="text-red-600 text-sm mt-4">{error}</div>}
      <div className="mt-6 flex gap-3">
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded bg-gray-900 text-white disabled:opacity-60">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </div>
  )
}


