import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface ContentPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const content = await prisma.content.findUnique({
    where: { slug: resolvedParams.slug }
  })

  if (!content) {
    return {
      title: 'İçerik Bulunamadı'
    }
  }

  return {
    title: content.metaTitle || content.title,
    description: content.metaDescription || content.excerpt,
    openGraph: {
      title: content.metaTitle || content.title,
      description: content.metaDescription || content.excerpt,
      images: content.featuredImage ? [content.featuredImage] : []
    }
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const resolvedParams = await params
  const content = await prisma.content.findUnique({
    where: { 
      slug: resolvedParams.slug,
      status: 'PUBLISHED'
    }
  })

  if (!content) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <span>Ana Sayfa</span>
            <span>/</span>
            <span className="capitalize">{content.type.toLowerCase()}</span>
            <span>/</span>
            <span>{content.title}</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>
          
          {content.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {content.excerpt}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Yayın Tarihi: {new Date(content.publishedAt || content.createdAt).toLocaleDateString('tr-TR')}</span>
            <span>•</span>
            <span className="capitalize">{content.type.toLowerCase()}</span>
          </div>
        </div>

        {/* Featured Image */}
        {content.featuredImage && (
          <div className="mb-8">
            <img
              src={content.featuredImage}
              alt={content.title}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Son güncelleme: {new Date(content.updatedAt).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 