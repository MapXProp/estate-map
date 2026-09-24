import { BLOG_PUBLISHED_AT, blogPosts } from '@/data/blogPosts'
import { buildPropertySitemap } from '@/lib/propertySitemap'
import { getPublicOrganizations } from '@/lib/publicOrganizations'
import { getPublishedProperties } from '@/lib/publishedProperties'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 300

export default async function sitemap() {
  const [listings, organizations] = await Promise.all([getPublishedProperties(), getPublicOrganizations()])
  return [
    ...buildPropertySitemap(listings, organizations),
    { url: absoluteUrl('/blog'), lastModified: new Date(BLOG_PUBLISHED_AT) },
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.handle}`),
      lastModified: new Date(post.updatedAt),
      images: [absoluteUrl(post.featuredImage.src)],
    })),
  ]
}
