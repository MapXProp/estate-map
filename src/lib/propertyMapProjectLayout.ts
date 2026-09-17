export type MapLabelRect = { left: number; top: number; right: number; bottom: number }
export type ProjectLabelPlacement = 'top' | 'right' | 'left' | 'bottom'
export type ProjectLabelCandidate = {
  pin: MapLabelRect
  width: number
  height: number
  active: boolean
  previousPlacement?: ProjectLabelPlacement
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

// Smaller overview markers, gentle growth towards street level, and a firm ceiling on phones.
export function projectMarkerSize(zoom: number, mobile: boolean) {
  const progress = clamp(((Number.isFinite(zoom) ? zoom : 12) - 10) / 7, 0, 1)
  const eased = progress * progress * (3 - 2 * progress)
  return (mobile ? 16 : 18) + eased * 8
}

const intersects = (a: MapLabelRect, b: MapLabelRect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const expand = (rect: MapLabelRect, gap: number): MapLabelRect => ({
  left: rect.left - gap,
  top: rect.top - gap,
  right: rect.right + gap,
  bottom: rect.bottom + gap,
})
const inside = (rect: MapLabelRect, viewport: MapLabelRect) =>
  rect.left >= viewport.left &&
  rect.right <= viewport.right &&
  rect.top >= viewport.top &&
  rect.bottom <= viewport.bottom

// Callers provide candidates in priority order. Names can move around their pin; pins never move.
export function layoutProjectLabels<T extends ProjectLabelCandidate>(
  candidates: T[],
  viewport: MapLabelRect,
  obstacles: MapLabelRect[],
  zoom: number,
  mobile: boolean
) {
  const safeViewport = expand(viewport, -6)
  const area = Math.max(0, viewport.right - viewport.left) * Math.max(0, viewport.bottom - viewport.top)
  const density = 0.55 + clamp((zoom - 10) / 7, 0, 1) * 0.65
  const budget = clamp(Math.floor((area / (mobile ? 52000 : 68000)) * density), 2, 28)
  const gap = zoom < 13 ? 12 : 7
  // Keep names attached visually at every zoom. The 4px pointer bridges this
  // small gap while leaving room for the count badge above/right of the pin.
  const attachmentGap = 6
  const accepted: MapLabelRect[] = []
  const pinRects = candidates.map((candidate) => expand(candidate.pin, 3))
  return candidates.map((candidate, candidateIndex) => {
    const { pin, width, height } = candidate
    const x = (pin.left + pin.right) / 2
    const y = (pin.top + pin.bottom) / 2
    const center = { left: x - 1, right: x + 1, top: y - 1, bottom: y + 1 }
    if (
      width <= 0 ||
      height <= 0 ||
      !inside(center, safeViewport) ||
      obstacles.some((obstacle) => intersects(center, obstacle)) ||
      (!candidate.active && accepted.length >= budget)
    )
      return { candidate, placement: undefined, rect: undefined }

    const positions: Record<ProjectLabelPlacement, MapLabelRect> = {
      top: { left: x - width / 2, right: x + width / 2, top: pin.top - attachmentGap - height, bottom: pin.top - attachmentGap },
      right: { left: pin.right + attachmentGap, right: pin.right + attachmentGap + width, top: y - height / 2, bottom: y + height / 2 },
      left: { left: pin.left - attachmentGap - width, right: pin.left - attachmentGap, top: y - height / 2, bottom: y + height / 2 },
      bottom: { left: x - width / 2, right: x + width / 2, top: pin.bottom + attachmentGap, bottom: pin.bottom + attachmentGap + height },
    }
    const order: ProjectLabelPlacement[] = ['top', 'right', 'left', 'bottom']
    if (candidate.previousPlacement && order.includes(candidate.previousPlacement)) {
      order.splice(order.indexOf(candidate.previousPlacement), 1)
      order.unshift(candidate.previousPlacement)
    }
    const placement = order.find((position) => {
      const rect = positions[position]
      return (
        inside(rect, safeViewport) &&
        !obstacles.some((obstacle) => intersects(expand(rect, 4), obstacle)) &&
        !accepted.some((other) => intersects(expand(rect, gap), other)) &&
        !pinRects.some((other, index) => index !== candidateIndex && intersects(rect, other))
      )
    })
    // A selected/hovered name can take space from a nearby pin, but never from the search bar or results panel.
    const chosen =
      placement ??
      (candidate.active
        ? order.find(
            (position) =>
              inside(positions[position], safeViewport) &&
              !obstacles.some((obstacle) => intersects(expand(positions[position], 4), obstacle)) &&
              !accepted.some((other) => intersects(expand(positions[position], gap), other))
          )
        : undefined)
    const rect = chosen ? positions[chosen] : undefined
    if (rect) accepted.push(rect)
    return { candidate, placement: chosen, rect }
  })
}
