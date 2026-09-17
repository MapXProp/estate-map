'use client'

import { PopoverBackdrop, Portal } from '@headlessui/react'
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

const TopNavPopoverBackdrop = () => {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [backdrop, setBackdrop] = useState<HTMLElement | null>(null)
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)

  useLayoutEffect(() => {
    if (!backdrop) return
    const boundary = anchorRef.current?.closest<HTMLElement>('[data-top-nav-boundary]')
    if (!boundary) return

    let frame = 0
    let previousTop = -1
    const update = () => {
      const top = Math.max(0, Math.min(boundary.getBoundingClientRect().bottom, window.innerHeight))
      if (top !== previousTop) {
        backdrop.style.setProperty('--top-nav-backdrop-top', `${top}px`)
        previousTop = top
      }
      // Follow scrolling, responsive rows and the mobile header's transform while the menu is visible.
      frame = window.requestAnimationFrame(update)
    }
    update()
    return () => window.cancelAnimationFrame(frame)
  }, [backdrop])

  return (
    <>
      <span ref={anchorRef} hidden aria-hidden="true" />
      {hydrated && (
        <Portal>
          <PopoverBackdrop
            ref={setBackdrop}
            transition
            data-top-nav-backdrop
            className="fixed inset-x-0 top-[var(--top-nav-backdrop-top,0px)] bottom-0 z-[60] bg-[rgba(15,23,42,0.10)] transition-opacity duration-150 ease-out min-[744px]:bg-[rgba(15,23,42,0.12)] dark:bg-black/30 min-[744px]:dark:bg-black/35 data-closed:opacity-0"
          />
        </Portal>
      )}
    </>
  )
}

export default TopNavPopoverBackdrop
