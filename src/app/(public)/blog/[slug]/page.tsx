import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, User, Tag, ArrowLeft, Share2 } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const post = await prisma.blogPost.findUnique({
    where: { 
      slug: resolvedParams.slug,
      status: 'PUBLISHED'
    }
  })

  if (!post) {
    return {
      title: 'Blog Yazısı Bulunamadı'
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.featuredImage ? [post.featuredImage] : []
    }
  }
}

async function getBlogPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { 
        slug: slug,
        status: 'PUBLISHED'
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
      }
    })

    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

async function getRelatedPosts(currentPostId: string, categoryId?: string) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: currentPostId },
        ...(categoryId && { categoryId })
      },
      include: {
        author: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: 3
    })

    return posts
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return []
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params
  const post = await getBlogPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.id, post.categoryId || undefined)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Blog'a Dön
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-700">Blog</Link>
            {post.category && (
              <>
                <span>/</span>
                <Link 
                  href={`/blog/category/${post.category.slug}`}
                  className="hover:text-gray-700"
                >
                  {post.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span>{post.title}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              {post.author.name}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('tr-TR')}
            </div>
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/blog/tag/${tag.tag.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Share Button */}
          <div className="flex items-center gap-4">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Share2 className="h-4 w-4 mr-2" />
              Paylaş
            </button>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Author Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{post.author.name}</h3>
              <p className="text-gray-600">Yazar</p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">İlgili Yazılar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <User className="h-4 w-4 mr-1" />
                      {relatedPost.author.name}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link href={`/blog/${relatedPost.slug}`} className="hover:text-blue-600 transition-colors">
                        {relatedPost.title}
                      </Link>
                    </h4>
                    {relatedPost.category && (
                      <div className="text-sm text-blue-600">
                        {relatedPost.category.name}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tüm Blog Yazıları
          </Link>
        </div>
      </div>
    </div>
  )
}
