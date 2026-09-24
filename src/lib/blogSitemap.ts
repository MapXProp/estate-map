import type { BlogPost } from '@/data/blogPosts'
import type { MetadataRoute } from 'next'
import { absoluteUrl } from './seo'

export function buildBlogSitemap(posts: BlogPost[]): MetadataRoute.Sitemap {
  // Use editorial dates, never the build/request time. A newly published or
  // updated article also changes the article directory's content.
  const latestUpdate = posts.length
    ? new Date(Math.max(...posts.map((post) => new Date(post.updatedAt).getTime())))
    : undefined

  return [
    { url: absoluteUrl('/blog'), lastModified: latestUpdate },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.handle}`),
      lastModified: new Date(post.updatedAt),
      images: [absoluteUrl(post.featuredImage.src)],
    })),
  ]
}
