import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'

interface BlogCategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogCategoryPage({ params }: BlogCategoryPageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  // Kategoriyi ve yazılarını getir
  const [category, posts] = await Promise.all([
    prisma.blogCategory.findUnique({
      where: { slug, isActive: true }
    }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        category: {
          slug,
          isActive: true
        }
      },
      include: {
        author: {
          select: { name: true }
        },
        category: {
          select: { name: true, slug: true }
        },
        tags: {
          include: {
            tag: {
              select: { name: true, slug: true }
            }
          }
        }
      },
      orderBy: { publishedAt: 'desc' }
    })
  ])

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kategori Bulunamadı</h1>
          <p className="text-gray-600 mb-8">Aradığınız kategori mevcut değil.</p>
          <Link
            href="/blog"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Blog'a Dön
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-600 mb-4">
              {category.description}
            </p>
          )}
          <p className="text-gray-500">
            {posts.length} yazı bulundu
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Meta Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {post.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Link
                          key={index}
                          href={`/blog/tag/${tag.tag.slug}`}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag.tag.name}
                        </Link>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{post.tags.length - 3} daha
                        </span>
                      )}
                    </div>
                  )}

                  {/* Read More */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Devamını Oku
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bu kategoride henüz yazı yok</h3>
            <p className="text-gray-500">Yakında bu kategoride güncel içeriklerle burada olacağız.</p>
          </div>
        )}
      </div>
    </div>
  )
}
