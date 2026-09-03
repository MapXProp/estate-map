import { SITE_URL } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account',
        '/add-listing',
        '/checkout',
        '/forgot-password',
        '/login',
        '/pay-done',
        '/reset-password',
        '/signup',
        '/subscription',
        '/verify-email',
        '/api/',
        '/apix/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
