import type { Metadata } from 'next'

export const SITE_NAME = 'MapxProp'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mapxprop.com').replace(/\/$/, '')
export const DEFAULT_OG_IMAGE = '/opengraph-image'

export const absoluteUrl = (path = '/') => {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export const cleanSeoText = (value: string, maxLength = 158) => {
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= maxLength) return cleaned

  const shortened = cleaned.slice(0, maxLength - 1)
  const lastSpace = shortened.lastIndexOf(' ')
  return `${shortened.slice(0, lastSpace > maxLength * 0.65 ? lastSpace : shortened.length).trim()}…`
}

type PageMetadataOptions = {
  title: string
  description: string
  path: string
  keywords?: string[]
  images?: string[]
  index?: boolean
  follow?: boolean
  type?: 'website' | 'article'
}

export const createPageMetadata = ({
  title,
  description,
  path,
  keywords = [],
  images = [DEFAULT_OG_IMAGE],
  index = true,
  follow = true,
  type = 'website',
}: PageMetadataOptions): Metadata => {
  const normalizedDescription = cleanSeoText(description)
  const canonicalPath = path.startsWith('/') ? path : `/${path}`
  const resolvedImages = images.filter(Boolean)
  const socialImages = (resolvedImages.length ? resolvedImages : [DEFAULT_OG_IMAGE]).map((url) => absoluteUrl(url))

  return {
    title,
    description: normalizedDescription,
    keywords,
    alternates: { canonical: canonicalPath },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type,
      locale: 'th_TH',
      url: canonicalPath,
      siteName: SITE_NAME,
      title,
      description: normalizedDescription,
      images: socialImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: normalizedDescription,
      images: socialImages,
    },
  }
}
