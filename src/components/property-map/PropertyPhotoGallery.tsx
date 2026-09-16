'use client'

import sheetStyles from '@/components/property-map/MobileSheet.module.css'
import { useGalleryQuickClose } from '@/hooks/useGalleryQuickClose'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import { stepMapPreviewImage } from '@/lib/propertyMapPreview'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

// Mount only while open so every visit starts with a fresh dismissal gesture.
export default function PropertyPhotoGallery({
  images,
  title,
  isThai,
  onClose,
}: {
  images: string[]
  title: string
  isThai: boolean
  onClose: () => void
}) {
  const [activeImage, setActiveImage] = useState<number | null>(null)
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(onClose, activeImage === null)
  const quickClose = useGalleryQuickClose()
  const quickCloseVisible = quickClose.visible && activeImage === null
  const closeGallery = () => {
    quickClose.hide()
    dismiss()
  }
  const changeImage = (direction: number) =>
    setActiveImage((index) => stepMapPreviewImage(index ?? 0, direction, images.length))

  return (
    <Dialog open onClose={closeGallery} className="relative z-[90]">
      <DialogBackdrop
        ref={backdropRef}
        className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-neutral-950/75 backdrop-blur-[2px]`}
      />
      <div className="fixed inset-0 flex items-center justify-center px-1 py-2 sm:p-3 lg:p-5">
        <DialogPanel
          ref={panelRef}
          data-property-photo-gallery
          className={`${sheetStyles.modalPanel} relative flex max-h-[calc(100dvh-1rem)] w-full max-w-[1540px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-3xl lg:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900`}
        >
          <header
            data-sheet-drag-handle
            className={`${sheetStyles.handle} flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-3 pt-2 sm:px-5 lg:min-h-16 lg:px-7 lg:pt-0 dark:border-neutral-800`}
          >
            <span className={sheetStyles.grip} aria-hidden="true" />
            <div>
              <DialogTitle className="text-lg font-semibold text-neutral-950 dark:text-white">
                {isThai ? 'รูปภาพทั้งหมด' : 'All photos'}
              </DialogTitle>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {isThai ? `แตะเพื่อขยาย · ${images.length} รูป` : `Tap to enlarge · ${images.length} photos`}
              </p>
            </div>
            <button
              type="button"
              onClick={closeGallery}
              aria-label={isThai ? 'ปิดแกลเลอรี' : 'Close gallery'}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <X className="size-5" />
            </button>
          </header>
          <div
            data-sheet-scroll
            onScroll={quickClose.onScroll}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50 p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:p-3 lg:p-4 dark:bg-neutral-950/60"
          >
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2.5 lg:gap-3 xl:grid-cols-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => {
                    quickClose.hide()
                    setActiveImage(index)
                  }}
                  aria-label={
                    isThai
                      ? `เปิดรูปที่ ${index + 1} จาก ${images.length}`
                      : `Open photo ${index + 1} of ${images.length}`
                  }
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] sm:rounded-xl dark:bg-neutral-800"
                >
                  <Image
                    src={image}
                    alt={`${title} ${isThai ? 'รูปที่' : 'image'} ${index + 1}`}
                    fill
                    sizes="(max-width: 639px) calc(100vw - 16px), (max-width: 1279px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover transition duration-300 group-hover:scale-[1.015] group-hover:brightness-95"
                  />
                  <span className="absolute right-2 bottom-2 rounded-full bg-neutral-950/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:right-3 sm:bottom-3">
                    {index + 1} / {images.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            data-property-gallery-quick-close
            onClick={closeGallery}
            aria-label={isThai ? 'ปิดแกลเลอรี' : 'Close gallery'}
            aria-hidden={!quickCloseVisible}
            tabIndex={quickCloseVisible ? 0 : -1}
            className={`absolute bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] left-1/2 z-20 flex min-h-11 min-w-24 -translate-x-1/2 items-center justify-center gap-1.5 rounded-full border border-neutral-200/60 bg-white/80 px-5 text-sm font-medium text-neutral-700 shadow-[0_4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm transition duration-200 hover:bg-white/95 focus-visible:bg-white/95 active:scale-[0.97] motion-reduce:transition-none sm:right-5 sm:bottom-5 sm:left-auto sm:translate-x-0 dark:border-neutral-700/60 dark:bg-neutral-800/80 dark:text-neutral-200 dark:hover:bg-neutral-800/95 dark:focus-visible:bg-neutral-800/95 ${quickCloseVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
          >
            <X className="size-4" aria-hidden="true" />
            {isThai ? 'ปิด' : 'Close'}
          </button>
        </DialogPanel>
      </div>

      {activeImage !== null && (
        <FullPhotoDialog
          images={images}
          title={title}
          isThai={isThai}
          activeImage={activeImage}
          changeImage={changeImage}
          onClose={() => setActiveImage(null)}
        />
      )}
    </Dialog>
  )
}

// Mount the single-photo viewer only while open so each visit gets fresh gesture/timer state.
export function FullPhotoDialog({
  images,
  title,
  isThai,
  activeImage,
  changeImage,
  onClose,
}: {
  images: string[]
  title: string
  isThai: boolean
  activeImage: number
  changeImage: (direction: number) => void
  onClose: () => void
}) {
  const touchRef = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(onClose)

  return (
    <Dialog open onClose={dismiss} className="relative z-[100]">
      <DialogBackdrop ref={backdropRef} className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-black`} />
      <div className="fixed inset-0 flex items-center justify-center sm:p-3 lg:p-5">
        <DialogPanel
          ref={panelRef}
          data-property-full-photo
          data-sheet-scroll
          className={`${sheetStyles.modalPanel} relative size-full max-w-[1500px] touch-pan-y`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              changeImage(event.key === 'ArrowLeft' ? -1 : 1)
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0]
            touchRef.current =
              event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY, horizontal: null } : null
          }}
          onTouchMove={(event) => {
            const start = touchRef.current
            if (event.touches.length !== 1) {
              touchRef.current = null
              return
            }
            if (!start || start.horizontal !== null) return
            const touch = event.touches[0]
            const dx = Math.abs(touch.clientX - start.x)
            const dy = Math.abs(touch.clientY - start.y)
            if (Math.max(dx, dy) >= 8) start.horizontal = dx > dy * 1.5
          }}
          onTouchCancel={() => {
            touchRef.current = null
          }}
          onTouchEnd={(event) => {
            const start = touchRef.current
            touchRef.current = null
            if (!start || start.horizontal === false || event.touches.length || images.length < 2) return
            const touch = event.changedTouches[0]
            const dx = touch.clientX - start.x
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(touch.clientY - start.y) * 1.5)
              changeImage(dx < 0 ? 1 : -1)
          }}
        >
          <DialogTitle className="sr-only">{isThai ? 'รูปภาพขนาดใหญ่' : 'Full size photo'}</DialogTitle>
          <Image
            src={images[activeImage]}
            alt={`${title} ${isThai ? 'รูปที่' : 'image'} ${activeImage + 1}`}
            fill
            priority
            sizes="100vw"
            className="object-contain"
            draggable={false}
          />
          <span className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {activeImage + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={dismiss}
            data-sheet-no-drag
            aria-label={isThai ? 'กลับไปแกลเลอรี' : 'Back to gallery'}
            className="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <X className="size-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => changeImage(-1)}
                data-sheet-no-drag
                aria-label={isThai ? 'รูปก่อนหน้า' : 'Previous image'}
                className="absolute top-1/2 left-[max(0.5rem,env(safe-area-inset-left))] flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronLeft className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => changeImage(1)}
                data-sheet-no-drag
                aria-label={isThai ? 'รูปถัดไป' : 'Next image'}
                className="absolute top-1/2 right-[max(0.5rem,env(safe-area-inset-right))] flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                <ChevronRight className="size-7" />
              </button>
            </>
          )}
          <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1.5 text-xs whitespace-nowrap text-white/60 lg:hidden">
            {isThai ? 'รูดลงเพื่อปิด' : 'Swipe down to close'}
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
