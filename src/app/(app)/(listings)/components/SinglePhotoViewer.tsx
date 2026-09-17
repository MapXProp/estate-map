'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { CloseButton, DialogTitle } from '@headlessui/react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([])
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const changeImage = (direction: number) => {
    if (images.length > 1) setSelectedIndex((index) => (index + direction + images.length) % images.length)
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
      data-photo-index={selectedIndex}
      className="relative size-full text-white"
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
        data-single-photo-stage
        className="flex size-full touch-pan-y items-center justify-center px-3 py-16 select-none sm:px-16 sm:pb-24"
        onTouchStart={(event) => {
          const point = event.touches[0]
          touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY, horizontal: null } : null
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
          sizes="100vw"
          priority
          draggable={false}
          className="max-h-full w-auto max-w-full object-contain"
        />
      </div>

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
                  onClick={() => setSelectedIndex(index)}
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
