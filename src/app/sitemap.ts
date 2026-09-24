import { blogPosts } from '@/data/blogPosts'
import { buildBlogSitemap } from '@/lib/blogSitemap'
import { buildPropertySitemap } from '@/lib/propertySitemap'
import { getPublicOrganizations } from '@/lib/publicOrganizations'
import { getPublishedProperties } from '@/lib/publishedProperties'

export const revalidate = 300

export default async function sitemap() {
  const [listings, organizations] = await Promise.all([getPublishedProperties(), getPublicOrganizations()])
  return [
    ...buildPropertySitemap(listings, organizations),
    ...buildBlogSitemap(blogPosts),
  ]
}
