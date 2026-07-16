'use client'

import * as Headless from '@headlessui/react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const PropertySearchBackdrop = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (!open) return

    const body = document.body
    const root = document.documentElement
    const scrollY = window.scrollY
    const scrollbarWidth = window.innerWidth - root.clientWidth
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    }
    const previousOverscrollBehavior = root.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    root.style.overscrollBehavior = 'none'

    return () => {
      body.style.overflow = previousBodyStyles.overflow
      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      body.style.paddingRight = previousBodyStyles.paddingRight
      root.style.overscrollBehavior = previousOverscrollBehavior
      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <Headless.Transition show={open}>
      <button
        type="button"
        aria-label="ปิดตัวเลือกการค้นหา"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default touch-none bg-black/20 transition duration-150 focus:outline-none min-[1100px]:bg-[#0c211a]/10 dark:bg-black/30 data-closed:opacity-0"
      />
    </Headless.Transition>,
    document.body
  )
}

export default PropertySearchBackdrop
