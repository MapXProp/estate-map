'use client'

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
} from 'lucide-react'
import Image from 'next/image'
import { type TouchEvent as ReactTouchEvent, useCallback, useEffect, useRef, useState } from 'react'

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
  activeFilter: PropertyMediaFilter
  onChange: (filter: PropertyMediaFilter) => void
  counts: Record<PropertyMediaFilter, number>
}) => (
  <nav aria-label="กรองประเภทสื่อ" className="w-full overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[744px]:px-6 lg:px-8">
    <div className="flex min-w-max items-center gap-1.5">
      {MEDIA_FILTERS.map((filter) => {
        const isActive = activeFilter === filter.value
        const count = counts[filter.value]

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
            className={clsx(
              'flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
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
                  isActive ? 'bg-white/18 text-white' : 'bg-white text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
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

const EmptyMediaState = ({ type }: { type: PropertyMediaFilter }) => (
  <div className="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center px-6 text-center">
    <span className="grid size-14 place-items-center rounded-full bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
      {getMediaIcon(type, 'size-6')}
    </span>
    <h3 className="mt-4 text-base font-semibold text-neutral-900 dark:text-white">ยังไม่มี{MEDIA_LABELS[type]}ในประกาศนี้</h3>
    <p className="mt-1.5 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
      เมื่อผู้ลงประกาศเพิ่มสื่อประเภทนี้ ระบบจะแสดงไว้ในหมวดนี้โดยอัตโนมัติ
    </p>
  </div>
)

const EmblaCarousel = ({ images, option }: { images: string[]; option: EmblaOptionsType }) => {
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
            <div className="relative z-50 flex embla__slide basis-full items-center justify-center px-3 py-16 sm:px-10" key={index}>
              <Image
                alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
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
                <Image alt="Slide image" src={image} fill sizes="100px" className={'object-cover'} />
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
  initiallySaved,
}: {
  images: string[]
  media: PropertyMediaItem[]
  open: boolean
  onClose: () => void
  onOpenImage: (index: number) => void
  initiallySaved: boolean
}) => {
  const [isSaved, setIsSaved] = useState(initiallySaved)
  const [activeFilter, setActiveFilter] = useState<PropertyMediaFilter>('all')
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const touchStartYRef = useRef(0)
  const touchStartXRef = useRef(0)
  const touchStartTimeRef = useRef(0)
  const canStartDragRef = useRef(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibleMedia = activeFilter === 'all' ? media : media.filter((item) => item.type === activeFilter)
  const counts = MEDIA_FILTERS.reduce(
    (result, filter) => {
      result[filter.value] = filter.value === 'all' ? media.length : media.filter((item) => item.type === filter.value).length
      return result
    },
    {} as Record<PropertyMediaFilter, number>
  )

  const resetDrag = useCallback(() => {
    setDragOffset(0)
    setIsDragging(false)
    setIsDismissing(false)
    canStartDragRef.current = false
  }, [])

  const handleClose = useCallback(() => {
    resetDrag()
    setActiveFilter('all')
    onClose()
  }, [onClose, resetDrag])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isDismissing) return

    const touch = event.touches[0]
    touchStartYRef.current = touch.clientY
    touchStartXRef.current = touch.clientX
    touchStartTimeRef.current = performance.now()
    canStartDragRef.current = (scrollContainerRef.current?.scrollTop ?? 0) <= 1
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
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-neutral-300"
              />
              <button
                type="button"
                onClick={handleClose}
                aria-label="กลับไปหน้ารายละเอียดอสังหา"
                className="flex size-11 items-center justify-center rounded-full transition hover:bg-neutral-100 active:bg-neutral-200"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold whitespace-nowrap">สื่อทั้งหมด</h2>
              <button
                type="button"
                onClick={() => setIsSaved((saved) => !saved)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'นำออกจากรายการที่บันทึก' : 'บันทึกประกาศนี้'}
                className={clsx(
                  'flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition hover:bg-neutral-100 active:bg-neutral-200',
                  isSaved && 'text-rose-600'
                )}
              >
                <Heart className={clsx('size-5', isSaved && 'fill-current')} aria-hidden="true" />
                <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
              </button>
            </div>
            <MediaFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} counts={counts} />
          </header>

          <main className="px-2.5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-end justify-between gap-3 px-0.5">
              <h3 className="text-lg font-semibold">{MEDIA_LABELS[activeFilter]}</h3>
              {visibleMedia.length > 0 && <span className="text-xs text-neutral-500">{visibleMedia.length} รายการ</span>}
            </div>
            {visibleMedia.length > 0 ? (
              <div className="columns-2 gap-2">
              {visibleMedia.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.type !== 'photo') return
                    const imageIndex = images.indexOf(item.url)
                    if (imageIndex >= 0) onOpenImage(imageIndex)
                  }}
                  aria-label={`เปิด${MEDIA_LABELS[item.type]}รายการที่ ${index + 1}`}
                  className={clsx(
                    'relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                    index % 5 === 1 || index % 5 === 3 ? 'aspect-[4/5]' : 'aspect-[4/3]'
                  )}
                >
                  <Image
                    src={item.thumbnailUrl || item.url}
                    alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
                    fill
                    sizes="50vw"
                    priority={index < 4}
                    className="object-cover transition duration-200 active:scale-[0.98]"
                  />
                  {item.type !== 'photo' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/25 text-white">
                      <span className="grid size-12 place-items-center rounded-full bg-white/92 text-[#176b50] shadow-lg">
                        {item.type === 'video' ? <Play className="ml-0.5 size-5 fill-current" /> : getMediaIcon(item.type, 'size-5')}
                      </span>
                    </span>
                  )}
                </button>
              ))}
              </div>
            ) : (
              <EmptyMediaState type={activeFilter} />
            )}
          </main>
        </DialogPanel>
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
  initiallySaved,
  propertyDetails,
}: {
  images: string[]
  media: PropertyMediaItem[]
  open: boolean
  onClose: () => void
  onOpenImage: (index: number) => void
  initiallySaved: boolean
  propertyDetails?: PropertyGalleryDetails
}) => {
  const [isSaved, setIsSaved] = useState(initiallySaved)
  const [activeFilter, setActiveFilter] = useState<PropertyMediaFilter>('all')
  const visibleMedia = activeFilter === 'all' ? media : media.filter((item) => item.type === activeFilter)
  const counts = MEDIA_FILTERS.reduce(
    (result, filter) => {
      result[filter.value] = filter.value === 'all' ? media.length : media.filter((item) => item.type === filter.value).length
      return result
    },
    {} as Record<PropertyMediaFilter, number>
  )

  const handleRequestViewing = () => {
    onClose()
    window.setTimeout(() => {
      document.getElementById('contact-owner-desktop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 hidden min-[744px]:block">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/70 backdrop-blur-[2px]" />
      <div className="fixed inset-0 flex items-center justify-center p-3 lg:p-5">
        <DialogPanel className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1800px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 lg:max-h-[calc(100dvh-2.5rem)]">
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
            <MediaFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} counts={counts} />
          </header>

          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50 p-3 dark:bg-neutral-950/60 lg:p-4">
              {visibleMedia.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 lg:gap-3">
                {visibleMedia.map((item, index) => (
                  <button
                    key={`${item.id}-desktop-gallery`}
                    type="button"
                    onClick={() => {
                      if (item.type !== 'photo') return
                      const imageIndex = images.indexOf(item.url)
                      if (imageIndex >= 0) onOpenImage(imageIndex)
                    }}
                    aria-label={`เปิด${MEDIA_LABELS[item.type]}รายการที่ ${index + 1}`}
                    className="group relative aspect-[4/3] min-w-0 overflow-hidden rounded-xl bg-neutral-200 focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:bg-neutral-800"
                  >
                    <Image
                      src={item.thumbnailUrl || item.url}
                      alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
                      fill
                      sizes="(max-width: 1023px) 50vw, (max-width: 1279px) 35vw, 27vw"
                      priority={index < 6}
                      className="object-cover transition duration-300 group-hover:scale-[1.015] group-hover:brightness-95"
                    />
                    <span className="absolute right-3 bottom-3 rounded-full bg-neutral-950/62 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      {index + 1} / {visibleMedia.length}
                    </span>
                    {item.type !== 'photo' && (
                      <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/22 text-white">
                        <span className="grid size-14 place-items-center rounded-full bg-white/92 text-[#176b50] shadow-xl">
                          {item.type === 'video' ? <Play className="ml-0.5 size-6 fill-current" /> : getMediaIcon(item.type, 'size-6')}
                        </span>
                      </span>
                    )}
                  </button>
                ))}
                </div>
              ) : (
                <EmptyMediaState type={activeFilter} />
              )}
            </div>

            {propertyDetails && (
              <aside className="hidden w-[310px] shrink-0 flex-col border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex xl:w-[350px]">
                <div className="min-h-0 flex-1 overflow-y-auto p-5 xl:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff7f3] px-3 py-1.5 text-xs font-semibold text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
                      <ShieldCheck className="size-4" />
                      ตรวจสอบแล้ว
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSaved((saved) => !saved)}
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
                  <h3 className="mt-1 text-xl font-semibold leading-snug text-neutral-950 dark:text-white">
                    {propertyDetails.title}
                  </h3>
                  <div className="mt-3 flex items-start gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#176b50]" />
                    <span>{propertyDetails.address}</span>
                  </div>

                  <div className="my-5 border-t border-neutral-200 dark:border-neutral-800" />

                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">ราคาเสนอ</p>
                  <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">{propertyDetails.price}</p>

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

                <div className="shrink-0 border-t border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 xl:p-6">
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

interface Props {
  images: string[]
  media?: PropertyMediaItem[]
  gridType?: 'grid1' | 'grid2' | 'grid3' | 'grid4'
  initiallySaved?: boolean
  propertyDetails?: PropertyGalleryDetails
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

const HeaderGallery = ({ images, media, gridType = 'grid1', initiallySaved = false, propertyDetails }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileGalleryOpen, setIsMobileGalleryOpen] = useState(false)
  const [isDesktopGalleryOpen, setIsDesktopGalleryOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
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
      {gridType === 'grid1' && <HeaderGalleryGrid1 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid2' && <HeaderGalleryGrid2 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid3' && <HeaderGalleryGrid3 images={images} handleOpenDialog={handleOpenDialog} />}
      {gridType === 'grid4' && <HeaderGalleryGrid4 images={images} handleOpenDialog={handleOpenDialog} />}

      <MobilePhotoGallery
        images={images}
        media={mediaItems}
        open={isMobileGalleryOpen}
        onClose={() => setIsMobileGalleryOpen(false)}
        onOpenImage={handleOpenMobileImage}
        initiallySaved={initiallySaved}
      />

      {gridType === 'grid2' && (
        <DesktopPhotoGallery
          images={images}
          media={mediaItems}
          open={isDesktopGalleryOpen}
          onClose={() => setIsDesktopGalleryOpen(false)}
          onOpenImage={handleOpenDesktopImage}
          initiallySaved={initiallySaved}
          propertyDetails={propertyDetails}
        />
      )}

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
            <EmblaCarousel images={images} option={{ startIndex, slidesToScroll: 1 }} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

const HeaderGalleryGrid1 = ({
  images,
  handleOpenDialog,
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-4 md:gap-2">
      <div className="relative aspect-4/5 size-full md:col-span-2 md:aspect-4/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            fill
            className="rounded-xl object-cover transition-[filter] hover:brightness-75"
            src={images[0]}
            alt="bigger"
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
              alt="others"
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
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
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
                alt={`รูปอสังหาริมทรัพย์ ${index + 1}`}
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
                alt="รูปหลักของอสังหาริมทรัพย์"
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
                  alt={`รูปอสังหาริมทรัพย์ ${index + 2}`}
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
                alt={`รูปอสังหาริมทรัพย์ ${imageIndex + 1}`}
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
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt=""
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
              alt=""
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
              alt=""
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
            alt=""
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
}: {
  images: string[]
  handleOpenDialog: (index?: number) => void
}) => {
  return (
    <header className="relative md:grid md:grid-cols-3 md:gap-x-2">
      <div className="relative aspect-4/5 size-full md:aspect-3/4" onClick={() => handleOpenDialog(0)}>
        {images[0] && (
          <Image
            alt=""
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
            alt=""
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
              alt=""
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
              alt=""
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
