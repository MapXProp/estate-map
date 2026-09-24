export type ContactSheetSnap = 'compact' | 'expanded' | 'closed'

/** Keep decisions independent of frame timing and document scrolling. */
export function contactSheetSnap({
  startHeight,
  compactHeight,
  expandedHeight,
  delta,
  velocity,
}: {
  startHeight: number
  compactHeight: number
  expandedHeight: number
  delta: number
  velocity: number
}): ContactSheetSnap {
  const height = startHeight - delta
  if (height < compactHeight - 88) return 'closed'
  if (delta > 24 && velocity > 0.55) return startHeight > compactHeight + 8 ? 'compact' : 'closed'
  if (delta < -24 && velocity < -0.45) return 'expanded'
  return height > compactHeight + (expandedHeight - compactHeight) * 0.4 ? 'expanded' : 'compact'
}
