import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getBlogPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
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
      orderBy: { publishedAt: 'desc' },
      take: 12
    })

    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

async function getBlogCategories() {
  try {
    const categories = await prisma.blogCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return categories
  } catch (error) {
    console.error('Error fetching blog categories:', error)
    return []
  }
}

async function getPopularTags() {
  try {
    const tags = await prisma.blogTag.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        posts: {
          _count: 'desc'
        }
      },
      take: 10
    })

    return tags
  } catch (error) {
    console.error('Error fetching popular tags:', error)
    return []
  }
}

export default async function BlogPage() {
  const [posts, categories, popularTags] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
    getPopularTags()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Blog
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">
              & İpuçları
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Güncel haberler, ipuçları, rehberler ve daha fazlası ile bilgi dünyasında kalın
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map((post) => (
                  <article key={post.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      </div>
                    )}

                    <div className="p-8">
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

                      {/* Category */}
                      {post.category && (
                        <div className="mb-3">
                          <Link
                            href={`/blog/category/${post.category.slug}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            {post.category.name}
                          </Link>
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        <Link href={`/blog/${post.slug}`} className="hover:text-gray-600 transition-colors">
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
                        className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium transition-colors"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz blog yazısı yok</h3>
                <p className="text-gray-500">Yakında güncel içeriklerle burada olacağız.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Kategoriler</h3>
                  <ul className="space-y-3">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/blog/category/${category.slug}`}
                          className="flex items-center justify-between text-gray-600 hover:text-gray-800 transition-colors p-3 rounded-xl hover:bg-gray-50"
                        >
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">({category._count.posts})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Popüler Etiketler</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag.name}
                        <span className="ml-1 text-xs text-gray-500">({tag._count.posts})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-gray-800 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Bülten</h3>
                <p className="text-gray-200 mb-4">
                  Yeni blog yazılarından haberdar olmak için bültenimize abone olun.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="E-posta adresiniz"
                    className="w-full px-3 py-2 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <button className="w-full bg-white text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors">
                    Abone Ol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
