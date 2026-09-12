import type { PropertyListingDetail } from './propertySearch'

export const getMapPreviewImages = (primary?: string, images: string[] = []) => [
  ...new Set([primary, ...images].filter((image): image is string => Boolean(image?.trim()))),
]

export function getMapPreviewGallery(detail: PropertyListingDetail | null, identifier: string) {
  if (!detail || (detail.slug !== identifier && detail.public_listing_id.toLowerCase() !== identifier.toLowerCase()))
    throw new Error('Property preview identity mismatch')
  const photos = (detail.media || []).filter((item) => item.media_type === 'image')
  return getMapPreviewImages(
    photos.find((item) => item.is_primary)?.url,
    photos.map((item) => item.url)
  )
}

export function stepMapPreviewImage(index: number, direction: number, count: number) {
  return count > 0 ? (((index + direction) % count) + count) % count : 0
}
