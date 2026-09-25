export type SheetSnap = 'peek' | 'full'
export type SheetDragOptions = {
  enabled?: boolean
  maxWidth?: number
  /** Only for surfaces whose CSS touch-action reserves vertical dragging. */
  touchInput?: 'pointer'
  canDrag: (down: boolean, handle: boolean, atTop: boolean) => boolean
  onStart: () => void
  onMove: (dy: number) => void
  onEnd: (dy: number, velocity: number, cancelled: boolean) => void
}

export function shouldDismissSheet(offset: number, velocity: number, height: number) {
  return offset >= Math.min(120, height * 0.22) || (offset > 24 && velocity > 0.55)
}

export function chooseSheetSnap(height: number, velocity: number, points: Record<SheetSnap, number>): SheetSnap {
  const projected = height - Math.max(-2, Math.min(2, velocity)) * 180
  return (Object.keys(points) as SheetSnap[]).reduce((best, snap) =>
    Math.abs(points[snap] - projected) < Math.abs(points[best] - projected) ? snap : best
  )
}

// Native non-passive touch listeners allow downward pulls at scrollTop=0,
// while leaving ordinary scrolling, horizontal photo swipes and pinching native.
export function bindVerticalSheetDrag(root: HTMLElement, getOptions: () => SheetDragOptions) {
  const touchPointers = getOptions().touchInput === 'pointer' && 'PointerEvent' in window
  let gesture: {
    x: number
    y: number
    lastY: number
    lastTime: number
    dy: number
    velocity: number
    handle: boolean
    atTop: boolean
    locked: boolean
    ignored: boolean
    pointerId?: number
  } | null = null
  let suppressClick = false
  const now = () => performance.now()
  const releasePointer = (id = gesture?.pointerId) => {
    if (id !== undefined && root.hasPointerCapture(id)) root.releasePointerCapture(id)
  }
  const cancel = () => {
    const previous = gesture
    gesture = null
    if (previous?.locked) getOptions().onEnd(previous.dy, 0, true)
    releasePointer(previous?.pointerId)
  }
  const start = (target: EventTarget | null, x: number, y: number, pointerId?: number, capture = true) => {
    cancel()
    suppressClick = false
    if (
      getOptions().enabled === false ||
      !window.matchMedia(`(max-width: ${getOptions().maxWidth ?? 1023}px)`).matches ||
      !(target instanceof Element)
    )
      return
    // A nested dock owns its gesture; dragging it must not also dismiss the
    // surrounding property-details sheet.
    const dragRoot = target.closest('[data-sheet-drag-root]')
    if (dragRoot && dragRoot !== root) return
    const handle = target.closest('[data-sheet-drag-handle]')
    const interactive = target.closest('button,a,input,select,textarea,[contenteditable="true"],[data-sheet-no-drag]')
    if (target.closest('input,select,textarea,[contenteditable="true"],[data-sheet-no-drag]')) return
    if (handle && interactive && interactive !== handle) return
    const scroller = target.closest<HTMLElement>('[data-sheet-scroll]')
    if (!handle && !scroller) return
    gesture = {
      x,
      y,
      lastY: y,
      lastTime: now(),
      dy: 0,
      velocity: 0,
      handle: Boolean(handle),
      atTop: !scroller || scroller.scrollTop <= 1,
      locked: false,
      ignored: false,
      pointerId,
    }
    if (pointerId !== undefined && capture) root.setPointerCapture(pointerId)
  }
  const move = (x: number, y: number, event: Event) => {
    const g = gesture
    if (!g || g.ignored) return
    const dy = y - g.y
    const dx = x - g.x
    if (!g.locked) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return
      if (Math.abs(dy) <= Math.abs(dx) * 1.15 || !getOptions().canDrag(dy > 0, g.handle, g.atTop)) {
        g.ignored = true
        return
      }
      if (!event.cancelable && !(touchPointers && g.pointerId !== undefined)) {
        // A touch that stops an earlier scroll fling can start uncancelable,
        // then become cancelable. Keep it pending and rebase so taking over
        // does not jump the sheet by the distance already handled natively.
        g.x = x
        g.y = y
        g.lastY = y
        g.lastTime = now()
        return
      }
      g.locked = true
      // Leave taps on their original button/link. Capture only once a touch
      // becomes a drag so movement survives the finger leaving the dock.
      if (g.pointerId !== undefined && !root.hasPointerCapture(g.pointerId)) root.setPointerCapture(g.pointerId)
      getOptions().onStart()
    }
    // Pointer panning is negotiated by touch-action, not preventDefault.
    if (event.cancelable) event.preventDefault()
    const time = now()
    const elapsed = time - g.lastTime
    if (elapsed > 0) g.velocity = (y - g.lastY) / elapsed
    g.lastY = y
    g.lastTime = time
    g.dy = dy
    getOptions().onMove(dy)
  }
  const finish = () => {
    const g = gesture
    if (!g) return
    gesture = null
    if (g.locked) {
      suppressClick = true
      getOptions().onEnd(g.dy, now() - g.lastTime > 100 ? 0 : g.velocity, false)
    }
    releasePointer(g.pointerId)
  }
  const touchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      cancel()
      return
    }
    const touch = event.touches[0]
    start(event.target, touch.clientX, touch.clientY)
  }
  const touchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      cancel()
      return
    }
    move(event.touches[0].clientX, event.touches[0].clientY, event)
  }
  const touchEnd = (event: TouchEvent) => {
    if (event.touches.length) cancel()
    else finish()
  }
  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      if (!touchPointers) return
      if (!event.isPrimary) {
        cancel()
        return
      }
      start(event.target, event.clientX, event.clientY, event.pointerId, false)
      return
    }
    if (!event.isPrimary || event.button !== 0) return
    if (!(event.target instanceof Element) || !event.target.closest('[data-sheet-drag-handle]')) return
    start(event.target, event.clientX, event.clientY, event.pointerId)
  }
  const pointerMove = (event: PointerEvent) => {
    if ((touchPointers || event.pointerType !== 'touch') && gesture?.pointerId === event.pointerId)
      move(event.clientX, event.clientY, event)
  }
  const pointerUp = (event: PointerEvent) => {
    if ((touchPointers || event.pointerType !== 'touch') && gesture?.pointerId === event.pointerId) finish()
  }
  const pointerCancel = (event: PointerEvent) => {
    if ((touchPointers || event.pointerType !== 'touch') && gesture?.pointerId === event.pointerId) cancel()
  }
  const lostPointerCapture = (event: PointerEvent) => {
    // Moving implicit capture from a child button to the dock bubbles a loss
    // from that child first; only loss of the dock's own capture cancels it.
    if (event.target === root) pointerCancel(event)
  }
  const click = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  if (!touchPointers) {
    root.addEventListener('touchstart', touchStart, { passive: true })
    root.addEventListener('touchmove', touchMove, { passive: false })
    root.addEventListener('touchend', touchEnd)
    root.addEventListener('touchcancel', cancel)
  }
  root.addEventListener('pointerdown', pointerDown)
  root.addEventListener('pointermove', pointerMove)
  root.addEventListener('pointerup', pointerUp)
  root.addEventListener('pointercancel', pointerCancel)
  root.addEventListener('lostpointercapture', lostPointerCapture)
  root.addEventListener('click', click, true)
  return () => {
    releasePointer()
    gesture = null
    root.removeEventListener('touchstart', touchStart)
    root.removeEventListener('touchmove', touchMove)
    root.removeEventListener('touchend', touchEnd)
    root.removeEventListener('touchcancel', cancel)
    root.removeEventListener('pointerdown', pointerDown)
    root.removeEventListener('pointermove', pointerMove)
    root.removeEventListener('pointerup', pointerUp)
    root.removeEventListener('pointercancel', pointerCancel)
    root.removeEventListener('lostpointercapture', lostPointerCapture)
    root.removeEventListener('click', click, true)
  }
}
