import type { PropertyListingDetail } from './propertySearch'

type MapRect = { left: number; top: number; right: number; bottom: number; width: number; height: number }

// Place the selected pin in the clear map area, outside the preview and search controls.
export function getMapPreviewTarget(map: MapRect, panel: MapRect, mobile: boolean, searchBottom: number) {
  const left = mobile ? 16 : Math.max(16, panel.right - map.left + 24)
  const right = map.width - 16
  const bottom = mobile ? panel.top - map.top - 8 : map.height - 24
  const top = Math.min(bottom, Math.max(48, searchBottom - map.top + 48))
  return {
    x: Math.max(16, Math.min(map.width - 16, (left + right) / 2)),
    y: Math.max(12, Math.min(map.height - 12, (top + bottom) / 2)),
  }
}

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
