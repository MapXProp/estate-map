'use client'

import * as Headless from '@headlessui/react'
import { createPortal } from 'react-dom'

const PropertySearchBackdrop = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (typeof document === 'undefined') return null

  return createPortal(
    <Headless.Transition show={open}>
      <button
        type="button"
        aria-label="ปิดตัวเลือกการค้นหา"
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default bg-black/20 transition duration-150 focus:outline-none min-[1100px]:bg-[#0c211a]/10 dark:bg-black/30 data-closed:opacity-0"
      />
    </Headless.Transition>,
    document.body
  )
}

export default PropertySearchBackdrop
