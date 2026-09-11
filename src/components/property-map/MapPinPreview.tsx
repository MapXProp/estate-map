'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { TRealEstateListing } from '@/data/listings'
import { getPropertyType, offerTypes } from '@/data/propertyTaxonomy'
import { getMapPreviewGallery, getMapPreviewImages, stepMapPreviewImage } from '@/lib/propertyMapPreview'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { fetchPropertyListingDetail } from '@/lib/propertySearch'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Images,
  LoaderCircle,
  MapPin,
  Maximize2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import styles from './MapPinPreview.module.css'

export default function MapPinPreview({
  listing,
  onBack,
  onClose,
}: {
  listing: TRealEstateListing
  onBack: () => void
  onClose: () => void
}) {
  const { locale, formatCurrencyFrom } = usePreferences()
  const th = locale === 'th'
  const title = th ? listing.title : listing.titleEn || listing.title
  const [images, setImages] = useState(() => getMapPreviewImages(listing.featuredImage, listing.galleryImgs))
  const [imageIndex, setImageIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const [failedImages, setFailedImages] = useState<string[]>([])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const gestureRef = useRef<{ x: number; y: number } | null>(null)
  const swipedRef = useRef(false)
  const activeImage = images[imageIndex]
  const imageAvailable = Boolean(activeImage && !failedImages.includes(activeImage))
  const category = th ? listing.listingCategory : getPropertyType(listing.propertyTypeCode || '')?.nameEn || 'Property'
  const offer = th ? listing.offer : offerTypes.find((item) => item.nameTh === listing.offer)?.nameEn || listing.offer
  const price = listing.priceAmount
    ? formatCurrencyFrom(listing.priceAmount, listing.priceCurrency)
    : th
      ? listing.priceLabel || listing.price
      : 'Price on request'
  const period =
    (
      {
        month: th ? '/เดือน' : '/mo',
        day: th ? '/วัน' : '/day',
        week: th ? '/สัปดาห์' : '/wk',
        event_period: th ? '/งาน' : '/event',
      } as Record<string, string>
    )[listing.priceUnit || ''] || ''
  const facts = th ? listing.metadataSummary : listing.metadataSummaryEn
  const changeImage = (direction: number) =>
    setImageIndex((index) => stepMapPreviewImage(index, direction, images.length))

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void fetchPropertyListingDetail(listing.handle, controller.signal)
      .then((detail) => {
        if (controller.signal.aborted) return
        const photos = getMapPreviewGallery(detail, listing.handle)
        setImages(photos)
        setImageIndex((index) => Math.max(0, Math.min(index, photos.length - 1)))
        setStatus('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [listing.handle, retry])

  const startGesture = (event: PointerEvent<HTMLElement>) => {
    swipedRef.current = false
    gestureRef.current = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
  }
  const endGesture = (event: PointerEvent<HTMLElement>) => {
    const start = gestureRef.current
    gestureRef.current = null
    if (!start || images.length < 2) return
    const dx = event.clientX - start.x
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5) {
      swipedRef.current = true
      changeImage(dx < 0 ? 1 : -1)
    }
  }
  const photo = (fullscreen: boolean) =>
    imageAvailable ? (
      <Image
        key={activeImage}
        src={activeImage}
        alt={`${title} · ${th ? 'รูป' : 'Photo'} ${imageIndex + 1}`}
        fill
        sizes={fullscreen ? '100vw' : '(min-width: 1024px) 500px, 100vw'}
        className={styles.image}
        onError={() => setFailedImages((previous) => [...previous, activeImage])}
      />
    ) : (
      <div className={styles.noImage}>
        <MapPin className="size-8" />
        <span>
          {th
            ? activeImage
              ? 'โหลดรูปนี้ไม่สำเร็จ'
              : 'ยังไม่มีรูปภาพ'
            : activeImage
              ? 'This photo could not load'
              : 'No photos yet'}
        </span>
      </div>
    )
  const arrows = images.length > 1 && (
    <>
      <button
        type="button"
        className={`${styles.photoArrow} ${styles.previous}`}
        aria-label={th ? 'รูปก่อนหน้า' : 'Previous photo'}
        onClick={() => changeImage(-1)}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        className={`${styles.photoArrow} ${styles.next}`}
        aria-label={th ? 'รูปถัดไป' : 'Next photo'}
        onClick={() => changeImage(1)}
      >
        <ChevronRight className="size-5" />
      </button>
    </>
  )

  return (
    <section
      id="map-property-preview"
      data-map-property-preview
      aria-labelledby="map-preview-heading"
      className={styles.preview}
      onKeyDown={(event) => {
        if (galleryOpen) return
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          changeImage(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <header className={styles.header}>
        <button type="button" onClick={onBack} className={styles.back}>
          <ArrowLeft className="size-4" />
          {th ? 'กลับไปรายการ' : 'Back to results'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={styles.close}
          aria-label={th ? 'ปิดตัวอย่าง ดูแผนที่' : 'Close preview and view map'}
        >
          <X className="size-5" />
        </button>
      </header>
      <div className={styles.body}>
        <div
          className={styles.media}
          data-map-preview-photo
          onPointerDown={startGesture}
          onPointerUp={endGesture}
          onPointerCancel={() => {
            gestureRef.current = null
          }}
        >
          <button
            type="button"
            className={styles.enlarge}
            disabled={!imageAvailable}
            aria-label={th ? 'ขยายรูปเต็มจอ' : 'Enlarge photo'}
            onClick={() => {
              if (!swipedRef.current) setGalleryOpen(true)
              swipedRef.current = false
            }}
          >
            {photo(false)}
            {imageAvailable && (
              <span className={styles.expandHint}>
                <Maximize2 className="size-3.5" />
                {th ? 'ขยายรูป' : 'Enlarge'}
              </span>
            )}
          </button>
          {arrows}
          <span className={styles.counter} aria-live="polite">
            <Images className="size-3.5" />
            {images.length ? `${imageIndex + 1} / ${images.length}` : '0'}
            {status === 'loading' && (
              <LoaderCircle
                className="size-3 animate-spin"
                aria-label={th ? 'กำลังโหลดรูปเพิ่มเติม' : 'Loading more photos'}
              />
            )}
          </span>
        </div>
        <div className={styles.info}>
          <p className={styles.category}>
            <MapPin className="size-3.5" />
            {category} · {offer}
            {listing.isMapPromoted && <span>{th ? 'โปรโมต' : 'Promoted'}</span>}
          </p>
          <p className={styles.price}>
            {price}
            <span>{period}</span>
          </p>
          <h2 id="map-preview-heading" tabIndex={-1} ref={headingRef} className={styles.title}>
            {title}
          </h2>
          <p className={styles.address}>{th ? listing.address : listing.addressEn || listing.address}</p>
          {facts && <p className={styles.facts}>{facts}</p>}
          {status === 'error' && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => {
                setStatus('loading')
                setRetry((value) => value + 1)
              }}
            >
              {th ? 'โหลดรูปเพิ่มเติมไม่สำเร็จ · ลองอีกครั้ง' : 'More photos could not load · Retry'}
            </button>
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.galleryButton}
          disabled={!imageAvailable}
          onClick={() => setGalleryOpen(true)}
        >
          <Maximize2 className="size-4" />
          {th ? 'ดูรูปเต็ม' : 'Full photos'}
        </button>
        <Link
          href={`/real-estate-listings/${encodeURIComponent(listing.handle)}`}
          scroll={false}
          prefetch={false}
          data-map-preview-details
          className={styles.details}
          onClick={() => rememberPropertyResultsLocation(`${window.location.pathname}${window.location.search}`)}
        >
          {th ? 'ดูรายละเอียด' : 'View details'}
          <ArrowUpRight className="size-4" />
        </Link>
      </footer>
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} className={styles.galleryDialog}>
        <DialogBackdrop className={styles.galleryBackdrop} />
        <DialogPanel
          className={styles.galleryPanel}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              event.stopPropagation()
              changeImage(event.key === 'ArrowLeft' ? -1 : 1)
            }
          }}
        >
          <header className={styles.galleryHeader}>
            <DialogTitle className="min-w-0 truncate text-sm font-medium">{title}</DialogTitle>
            <button
              type="button"
              className={styles.close}
              onClick={() => setGalleryOpen(false)}
              aria-label={th ? 'ปิดรูปเต็มจอ' : 'Close full photos'}
            >
              <X className="size-5" />
            </button>
          </header>
          <div
            className={styles.fullPhoto}
            onPointerDown={startGesture}
            onPointerUp={endGesture}
            onPointerCancel={() => {
              gestureRef.current = null
            }}
          >
            {photo(true)}
            {arrows}
          </div>
          <p className={styles.galleryCaption} aria-live="polite">
            {imageIndex + 1} / {images.length}
            {images.length > 1 && <span>{th ? 'ปัดหรือกดลูกศรเพื่อดูรูป' : 'Swipe or use arrows to browse'}</span>}
          </p>
        </DialogPanel>
      </Dialog>
    </section>
  )
}
