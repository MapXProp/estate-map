'use client'

import sheetStyles from '@/components/property-map/MobileSheet.module.css'
import { useMobileSearchViewport } from '@/hooks/useMobileSearchViewport'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  blocked: boolean
  th: boolean
  onClose: () => void
  children: ReactNode
}

export default function MobilePropertySearchDialog({ open, ...props }: Props) {
  // A fresh sheet on each opening resets the completed swipe and its exit animation.
  return open ? <MobilePropertySearchSheet {...props} /> : null
}

export function MobilePropertySearchSheet({ blocked, th, onClose, children }: Omit<Props, 'open'>) {
  const viewportRef = useMobileSearchViewport()
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(onClose, !blocked)
  const close = () => {
    if (!blocked) dismiss()
  }

  return (
    <Dialog open onClose={close} className="relative z-[100] min-[744px]:hidden">
      <DialogBackdrop ref={backdropRef} className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-neutral-950/25`} />
      <div
        ref={viewportRef}
        className="fixed inset-x-0 top-[var(--search-viewport-top,0px)] h-[var(--search-viewport-height,100dvh)]"
      >
        <DialogPanel
          ref={panelRef}
          data-mobile-search-sheet
          className={`${sheetStyles.modalPanel} flex h-full flex-col overflow-hidden bg-[#f4f5f6] text-neutral-950 dark:bg-neutral-950 dark:text-white`}
        >
          <header
            data-sheet-drag-handle
            className={`${sheetStyles.handle} flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-neutral-200/80 bg-white px-4 pt-3 pb-2 dark:border-neutral-800 dark:bg-neutral-900`}
          >
            <span className={sheetStyles.grip} aria-hidden="true" />
            <DialogTitle className="text-lg font-semibold">
              {th ? 'วันนี้กำลังมองหาอะไร?' : 'What are you looking for today?'}
            </DialogTitle>
            <button
              type="button"
              onClick={close}
              aria-label={th ? 'ปิด' : 'Close'}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
            >
              <X className="size-5" />
            </button>
          </header>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
