export type PreviewRect = { left: number; top: number; right: number; bottom: number }

// Coordinates are relative to the map canvas, including the pin's spider offset.
export function placeMapPreview(anchor: PreviewRect, bounds: PreviewRect, width: number, height: number) {
  const center = (anchor.left + anchor.right) / 2
  if (
    center < bounds.left ||
    center > bounds.right ||
    anchor.bottom < bounds.top ||
    anchor.top > bounds.bottom ||
    width > bounds.right - bounds.left ||
    height > bounds.bottom - bounds.top
  )
    return null

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))
  const left = clamp(center - width / 2, bounds.left, bounds.right - width)
  const above = anchor.top - height - 12
  const below = anchor.bottom + 12
  const placement = above >= bounds.top ? 'above' : below + height <= bounds.bottom ? 'below' : 'beside'
  if (placement === 'beside') {
    const right = anchor.right + 12
    const sideLeft = right + width <= bounds.right ? right : anchor.left - width - 12
    if (sideLeft < bounds.left) return null
    return { left: sideLeft, top: clamp(anchor.top, bounds.top, bounds.bottom - height), placement, arrow: 0 }
  }
  return { left, top: placement === 'above' ? above : below, placement, arrow: clamp(center - left, 22, width - 22) }
}
