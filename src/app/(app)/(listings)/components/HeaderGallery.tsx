'use client'

import { useSavedListings } from '@/components/saved-listings/SavedListingsProvider'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import T from '@/utils/getT'
import { CloseButton, Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import {
  Bath,
  BedDouble,
  Box,
  ChevronLeft,
  FileImage,
  Heart,
  Images,
  MapPin,
  Maximize2,
  Phone,
  Play,
  Rotate3D,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { type TouchEvent as ReactTouchEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import PanoramaViewer from './PanoramaViewer'

type PropertyMediaType = 'photo' | 'video' | '360' | 'floor-plan' | '3d'
type PropertyMediaFilter = 'all' | PropertyMediaType

export interface PropertyMediaItem {
  id: string
  type: PropertyMediaType
  url: string
  thumbnailUrl?: string
  caption?: string
}

const MEDIA_FILTERS: { value: PropertyMediaFilter; label: string }[] = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'photo', label: 'รูปภาพ' },
  { value: 'video', label: 'วิดีโอ' },
  { value: '360', label: '360°' },
  { value: 'floor-plan', label: 'แปลน' },
  { value: '3d', label: '3D' },
]

const MEDIA_SECTION_TYPES: PropertyMediaType[] = ['photo', 'video', '360', 'floor-plan', '3d']
const MEDIA_NAV_FILTERS = MEDIA_FILTERS.filter(
  (filter): filter is { value: PropertyMediaType; label: string } => filter.value !== 'all'
)

const MEDIA_LABELS: Record<PropertyMediaFilter, string> = {
  all: 'สื่อทั้งหมด',
  photo: 'รูปภาพ',
  video: 'วิดีโอ',
  '360': 'ภาพ 360°',
  'floor-plan': 'แปลน',
  '3d': 'โมเดล 3D',
}

const getMediaIcon = (type: PropertyMediaFilter, className = 'size-5') => {
  if (type === 'photo' || type === 'all') return <Images className={className} aria-hidden="true" />
  if (type === 'video') return <Video className={className} aria-hidden="true" />
  if (type === '360') return <Rotate3D className={className} aria-hidden="true" />
  if (type === 'floor-plan') return <FileImage className={className} aria-hidden="true" />
  return <Box className={className} aria-hidden="true" />
}

const MediaFilterTabs = ({
  activeFilter,
  onChange,
  counts,
}: {
  activeFilter: PropertyMediaType
  onChange: (filter: PropertyMediaType) => void
  counts: Record<PropertyMediaFilter, number>
}) => {
  const tabRefs = useRef<Partial<Record<PropertyMediaFilter, HTMLButtonElement | null>>>({})

  useEffect(() => {
    tabRefs.current[activeFilter]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeFilter])

  return (
    <nav
      aria-label="เลือกดูประเภทสื่อ"
      className="w-full overflow-x-auto px-3 pb-3 [scrollbar-width:none] min-[744px]:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max items-center gap-1.5">
        {MEDIA_NAV_FILTERS.map((filter) => {
          const isActive = activeFilter === filter.value
          const count = counts[filter.value]

          return (
            <button
              ref={(node) => {
                tabRefs.current[filter.value] = node
              }}
              key={filter.value}
              type="button"
              onClick={() => onChange(filter.value)}
              aria-current={isActive ? 'true' : undefined}
              className={clsx(
                'flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                isActive
                  ? 'bg-[#176b50] text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-[#edf5f1] hover:text-[#176b50] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-emerald-950/50'
              )}
            >
              {getMediaIcon(filter.value, 'size-4')}
              <span>{filter.label}</span>
              {count > 0 && (
                <span
                  className={clsx(
                    'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-4',
                    isActive
                      ? 'bg-white/18 text-white'
                      : 'bg-white text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

const EmptyMediaState = ({ type }: { type: PropertyMediaFilter }) => (
  <div className="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center px-6 text-center">
    <span className="grid size-14 place-items-center rounded-full bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
      {getMediaIcon(type, 'size-6')}
    </span>
    <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">
      ยังไม่มี{MEDIA_LABELS[type]}ในประกาศนี้
    </h3>
    <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
      เมื่อผู้ลงประกาศเพิ่มสื่อประเภทนี้ ระบบจะแสดงไว้ในหมวดนี้โดยอัตโนมัติ
    </p>
  </div>
)

const getMediaCounts = (media: PropertyMediaItem[]) =>
  MEDIA_FILTERS.reduce(
    (result, filter) => {
      result[filter.value] =
        filter.value === 'all' ? media.length : media.filter((item) => item.type === filter.value).length
      return result
    },
    {} as Record<PropertyMediaFilter, number>
  )

const useMediaSectionNavigation = (scrollRootRef: RefObject<HTMLDivElement | null>, open: boolean) => {
  const [activeFilter, setActiveFilter] = useState<PropertyMediaType>('photo')
  const sectionRefs = useRef<Partial<Record<PropertyMediaType, HTMLElement | null>>>({})
  const frameRef = useRef<number | null>(null)

  const registerSection = useCallback((type: PropertyMediaType, node: HTMLElement | null) => {
    sectionRefs.current[type] = node
  }, [])

  const updateActiveSection = useCallback(() => {
    const root = scrollRootRef.current
    if (!root) return

    if (root.scrollTop < 20) {
      setActiveFilter('photo')
      return
    }

    const rootTop = root.getBoundingClientRect().top
    // Track the section crossing the reader's natural focus line rather than
    // waiting for an entire section to leave the viewport.
    const marker = rootTop + Math.max(120, Math.min(210, root.clientHeight * 0.28))
    let current: PropertyMediaType = 'photo'

    for (const type of MEDIA_SECTION_TYPES) {
      const section = sectionRefs.current[type]
      if (!section) continue

      const sectionRect = section.getBoundingClientRect()
      if (sectionRect.top <= marker) current = type
      if (sectionRect.top <= marker && sectionRect.bottom > marker) break
    }

    setActiveFilter(current)
  }, [scrollRootRef])

  const handleSectionScroll = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      updateActiveSection()
    })
  }, [updateActiveSection])

  useEffect(() => {
    const root = scrollRootRef.current
    if (!open || !root) return

    window.addEventListener('resize', handleSectionScroll)
    const initialFrame = window.requestAnimationFrame(updateActiveSection)

    return () => {
      window.removeEventListener('resize', handleSectionScroll)
      window.cancelAnimationFrame(initialFrame)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [handleSectionScroll, open, scrollRootRef, updateActiveSection])

  const navigateToFilter = useCallback(
    (filter: PropertyMediaType) => {
      const root = scrollRootRef.current
      if (!root) return

      setActiveFilter(filter)
      const section = sectionRefs.current[filter]
      if (!section) return
      const rootRect = root.getBoundingClientRect()
      const targetTop = root.scrollTop + section.getBoundingClientRect().top - rootRect.top - 12
      root.scrollTop = Math.max(0, targetTop)
      window.requestAnimationFrame(updateActiveSection)
    },
    [scrollRootRef, updateActiveSection]
  )

  const resetNavigation = useCallback(() => {
    setActiveFilter('photo')
    scrollRootRef.current?.scrollTo({ top: 0 })
  }, [scrollRootRef])

  return { activeFilter, navigateToFilter, registerSection, resetNavigation, handleSectionScroll }
}

const DeferredMediaSection = ({
  type,
  items,
  images,
  onOpenImage,
  onOpenMedia,
  onSectionRef,
  scrollRootRef,
  layout,
  imageAlt,
}: {
  type: PropertyMediaType
  items: PropertyMediaItem[]
  images: string[]
  onOpenImage: (index: number) => void
  onOpenMedia: (item: PropertyMediaItem) => void
  onSectionRef: (type: PropertyMediaType, node: HTMLElement | null) => void
  scrollRootRef: RefObject<HTMLDivElement | null>
  layout: 'mobile' | 'desktop'
  imageAlt: string
}) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isReady, setIsReady] = useState(type === 'photo')

  const setSectionNode = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node
      onSectionRef(type, node)
    },
    [onSectionRef, type]
  )

  useEffect(() => {
    const section = sectionRef.current
    if (isReady || !section) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setIsReady(true)
        observer.disconnect()
      },
      { root: scrollRootRef.current, rootMargin: '700px 0px' }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [isReady, scrollRootRef])

  return (
    <section
      ref={setSectionNode}
      data-media-section={type}
      aria-labelledby={`media-section-${layout}-${type}`}
      className="scroll-mt-4 border-b border-neutral-200 py-5 last:border-b-0 lg:py-6 dark:border-neutral-800"
    >
      <div className="mb-4 flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
            {getMediaIcon(type, 'size-[18px]')}
          </span>
          <h3 id={`media-section-${layout}-${type}`} className="text-lg font-semibold text-neutral-950 dark:text-white">
            {MEDIA_LABELS[type]}
          </h3>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{items.length} รายการ</span>
      </div>

      {!isReady ? (
        <div
          aria-label={`กำลังเตรียม${MEDIA_LABELS[type]}`}
          className={clsx(
            'animate-pulse rounded-2xl bg-neutral-200/70 dark:bg-neutral-800/70',
            layout === 'mobile' ? 'h-56' : 'h-72'
          )}
        />
      ) : items.length === 0 ? (
        <EmptyMediaState type={type} />
      ) : (
        <div
          className={
            layout === 'mobile' ? 'columns-2 gap-2' : 'grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 lg:gap-3'
          }
        >
          {items.map((item, index) => {
            const imageIndex = item.type === 'photo' ? images.indexOf(item.url) : -1

            return (
              <button
                key={`${item.id}-${layout}-section`}
                type="button"
                onClick={() => {
                  if (imageIndex >= 0) onOpenImage(imageIndex)
                  else onOpenMedia(item)
                }}
                aria-label={`เปิด${MEDIA_LABELS[item.type]}รายการที่ ${index + 1}`}
                className={clsx(
                  'group relative min-w-0 overflow-hidden bg-neutral-200 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:bg-neutral-800',
                  layout === 'mobile'
                    ? [
                        'mb-2 block w-full break-inside-avoid rounded-xl',
                        index % 5 === 1 || index % 5 === 3 ? 'aspect-[4/5]' : 'aspect-[4/3]',
                      ]
                    : 'aspect-[4/3] rounded-xl'
                )}
              >
                {item.type === 'photo' || item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={`${imageAlt} ${MEDIA_LABELS[item.type]}ที่ ${index + 1}`}
                    fill
                    sizes={layout === 'mobile' ? '50vw' : '(max-width: 1023px) 50vw, (max-width: 1279px) 35vw, 27vw'}
                    className="object-cover transition duration-300 group-hover:scale-[1.015] group-hover:brightness-95 group-active:scale-[0.99]"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#edf5f1] to-neutral-200 text-[#176b50] dark:from-emerald-950/50 dark:to-neutral-800">
                    {getMediaIcon(item.type, layout === 'mobile' ? 'size-9' : 'size-11')}
                  </span>
                )}

                {item.type !== 'photo' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/18 text-white">
                    <span className="grid size-12 place-items-center rounded-full bg-white/92 text-[#176b50] shadow-lg min-[744px]:size-14">
                      {item.type === 'video' ? (
                        <Play className="ml-0.5 size-5 fill-current min-[744px]:size-6" />
                      ) : (
                        getMediaIcon(item.type, 'size-5 min-[744px]:size-6')
                      )}
                    </span>
                  </span>
                )}

                {layout === 'desktop' && (
                  <span className="absolute right-3 bottom-3 rounded-full bg-neutral-950/62 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {index + 1} / {items.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

const ProgressiveMediaSections = ({
  media,
  images,
  onOpenImage,
  onOpenMedia,
  onSectionRef,
  scrollRootRef,
  layout,
  imageAlt,
}: {
  media: PropertyMediaItem[]
  images: string[]
  onOpenImage: (index: number) => void
  onOpenMedia: (item: PropertyMediaItem) => void
  onSectionRef: (type: PropertyMediaType, node: HTMLElement | null) => void
  scrollRootRef: RefObject<HTMLDivElement | null>
  layout: 'mobile' | 'desktop'
  imageAlt: string
}) => (
  <div>
    {MEDIA_SECTION_TYPES.map((type) => (
      <DeferredMediaSection
        key={`${layout}-${type}`}
        type={type}
        items={media.filter((item) => item.type === type)}
        images={images}
        onOpenImage={onOpenImage}
        onOpenMedia={onOpenMedia}
        onSectionRef={onSectionRef}
        scrollRootRef={scrollRootRef}
        layout={layout}
        imageAlt={imageAlt}
      />
    ))}
  </div>
)

const EmblaCarousel = ({
  images,
  option,
  imageAlt,
}: {
  images: string[]
  option: EmblaOptionsType
  imageAlt: string
}) => {
  const [selectedIndex, setSelectedIndex] = useState(option.startIndex ?? 0)
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({
    ...option,
    direction: process.env.NEXT_PUBLIC_THEME_DIR,
  })
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    ...option,
    containScroll: 'keepSnaps',
    dragFree: true,
    direction: process.env.NEXT_PUBLIC_THEME_DIR,
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return
      emblaMainApi.scrollTo(index)
    },
    [emblaMainApi, emblaThumbsApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return
    setSelectedIndex(emblaMainApi.selectedScrollSnap())
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap())
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaMainApi) return
    emblaMainApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaMainApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaMainApi, onSelect])

  return (
    <div className="relative size-full embla">
      <div className="embla__viewport relative mx-auto size-full overflow-hidden" ref={emblaMainRef}>
        <div className="embla__container size-full">
          {images.map((image, index) => (
            <div
              className="relative z-50 flex embla__slide basis-full items-center justify-center px-3 py-16 sm:px-10"
              key={index}
            >
              <Image
                alt={`${imageAlt} รูปที่ ${index + 1}`}
                src={image}
                width={1280}
                height={853}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                className="max-h-[calc(100dvh-8rem)] w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-2.5 right-2.5 z-50 sm:top-4 sm:right-4">
            <CloseButton as={ButtonClose}>
              <span className="sr-only">Close</span>
            </CloseButton>
          </div>
          <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/12 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      <div className="embla-thumbs fixed inset-x-0 bottom-5 z-10 hidden sm:block">
        <div className="embla-thumbs__viewport mx-auto max-w-28" ref={emblaThumbsRef}>
          <div className="embla-thumbs__container flex">
            {images.map((image, index) => (
              <div
                key={index}
                className={clsx(
                  'relative flex aspect-5/3 w-24 shrink-0 items-center justify-center transition-[transform,filter] duration-300 ease-in-out',
                  index === selectedIndex
                    ? 'z-10 scale-125 overflow-hidden rounded-md brightness-100'
                    : 'brightness-50 hover:brightness-75'
                )}
                onClick={() => onThumbClick(index)}
              >
                <Image
                  alt={`${imageAlt} ภาพย่อที่ ${index + 1}`}
                  src={image}
                  fill
                  sizes="100px"
                  className={'object-cover'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const MobilePhotoGallery = ({
  images,
  media,
  open,
  onClose,
  onOpenImage,
  onOpenMedia,
  initiallySaved,
  listingIdentifier,
  imageAlt,
}: {
  images: string[]
  media: PropertyMediaItem[]
  open: boolean
  onClose: () => void
  onOpenImage: (index: number) => void
  onOpenMedia: (item: PropertyMediaItem) => void
  initiallySaved: boolean
  listingIdentifier?: string
  imageAlt: string
}) => {
  const savedListings = useSavedListings()
  const [localSaved, setLocalSaved] = useState(initiallySaved)
  const isSaved = listingIdentifier ? savedListings.isSaved(listingIdentifier) : localSaved
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [isQuickCloseVisible, setIsQuickCloseVisible] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const canStartDragRef = useRef(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quickCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollTopRef = useRef(0)
  const upwardDistanceRef = useRef(0)
  const counts = getMediaCounts(media)
  const { activeFilter, navigateToFilter, registerSection, resetNavigation, handleSectionScroll } =
    useMediaSectionNavigation(scrollContainerRef, open)

  const resetDrag = useCallback(() => {
    setDragOffset(0)
    setIsDragging(false)
    setIsDismissing(false)
    canStartDragRef.current = false
  }, [])

  const handleClose = useCallback(() => {
    setIsQuickCloseVisible(false)
    lastScrollTopRef.current = 0
    upwardDistanceRef.current = 0
    resetDrag()
    resetNavigation()
    onClose()
  }, [onClose, resetDrag, resetNavigation])

  useEffect(() => {
    if (open) {
      lastScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0
      upwardDistanceRef.current = 0
    }

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      if (quickCloseTimerRef.current) clearTimeout(quickCloseTimerRef.current)
    }
  }, [open])

  const hideQuickClose = useCallback(() => {
    setIsQuickCloseVisible(false)
    if (quickCloseTimerRef.current) {
      clearTimeout(quickCloseTimerRef.current)
      quickCloseTimerRef.current = null
    }
  }, [])

  const showQuickClose = useCallback(() => {
    setIsQuickCloseVisible(true)
    if (quickCloseTimerRef.current) clearTimeout(quickCloseTimerRef.current)
    quickCloseTimerRef.current = setTimeout(() => {
      setIsQuickCloseVisible(false)
      quickCloseTimerRef.current = null
    }, 2600)
  }, [])

  const handleGalleryScroll = useCallback(() => {
    handleSectionScroll()

    const currentScrollTop = scrollContainerRef.current?.scrollTop ?? 0
    const delta = currentScrollTop - lastScrollTopRef.current
    lastScrollTopRef.current = currentScrollTop

    if (currentScrollTop <= 120) {
      upwardDistanceRef.current = 0
      hideQuickClose()
      return
    }

    // Reveal the one-hand close action when the user scrolls back up.
    if (delta < -1) {
      upwardDistanceRef.current += Math.abs(delta)
      if (upwardDistanceRef.current >= 28) showQuickClose()
      return
    }

    if (delta > 2) {
      upwardDistanceRef.current = 0
      hideQuickClose()
    }
  }, [handleSectionScroll, hideQuickClose, showQuickClose])

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isDismissing) return

    const touch = event.touches[0]
    const target = event.target as HTMLElement
    const startedOnDragHandle = Boolean(target.closest?.('[data-gallery-drag-handle]'))
    touchStartYRef.current = touch.clientY
    touchStartXRef.current = touch.clientX
    touchStartTimeRef.current = performance.now()
    canStartDragRef.current = startedOnDragHandle || (scrollContainerRef.current?.scrollTop ?? 0) <= 1
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!canStartDragRef.current || event.touches.length !== 1 || isDismissing) return

    const touch = event.touches[0]
    const deltaY = touch.clientY - touchStartYRef.current
    const deltaX = touch.clientX - touchStartXRef.current

    if (deltaY <= 0 || Math.abs(deltaX) > deltaY) return
    if (deltaY > 6) setIsDragging(true)

    event.preventDefault()
    setDragOffset(Math.min(deltaY * 0.88, window.innerHeight))
  }

  const handleTouchEnd = () => {
    if (!isDragging || isDismissing) {
      canStartDragRef.current = false
      return
    }

    const elapsed = Math.max(performance.now() - touchStartTimeRef.current, 1)
    const velocity = dragOffset / elapsed
    const shouldDismiss = dragOffset > 110 || velocity > 0.55

    if (shouldDismiss) {
      setIsDragging(false)
      setIsDismissing(true)
      setDragOffset(window.innerHeight)
      closeTimerRef.current = setTimeout(handleClose, 220)
      return
    }

    setIsDragging(false)
    setDragOffset(0)
    canStartDragRef.current = false
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50 md:hidden">
      <DialogBackdrop
        className="fixed inset-0 bg-neutral-950/25 transition-opacity duration-200"
        style={{ opacity: Math.max(0, 1 - dragOffset / 360) }}
      />
      <div
        ref={scrollContainerRef}
        className="fixed inset-0 overflow-y-auto overscroll-y-contain"
        onScroll={handleGalleryScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <DialogPanel
          className="min-h-full bg-white text-neutral-950 shadow-2xl will-change-transform"
          style={{
            transform: `translate3d(0, ${dragOffset}px, 0)`,
            borderRadius: dragOffset > 6 ? '20px 20px 0 0' : '0px',
            transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 180ms',
          }}
        >
          <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
            <div className="relative flex h-16 items-center justify-between px-3">
              <button
                type="button"
                data-gallery-drag-handle
                aria-label="ลากลงเพื่อปิดแกลเลอรี"
                className="absolute inset-x-24 inset-y-0 z-10 flex cursor-grab touch-none items-center justify-center select-none active:cursor-grabbing"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-neutral-300"
                />
                <span className="text-base font-semibold whitespace-nowrap">สื่อทั้งหมด</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="กลับไปหน้ารายละเอียดอสังหา"
                className="relative z-20 flex size-11 items-center justify-center rounded-full transition hover:bg-neutral-100 active:bg-neutral-200"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={listingIdentifier ? savedListings.isBusy(listingIdentifier) : false}
                onClick={() =>
                  listingIdentifier
                    ? void savedListings.toggleSaved(listingIdentifier)
                    : setLocalSaved((saved) => !saved)
                }
                aria-pressed={isSaved}
                aria-label={isSaved ? 'นำออกจากรายการที่บันทึก' : 'บันทึกประกาศนี้'}
                className={clsx(
                  'relative z-20 flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition hover:bg-neutral-100 active:bg-neutral-200',
                  isSaved && 'text-rose-600'
                )}
              >
                <Heart className={clsx('size-5', isSaved && 'fill-current')} aria-hidden="true" />
                <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
              </button>
            </div>
            <MediaFilterTabs activeFilter={activeFilter} onChange={navigateToFilter} counts={counts} />
          </header>

          <main className="px-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <ProgressiveMediaSections
              media={media}
              images={images}
              onOpenImage={onOpenImage}
              onOpenMedia={onOpenMedia}
              onSectionRef={registerSection}
              scrollRootRef={scrollContainerRef}
              layout="mobile"
              imageAlt={imageAlt}
            />
          </main>
        </DialogPanel>

        <button
          type="button"
          onClick={handleClose}
          aria-label="ปิดแกลเลอรีสื่อ"
          aria-hidden={!isQuickCloseVisible}
          tabIndex={isQuickCloseVisible ? 0 : -1}
          className={clsx(
            'fixed bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] left-1/2 z-40 flex min-h-11 min-w-24 -translate-x-1/2 items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white/96 px-5 text-sm font-semibold text-neutral-800 shadow-[0_8px_28px_rgba(15,23,42,0.16)] backdrop-blur-md transition duration-200 active:scale-[0.97]',
            isQuickCloseVisible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          )}
        >
          <X className="size-4" aria-hidden="true" />
          ปิด
        </button>
      </div>
    </Dialog>
  )
}

const DesktopPhotoGallery = ({
  images,
  media,
  open,
  onClose,
  onOpenImage,
  onOpenMedia,
  initiallySaved,
  listingIdentifier,
  propertyDetails,
  imageAlt,
}: {
  images: string[]
  media: PropertyMediaItem[]
  open: boolean
  onClose: () => void
  onOpenImage: (index: number) => void
  onOpenMedia: (item: PropertyMediaItem) => void
  initiallySaved: boolean
  listingIdentifier?: string
  propertyDetails?: PropertyGalleryDetails
  imageAlt: string
}) => {
  const savedListings = useSavedListings()
  const [localSaved, setLocalSaved] = useState(initiallySaved)
  const isSaved = listingIdentifier ? savedListings.isSaved(listingIdentifier) : localSaved
  const [isQuickCloseVisible, setIsQuickCloseVisible] = useState(false)
  const mediaScrollRef = useRef<HTMLDivElement>(null)
  const quickCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScrollTopRef = useRef(0)
  const scrollUpDistanceRef = useRef(0)
  const counts = getMediaCounts(media)
  const { activeFilter, navigateToFilter, registerSection, handleSectionScroll } = useMediaSectionNavigation(
    mediaScrollRef,
    open
  )

  const hideQuickClose = useCallback(() => {
    setIsQuickCloseVisible(false)
    if (quickCloseTimerRef.current) {
      clearTimeout(quickCloseTimerRef.current)
      quickCloseTimerRef.current = null
    }
  }, [])

  const showQuickClose = useCallback(() => {
    setIsQuickCloseVisible(true)
    if (quickCloseTimerRef.current) clearTimeout(quickCloseTimerRef.current)
    quickCloseTimerRef.current = setTimeout(() => {
      setIsQuickCloseVisible(false)
      quickCloseTimerRef.current = null
    }, 2600)
  }, [])

  useEffect(() => {
    if (open) {
      lastScrollTopRef.current = mediaScrollRef.current?.scrollTop ?? 0
      scrollUpDistanceRef.current = 0
    }

    return () => {
      if (quickCloseTimerRef.current) clearTimeout(quickCloseTimerRef.current)
    }
  }, [open])

  const handleClose = useCallback(() => {
    hideQuickClose()
    lastScrollTopRef.current = 0
    scrollUpDistanceRef.current = 0
    onClose()
  }, [hideQuickClose, onClose])

  const handleGalleryScroll = useCallback(() => {
    handleSectionScroll()

    const currentScrollTop = mediaScrollRef.current?.scrollTop ?? 0
    const delta = currentScrollTop - lastScrollTopRef.current
    lastScrollTopRef.current = currentScrollTop

    if (currentScrollTop <= 120) {
      scrollUpDistanceRef.current = 0
      hideQuickClose()
      return
    }

    if (delta < -1) {
      scrollUpDistanceRef.current += Math.abs(delta)
      if (scrollUpDistanceRef.current >= 28) showQuickClose()
      return
    }

    if (delta > 2) {
      scrollUpDistanceRef.current = 0
      hideQuickClose()
    }
  }, [handleSectionScroll, hideQuickClose, showQuickClose])

  const handleRequestViewing = () => {
    handleClose()
    window.setTimeout(() => {
      document.getElementById('contact-owner-desktop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50 hidden min-[744px]:block">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/70 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-3 lg:p-5">
        <DialogPanel className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900">
          <header className="relative z-10 shrink-0 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex min-h-20 items-center justify-between gap-4 px-6 lg:px-8">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-neutral-950 dark:text-white">สื่อทั้งหมด</h2>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  เลือกดูรูปภาพ วิดีโอ ภาพ 360° แปลน และโมเดล 3D · {media.length} รายการ
                </p>
              </div>

              <CloseButton
                as="button"
                type="button"
                aria-label="ปิดแกลเลอรีสื่อ"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  ×
                </span>
              </CloseButton>
            </div>
            <MediaFilterTabs activeFilter={activeFilter} onChange={navigateToFilter} counts={counts} />
          </header>

          <div className="flex min-h-0 flex-1">
            <div className="relative min-h-0 min-w-0 flex-1">
              <div
                ref={mediaScrollRef}
                className="h-full min-h-0 overflow-y-auto overscroll-contain bg-neutral-50 px-3 lg:px-4 dark:bg-neutral-950/60"
                onScroll={handleGalleryScroll}
              >
                <ProgressiveMediaSections
                  media={media}
                  images={images}
                  onOpenImage={onOpenImage}
                  onOpenMedia={onOpenMedia}
                  onSectionRef={registerSection}
                  scrollRootRef={mediaScrollRef}
                  layout="desktop"
                  imageAlt={imageAlt}
                />
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="ปิดแกลเลอรีสื่อ"
                aria-hidden={!isQuickCloseVisible}
                tabIndex={isQuickCloseVisible ? 0 : -1}
                className={clsx(
                  'absolute right-5 bottom-5 z-40 hidden min-h-11 items-center gap-1.5 rounded-full border border-neutral-200 bg-white/96 px-4 text-sm font-semibold text-neutral-800 shadow-[0_8px_28px_rgba(15,23,42,0.16)] backdrop-blur-md transition duration-200 active:scale-[0.97] min-[744px]:flex min-[1367px]:hidden',
                  isQuickCloseVisible
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0'
                )}
              >
                <X className="size-4" aria-hidden="true" />
                ปิด
              </button>
            </div>

            {propertyDetails && (
              <aside className="hidden w-[310px] shrink-0 flex-col border-l border-neutral-200 bg-white lg:flex xl:w-[350px] dark:border-neutral-800 dark:bg-neutral-900">
                <div className="min-h-0 flex-1 overflow-y-auto p-5 xl:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff7f3] px-3 py-1.5 text-xs font-semibold text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
                      <ShieldCheck className="size-4" />
                      ตรวจสอบแล้ว
                    </span>
                    <button
                      type="button"
                      disabled={listingIdentifier ? savedListings.isBusy(listingIdentifier) : false}
                      onClick={() =>
                        listingIdentifier
                          ? void savedListings.toggleSaved(listingIdentifier)
                          : setLocalSaved((saved) => !saved)
                      }
                      aria-pressed={isSaved}
                      aria-label={isSaved ? 'นำออกจากรายการที่บันทึก' : 'บันทึกประกาศนี้'}
                      className={clsx(
                        'grid size-10 shrink-0 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800',
                        isSaved ? 'text-rose-600' : 'text-neutral-700 dark:text-neutral-200'
                      )}
                    >
                      <Heart className={clsx('size-5', isSaved && 'fill-current')} />
                    </button>
                  </div>

                  <p className="mt-5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {propertyDetails.category}
                  </p>
                  <h3 className="mt-1 text-xl leading-snug font-semibold text-neutral-950 dark:text-white">
                    {propertyDetails.title}
                  </h3>
                  <div className="mt-3 flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#176b50]" />
                    <span>{propertyDetails.address}</span>
                  </div>

                  <div className="my-5 border-t border-neutral-200 dark:border-neutral-800" />

                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">ราคาเสนอ</p>
                  <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">
                    {propertyDetails.price}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/70">
                      <BedDouble className="mx-auto size-5 text-[#176b50]" />
                      <p className="mt-2 text-sm font-semibold">{propertyDetails.bedrooms}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ห้องนอน</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/70">
                      <Bath className="mx-auto size-5 text-[#176b50]" />
                      <p className="mt-2 text-sm font-semibold">{propertyDetails.bathrooms}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ห้องน้ำ</p>
                    </div>
                    <div className="rounded-2xl bg-neutral-50 p-3 text-center dark:bg-neutral-800/70">
                      <Maximize2 className="mx-auto size-5 text-[#176b50]" />
                      <p className="mt-2 truncate text-sm font-semibold">{propertyDetails.area}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">ตร.ม.</p>
                    </div>
                  </div>

                  <div className="my-5 border-t border-neutral-200 dark:border-neutral-800" />

                  <h4 className="text-sm font-semibold text-neutral-950 dark:text-white">จุดเด่นของอสังหา</h4>
                  <ul className="mt-3 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                    {['ข้อมูลตรงตามประเภททรัพย์', 'ดูรูปภาพจริงได้ครบทุกมุม', 'ติดต่อเจ้าของประกาศได้โดยตรง'].map(
                      (highlight) => (
                        <li key={highlight} className="flex items-start gap-2.5">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#176b50]" />
                          <span>{highlight}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="shrink-0 border-t border-neutral-200 bg-white p-5 xl:p-6 dark:border-neutral-800 dark:bg-neutral-900">
                  <button
                    type="button"
                    onClick={handleRequestViewing}
                    className="min-h-12 w-full rounded-full bg-[#124e3c] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3d2f] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]/40"
                  >
                    นัดดูสถานที่
                  </button>
                  {propertyDetails.phone && (
                    <a
                      href={`tel:${propertyDetails.phone}`}
                      className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Phone className="size-4" />
                      โทรหาเจ้าของ
                    </a>
                  )}
                </div>
              </aside>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

const PanoramaDialog = ({ item, onClose }: { item: PropertyMediaItem | null; onClose: () => void }) => (
  <Dialog open={Boolean(item)} onClose={onClose} className="relative z-[80]">
    <DialogBackdrop className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm" />
    <div className="fixed inset-0 flex items-center justify-center p-0 min-[744px]:p-4">
      <DialogPanel className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-950 text-white min-[744px]:h-[min(820px,calc(100dvh-2rem))] min-[744px]:max-w-[1440px] min-[744px]:rounded-3xl min-[744px]:border min-[744px]:border-white/10 min-[744px]:shadow-2xl">
        <header className="relative z-20 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-neutral-950 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white">
              <Rotate3D className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold sm:text-lg">ภาพ 360°</h2>
              <p className="truncate text-xs text-white/60 sm:text-sm">
                {item?.caption || 'สำรวจพื้นที่และสภาพแวดล้อมโดยรอบ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดภาพ 360 องศา"
            className="grid size-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-white/15"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </header>

        {item && <PanoramaViewer src={item.url} caption={item.caption} className="min-h-0 flex-1" />}
      </DialogPanel>
    </div>
  </Dialog>
)

const VideoDialog = ({ item, onClose }: { item: PropertyMediaItem | null; onClose: () => void }) => (
  <Dialog open={Boolean(item)} onClose={onClose} className="relative z-[80]">
    <DialogBackdrop className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm" />
    <div className="fixed inset-0 flex items-center justify-center p-0 min-[744px]:p-4">
      <DialogPanel className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-950 text-white min-[744px]:h-auto min-[744px]:max-h-[calc(100dvh-2rem)] min-[744px]:max-w-6xl min-[744px]:rounded-3xl min-[744px]:border min-[744px]:border-white/10 min-[744px]:shadow-2xl">
        <header className="relative z-20 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-neutral-950 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white">
              <Video className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold sm:text-lg">วิดีโอ</h2>
              <p className="truncate text-xs text-white/60 sm:text-sm">
                {item?.caption || 'ชมแปลงที่ดินและบรรยากาศโดยรอบ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดวิดีโอ"
            className="grid size-11 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:bg-white/15"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </header>

        {item && (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-black min-[744px]:flex-none">
            <video
              key={item.url}
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster={item.thumbnailUrl}
              className="max-h-[calc(100dvh-4rem)] w-full bg-black object-contain min-[744px]:max-h-[calc(100dvh-7rem)]"
            >
              <source src={item.url} type="video/mp4" />
              เบราว์เซอร์นี้ไม่รองรับการเล่นวิดีโอ
            </video>
          </div>
        )}
      </DialogPanel>
    </div>
  </Dialog>
)

interface Props {
  images: string[]
  media?: PropertyMediaItem[]
  gridType?: 'grid1' | 'grid2' | 'grid3' | 'grid4'
  initiallySaved?: boolean
  listingIdentifier?: string
  propertyDetails?: PropertyGalleryDetails
  imageAlt?: string
}

interface PropertyGalleryDetails {
  title: string
  category: string
  price: string
  address: string
  bedrooms: number | string
  bathrooms: number | string
  area: number | string
  phone?: string
}

const HeaderGallery = ({
  images,
  media,
  gridType = 'grid1',
  initiallySaved = false,
  listingIdentifier,
  propertyDetails,
  imageAlt,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileGalleryOpen, setIsMobileGalleryOpen] = useState(false)
  const [isDesktopGalleryOpen, setIsDesktopGalleryOpen] = useState(false)
  const [activePanorama, setActivePanorama] = useState<PropertyMediaItem | null>(null)
  const [activeVideo, setActiveVideo] = useState<PropertyMediaItem | null>(null)
  const [startIndex, setStartIndex] = useState(0)
  const galleryImageAlt = imageAlt || propertyDetails?.title || 'อสังหาริมทรัพย์'
  const mediaItems: PropertyMediaItem[] =
    media && media.length > 0
      ? media
      : images.map((image, index) => ({ id: `photo-${index + 1}`, type: 'photo', url: image }))

  const handleOpenDialog = (index = 0) => {
    if (window.matchMedia('(max-width: 743px)').matches) {
      setIsMobileGalleryOpen(true)
      return
    }

    if (gridType === 'grid2') {
      setIsDesktopGalleryOpen(true)
      return
    }

    setStartIndex(index)
    setIsOpen(true)
  }

  const handleOpenMobileImage = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  const handleOpenDesktopImage = (index: number) => {
    setStartIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      {gridType === 'grid1' && (
        <HeaderGalleryGrid1 images={images} handleOpenDialog={handleOpenDialog} imageAlt={galleryImageAlt} />
      )}
      {gridType === 'grid2' && (
        <HeaderGalleryGrid2 images={images} handleOpenDialog={handleOpenDialog} imageAlt={galleryImageAlt} />
      )}
      {gridType === 'grid3' && (
        <HeaderGalleryGrid3 images={images} handleOpenDialog={handleOpenDialog} imageAlt={galleryImageAlt} />
      )}
      {gridType === 'grid4' && (
        <HeaderGalleryGrid4 images={images} handleOpenDialog={handleOpenDialog} imageAlt={galleryImageAlt} />
      )}

      <MobilePhotoGallery
        images={images}
        media={mediaItems}
        open={isMobileGalleryOpen}
        onClose={() => setIsMobileGalleryOpen(false)}
        onOpenImage={handleOpenMobileImage}
        onOpenMedia={(item) => {
          if (item.type === '360') setActivePanorama(item)
          else if (item.type === 'video') setActiveVideo(item)
        }}
        initiallySaved={initiallySaved}
        listingIdentifier={listingIdentifier}
        imageAlt={galleryImageAlt}
      />

      {gridType === 'grid2' && (
        <DesktopPhotoGallery
          images={images}
          media={mediaItems}
          open={isDesktopGalleryOpen}
          onClose={() => setIsDesktopGalleryOpen(false)}
          onOpenImage={handleOpenDesktopImage}
          onOpenMedia={(item) => {
            if (item.type === '360') setActivePanorama(item)
            else if (item.type === 'video') setActiveVideo(item)
          }}
          initiallySaved={initiallySaved}
          listingIdentifier={listingIdentifier}
          propertyDetails={propertyDetails}
          imageAlt={galleryImageAlt}
        />
      )}

      <PanoramaDialog item={activePanorama} onClose={() => setActivePanorama(null)} />
      <VideoDialog item={activeVideo} onClose={() => setActiveVideo(null)} />

      {/* Dialog for full-screen image gallery */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-[60]">
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <DialogBackdrop className="fixed inset-0 bg-black" />

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <DialogPanel
            transition
            className="relative mx-auto h-full w-full max-w-7xl flex-1 transition data-closed:opacity-0"
          >
            <EmblaCarousel images={images} option={{ startIndex, slidesToScroll: 1 }} imageAlt={galleryImageAlt} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

const HeaderGalleryGrid1 = ({
  images,
  handleOpenDialog,
  imageAlt,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
  imageAlt: string
}) => {
  return (
    <header className="relative md:grid md:grid-cols-4 md:gap-2">
      <div className="relative aspect-4/5 size-full md:col-span-2 md:aspect-4/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            fill
            className="rounded-xl object-cover transition-[filter] hover:brightness-75"
            src={images[0]}
            alt={`${imageAlt} รูปหลัก`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>
      <div className="hidden md:col-span-2 md:grid md:grid-cols-2 md:gap-2">
        {images.slice(1, 5).map((item, index) => (
          <div className="relative aspect-2/2 size-full" key={index} onClick={() => handleOpenDialog(index + 1)}>
            <Image
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              src={item || ''}
              alt={`${imageAlt} รูปที่ ${index + 2}`}
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}
const HeaderGalleryGrid2 = ({
  images,
  handleOpenDialog,
  imageAlt,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
  imageAlt: string
}) => {
  const mobilePreviewImages = images.slice(0, 5)
  const tabletSideImages = images.slice(1, 3)
  const tabletThumbnailImages = images.slice(3, 8)

  return (
    <header className="relative">
      <div className="grid grid-cols-6 gap-1 overflow-hidden rounded-2xl bg-neutral-100 min-[744px]:hidden">
        {mobilePreviewImages.map((image, index) => {
          const isTopRow = index < 2
          const isLast = index === mobilePreviewImages.length - 1

          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => handleOpenDialog(index)}
              aria-label={isLast ? `ดูสื่อทั้งหมด ${images.length} รายการ` : `เปิดรูปที่ ${index + 1}`}
              className={clsx(
                'relative block min-w-0 overflow-hidden bg-neutral-200 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50]',
                isTopRow ? 'col-span-3 aspect-[4/3]' : 'col-span-2 aspect-square'
              )}
            >
              <Image
                alt={`${imageAlt} รูปที่ ${index + 1}`}
                src={image}
                fill
                sizes={isTopRow ? '50vw' : '34vw'}
                priority={index < 2}
                className="object-cover transition duration-200 active:scale-[0.98]"
              />
              {isLast && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-950/48 px-2 text-center text-sm font-semibold text-white">
                  <Squares2X2Icon className="size-5" />
                  ดูสื่อทั้งหมด
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="hidden min-[744px]:block">
        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={() => handleOpenDialog(0)}
            aria-label="เปิดรูปหลักของอสังหาริมทรัพย์"
            className="relative col-span-8 aspect-[3/2] overflow-hidden rounded-s-2xl bg-neutral-100 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50]"
          >
            {images[0] && (
              <Image
                alt={`${imageAlt} รูปหลัก`}
                src={images[0]}
                fill
                className="object-cover transition duration-300 hover:brightness-90"
                sizes="(max-width: 1100px) 66vw, 55vw"
                priority
              />
            )}
          </button>

          <div className="col-span-4 grid grid-rows-2 gap-2">
            {tabletSideImages.map((image, index) => (
              <button
                key={`${image}-side-${index}`}
                type="button"
                onClick={() => handleOpenDialog(index + 1)}
                aria-label={`เปิดรูปที่ ${index + 2}`}
                className={clsx(
                  'relative overflow-hidden bg-neutral-100 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50]',
                  index === 0 ? 'rounded-tr-2xl' : 'rounded-br-2xl'
                )}
              >
                <Image
                  alt={`${imageAlt} รูปที่ ${index + 2}`}
                  src={image}
                  fill
                  className="object-cover transition duration-300 hover:brightness-90"
                  sizes="(max-width: 1100px) 34vw, 28vw"
                  priority
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-5 gap-2">
          {tabletThumbnailImages.map((image, index) => {
            const imageIndex = index + 3
            const isLast = index === tabletThumbnailImages.length - 1

            return (
              <button
                key={`${image}-thumbnail-${index}`}
                type="button"
                onClick={() => handleOpenDialog(imageIndex)}
                aria-label={isLast ? `ดูสื่อทั้งหมด ${images.length} รายการ` : `เปิดรูปที่ ${imageIndex + 1}`}
                className="relative aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50]"
              >
                <Image
                  alt={`${imageAlt} รูปที่ ${imageIndex + 1}`}
                  src={image}
                  fill
                  className="object-cover transition duration-300 hover:brightness-90"
                  sizes="20vw"
                />
                {isLast && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2 bg-neutral-950/52 px-2 text-sm font-semibold text-white lg:text-base">
                    <Squares2X2Icon className="size-5" />
                    ดูสื่อทั้งหมด
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
const HeaderGalleryGrid3 = ({
  images,
  handleOpenDialog,
  imageAlt,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
  imageAlt: string
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt={`${imageAlt} รูปหลัก`}
            src={images[0]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-1 md:gap-y-2">
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(1)}>
          {images[1] && (
            <Image
              alt={`${imageAlt} รูปที่ 2`}
              src={images[1]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(2)}>
          {images[2] && (
            <Image
              alt={`${imageAlt} รูปที่ 3`}
              src={images[2]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
      </div>

      <div className="relative hidden size-full md:block md:aspect-3/4" onClick={() => handleOpenDialog(3)}>
        {images[3] && (
          <Image
            alt={`${imageAlt} รูปที่ 4`}
            src={images[3]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}
const HeaderGalleryGrid4 = ({
  images,
  handleOpenDialog,
  imageAlt,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
  imageAlt: string
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt={`${imageAlt} รูปหลัก`}
            src={images[0]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="relative hidden aspect-4/5 size-full md:block md:aspect-3/4" onClick={() => handleOpenDialog(3)}>
        {images[3] && (
          <Image
            alt={`${imageAlt} รูปที่ 4`}
            src={images[3]}
            fill
            className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 80vw"
            priority
          />
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-1 md:gap-y-2">
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(1)}>
          {images[1] && (
            <Image
              alt={`${imageAlt} รูปที่ 2`}
              src={images[1]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
        <div className="relative aspect-3/2 size-full" onClick={() => handleOpenDialog(2)}>
          {images[2] && (
            <Image
              alt={`${imageAlt} รูปที่ 3`}
              src={images[2]}
              fill
              className="rounded-xl object-cover brightness-100 transition-[filter] hover:brightness-75"
              sizes="(max-width: 768px) 33vw, 33vw"
              priority
            />
          )}
        </div>
      </div>

      <div className="absolute bottom-3 left-3">
        <Button color="light" onClick={() => handleOpenDialog()}>
          <Squares2X2Icon className="h-5 w-5" />
          <span>{T['common']['Show all photos']}</span>
        </Button>
      </div>
    </header>
  )
}

export default HeaderGallery
