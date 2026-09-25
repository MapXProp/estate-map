'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import gallerySheetStyles from '@/components/property-map/GallerySheet.module.css'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import { CloseButton, DialogTitle, useClose } from '@headlessui/react'
import { ChevronLeft, ChevronRight, Minimize2, X, ZoomIn } from 'lucide-react'
import Image, { getImageProps } from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function SinglePhotoViewer({
  images,
  initialIndex,
  imageAlt,
}: {
  images: string[]
  initialIndex: number
  imageAlt: string
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, Math.min(initialIndex, images.length - 1)))
  const [zoomed, setZoomed] = useState(false)
  const close = useClose()
  const { panelRef } = useSwipeDismiss(close, !zoomed, 1366)
  const stageRef = useRef<HTMLDivElement>(null)
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([])
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const selectImage = (index: number) => {
    setZoomed(false)
    setSelectedIndex(index)
    stageRef.current?.scrollTo({ top: 0, left: 0 })
  }
  const changeImage = (direction: number) => {
    if (images.length > 1) selectImage((selectedIndex + direction + images.length) % images.length)
  }
  const toggleZoom = () => {
    const next = !zoomed
    setZoomed(next)
    touch.current = null
    window.requestAnimationFrame(() => {
      const stage = stageRef.current
      if (stage) {
        stage.scrollTo({
          left: next ? (stage.scrollWidth - stage.clientWidth) / 2 : 0,
          top: next ? (stage.scrollHeight - stage.clientHeight) / 2 : 0,
        })
      }
    })
  }

  useEffect(() => {
    thumbnails.current[selectedIndex]?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
    // Warm only the two neighboring full-size images, using the same responsive URLs as the viewer.
    if (images.length < 2) return
    const neighbors = new Set([
      (selectedIndex + 1) % images.length,
      (selectedIndex - 1 + images.length) % images.length,
    ])
    for (const index of neighbors) {
      const { props } = getImageProps({ src: images[index], alt: '', width: 1280, height: 853, sizes: '100vw' })
      const image = new window.Image()
      image.decoding = 'async'
      image.sizes = props.sizes || '100vw'
      image.srcset = props.srcSet || ''
      image.src = props.src
    }
  }, [images, selectedIndex])

  if (!images.length) return null

  return (
    <div
      data-single-photo-viewer
      ref={panelRef}
      data-photo-index={selectedIndex}
      className={`${gallerySheetStyles.modalPanel} relative size-full text-white`}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          changeImage(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <DialogTitle className="sr-only">{th ? 'รูปภาพขนาดใหญ่' : 'Full size photo'}</DialogTitle>
      <div
        ref={stageRef}
        data-single-photo-stage
        data-sheet-scroll
        data-sheet-no-drag={zoomed || undefined}
        className={`size-full overscroll-contain py-16 select-none sm:pb-24 ${zoomed ? 'touch-auto overflow-auto' : 'flex touch-pan-y touch-pinch-zoom items-center justify-center px-3 sm:px-16'}`}
        onTouchStart={(event) => {
          const point = event.touches[0]
          touch.current =
            !zoomed && event.touches.length === 1 ? { x: point.clientX, y: point.clientY, horizontal: null } : null
        }}
        onTouchMove={(event) => {
          const start = touch.current
          if (event.touches.length !== 1) {
            touch.current = null
            return
          }
          if (!start || start.horizontal !== null) return
          const point = event.touches[0]
          const dx = Math.abs(point.clientX - start.x)
          const dy = Math.abs(point.clientY - start.y)
          if (Math.max(dx, dy) >= 8) start.horizontal = dx > dy * 1.5
        }}
        onTouchCancel={() => {
          touch.current = null
        }}
        onTouchEnd={(event) => {
          const start = touch.current
          touch.current = null
          if (!start || start.horizontal === false || event.touches.length || !event.changedTouches.length) return
          const point = event.changedTouches[0]
          const dx = point.clientX - start.x
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(point.clientY - start.y) * 1.5) changeImage(dx < 0 ? 1 : -1)
        }}
      >
        <Image
          data-single-photo-image
          src={images[selectedIndex]}
          alt={`${imageAlt} ${th ? 'รูปที่' : 'photo'} ${selectedIndex + 1}`}
          width={1280}
          height={853}
          sizes={zoomed ? '200vw' : '100vw'}
          priority
          draggable={false}
          className={zoomed ? 'block h-auto w-[200%] max-w-none' : 'max-h-full w-auto max-w-full object-contain'}
        />
      </div>

      <button
        type="button"
        data-photo-zoom
        aria-pressed={zoomed}
        aria-label={zoomed ? (th ? 'แสดงภาพเต็มกรอบ' : 'Fit photo to screen') : th ? 'ขยายภาพ' : 'Zoom in'}
        onClick={toggleZoom}
        className="absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] grid size-11 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
      >
        {zoomed ? <Minimize2 className="size-5" /> : <ZoomIn className="size-5" />}
      </button>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-sm font-medium backdrop-blur-sm"
      >
        {selectedIndex + 1} / {images.length}
      </div>
      <CloseButton
        aria-label={th ? 'ปิดภาพเดี่ยว' : 'Close photo'}
        className="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] grid size-11 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="size-6" />
      </CloseButton>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => changeImage(-1)}
            aria-label={th ? 'รูปก่อนหน้า' : 'Previous photo'}
            className="absolute top-1/2 left-[max(0.5rem,env(safe-area-inset-left))] grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            onClick={() => changeImage(1)}
            aria-label={th ? 'รูปถัดไป' : 'Next photo'}
            className="absolute top-1/2 right-[max(0.5rem,env(safe-area-inset-right))] grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronRight className="size-7" />
          </button>
          <div className="absolute inset-x-16 bottom-4 hidden justify-center sm:flex">
            <div
              aria-label={th ? 'เลือกภาพ' : 'Choose a photo'}
              className="flex max-w-3xl gap-2 overflow-x-auto overscroll-contain p-1 [scrollbar-width:none]"
            >
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  ref={(node) => {
                    thumbnails.current[index] = node
                  }}
                  type="button"
                  aria-label={th ? `ดูรูปที่ ${index + 1}` : `View photo ${index + 1}`}
                  aria-current={index === selectedIndex ? 'true' : undefined}
                  onClick={() => selectImage(index)}
                  className={`relative h-12 w-20 shrink-0 overflow-hidden rounded-md border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${index === selectedIndex ? 'border-white' : 'border-transparent brightness-50 hover:brightness-100'}`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
