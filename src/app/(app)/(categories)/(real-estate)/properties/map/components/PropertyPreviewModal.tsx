'use client'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import PropertyDescription from '@/components/PropertyDescription'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyPreviewContactCard from '@/components/property-map/PropertyPreviewContactCard'
import { getPropertyType, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { getMapPreviewGallery, stepMapPreviewImage } from '@/lib/propertyMapPreview'
import { getPropertyPreviewContacts, getPropertyPreviewFacts } from '@/lib/propertyPreviewDetails'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ChevronLeft, ChevronRight, ExternalLink, ImageIcon, MapPin, Maximize2, Phone, Share2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

const PropertyPreviewModal = ({ listing }: { listing: PropertyListingDetail }) => {
  const router = useRouter()
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const handle = listing.slug || listing.public_listing_id
  const title = isThai ? listing.title : listing.title_en || listing.title
  const description = isThai ? listing.description : listing.description_en || listing.description
  const address = (
    isThai
      ? [listing.address, listing.district, listing.province]
      : [
          listing.address_en || listing.address,
          listing.district_en || listing.district,
          listing.province_en || listing.province,
        ]
  )
    .filter(Boolean)
    .join(', ')
  const images = getMapPreviewGallery(listing, handle)
  const facts = getPropertyPreviewFacts(listing, isThai)
  const primaryContact = getPropertyPreviewContacts(listing)[0]
  const contactRef = useRef<HTMLElement>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const propertyType = getPropertyType(normalizeLegacyPropertyType(listing.property_type_code))
  const category = (isThai ? propertyType?.nameTh : propertyType?.nameEn) || (isThai ? 'อสังหาริมทรัพย์' : 'Property')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<number | null>(null)
  const displayPrice =
    typeof listing.offer_amount === 'number' && listing.offer_amount > 0
      ? `${formatCurrencyFrom(listing.offer_amount, listing.currency)}${formatPricePeriod(listing.price_unit, isThai)}`
      : isThai
        ? 'สอบถามราคา'
        : 'Price on request'
  const changeImage = (direction: number) =>
    setActiveImage((index) => stepMapPreviewImage(index ?? 0, direction, images.length))

  const shareProperty = async () => {
    const shareData = { title, url: `${window.location.origin}/real-estate-listings/${encodeURIComponent(handle)}` }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(shareData.url).catch(() => undefined)
  }

  return (
    <Dialog open onClose={() => router.back()} className="relative z-[80]">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/55 backdrop-blur-[1px]" />
      <div className="fixed inset-0 overflow-y-auto p-3 lg:p-5">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.3)] lg:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <ChevronLeft className="size-5" />
                กลับไปหน้าค้นหา
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="แชร์ประกาศ"
                  onClick={() => void shareProperty()}
                  className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Share2 className="size-5" />
                </button>
                <BtnLikeIcon
                  listingIdentifier={handle}
                  className="relative! end-auto! top-auto!"
                  colorClass="bg-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  sizeClass="size-10"
                />
                <button
                  type="button"
                  onClick={() => router.back()}
                  aria-label="ปิดรายละเอียด"
                  className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="min-w-0 p-4 sm:p-6 lg:p-7">
                  <div className="relative grid h-[min(42dvh,400px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl bg-neutral-100 sm:h-[min(53dvh,560px)] dark:bg-neutral-800">
                    {images.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setGalleryOpen(true)}
                          aria-label={`ดูรูปทั้งหมด ${images.length} รูป`}
                          className={`group relative col-span-4 row-span-2 overflow-hidden text-start ${images.length > 1 ? 'sm:col-span-3' : ''}`}
                        >
                          <Image
                            src={images[0]}
                            alt={title}
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 1280px) 60vw, 800px"
                          />
                          <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
                        </button>
                        {images.slice(1, 3).map((image, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setGalleryOpen(true)}
                            aria-label={`ดูรูปทั้งหมด ${images.length} รูป`}
                            className={`group relative hidden overflow-hidden text-start sm:block ${images.length === 2 ? 'row-span-2' : ''}`}
                          >
                            <Image
                              src={image}
                              alt={`${title} ${index + 2}`}
                              fill
                              className="object-cover"
                              sizes="240px"
                            />
                            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setGalleryOpen(true)}
                          className="absolute right-3 bottom-3 flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-xs font-medium text-neutral-800 shadow-sm backdrop-blur"
                        >
                          <Maximize2 className="size-4" />
                          {isThai ? `ดูรูปทั้งหมด · ${images.length} รูป` : `View all ${images.length} photos`}
                        </button>
                      </>
                    ) : (
                      <div className="col-span-4 row-span-2 flex flex-col items-center justify-center gap-3 text-neutral-400">
                        <ImageIcon className="size-10" />
                        {isThai ? 'ยังไม่มีรูปภาพ' : 'No photos available'}
                      </div>
                    )}
                  </div>

                  <div className="mx-auto max-w-4xl py-7">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#176b50]">
                      <span className="rounded-full bg-[#edf6f1] px-3 py-1.5">{category}</span>
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold text-neutral-950 sm:text-3xl dark:text-white">
                      {title}
                    </h1>
                    <p className="mt-2 flex items-start gap-2 text-neutral-500 dark:text-neutral-400">
                      <MapPin className="mt-0.5 size-5 shrink-0" /> {address}
                    </p>
                    {facts.length > 0 && (
                      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y border-neutral-200 py-4 dark:border-neutral-800">
                        {facts.map((fact) => (
                          <div key={fact.label}>
                            <dt className="text-xs text-neutral-500">{fact.label}</dt>
                            <dd className="mt-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                              {fact.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <h2 className="mt-6 text-lg font-semibold text-neutral-950 dark:text-white">เกี่ยวกับอสังหานี้</h2>
                    <PropertyDescription text={description} className="mt-3" />
                    <a
                      href={`/real-estate-listings/${encodeURIComponent(handle)}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      เปิดหน้ารายละเอียดทั้งหมด <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>

                <aside
                  ref={contactRef}
                  className="scroll-mt-4 border-t border-neutral-200 bg-[#f7faf8] p-5 lg:border-s lg:border-t-0 lg:p-6 dark:border-neutral-800 dark:bg-neutral-950/40"
                >
                  <PropertyPreviewContactCard listing={listing} price={displayPrice} isThai={isThai} />
                </aside>
              </div>
            </div>
            {primaryContact && (
              <footer className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden dark:border-neutral-800 dark:bg-neutral-900">
                <a
                  href={primaryContact.href}
                  target={primaryContact.href.startsWith('http') ? '_blank' : undefined}
                  rel={primaryContact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#123f32] px-3 text-sm font-semibold text-white"
                >
                  {primaryContact.kind === 'phone' && <Phone className="size-4 shrink-0" />}
                  <span className="truncate">{primaryContact.value}</span>
                </a>
                <button
                  type="button"
                  onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="min-h-11 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                >
                  {isThai ? 'ข้อมูลติดต่อ' : 'Contact details'}
                </button>
              </footer>
            )}
          </DialogPanel>
        </div>
      </div>

      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} className="relative z-[90]">
        <DialogBackdrop className="fixed inset-0 bg-neutral-950/75 backdrop-blur-[2px]" />
        <div className="fixed inset-0 flex items-center justify-center p-3 lg:p-5">
          <DialogPanel className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1540px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900">
            <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 lg:px-7 dark:border-neutral-800">
              <div>
                <DialogTitle className="text-lg font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'รูปภาพทั้งหมด' : 'All photos'}
                </DialogTitle>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  เลือกภาพเพื่อดูขนาดใหญ่ · {images.length} รูป
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                aria-label="ปิดแกลเลอรี"
                className="flex size-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50 p-3 lg:p-4 dark:bg-neutral-950/60">
              <div className="grid grid-cols-2 gap-2.5 min-[1280px]:grid-cols-3 lg:gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`เปิดรูปที่ ${index + 1} จาก ${images.length}`}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:bg-neutral-800"
                  >
                    <Image
                      src={image}
                      alt={`${title} ${isThai ? 'รูปที่' : 'image'} ${index + 1}`}
                      fill
                      sizes="(max-width: 1279px) 50vw, 33vw"
                      loading="lazy"
                      className="object-cover transition duration-300 group-hover:scale-[1.015] group-hover:brightness-95"
                    />
                    <span className="absolute right-3 bottom-3 rounded-full bg-neutral-950/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      {index + 1} / {images.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog open={activeImage !== null} onClose={() => setActiveImage(null)} className="relative z-[100]">
        <DialogBackdrop className="fixed inset-0 bg-black" />
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-10">
          <DialogPanel
            className="relative size-full max-w-[1500px] touch-pan-y"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                changeImage(event.key === 'ArrowLeft' ? -1 : 1)
              }
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0]
              touchRef.current = { x: touch.clientX, y: touch.clientY }
            }}
            onTouchEnd={(event) => {
              const start = touchRef.current
              touchRef.current = null
              if (!start || images.length < 2) return
              const touch = event.changedTouches[0]
              const dx = touch.clientX - start.x
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(touch.clientY - start.y) * 1.5)
                changeImage(dx < 0 ? 1 : -1)
            }}
          >
            <DialogTitle className="sr-only">{isThai ? 'รูปภาพขนาดใหญ่' : 'Full size photo'}</DialogTitle>
            {activeImage !== null && (
              <>
                <Image
                  src={images[activeImage]}
                  alt={`${title} ${isThai ? 'รูปที่' : 'image'} ${activeImage + 1}`}
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain"
                />
                <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                  {activeImage + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  aria-label="กลับไปแกลเลอรี"
                  className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <X className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => changeImage(-1)}
                  aria-label={locale === 'th' ? 'รูปก่อนหน้า' : 'Previous image'}
                  className="absolute top-1/2 left-0 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <button
                  type="button"
                  onClick={() => changeImage(1)}
                  aria-label={locale === 'th' ? 'รูปถัดไป' : 'Next image'}
                  className="absolute top-1/2 right-0 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <ChevronRight className="size-7" />
                </button>
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </Dialog>
  )
}

export default PropertyPreviewModal

const formatPricePeriod = (unit: string | undefined, isThai: boolean) => {
  if (unit === 'month') return isThai ? '/เดือน' : '/month'
  if (unit === 'day') return isThai ? '/วัน' : '/day'
  if (unit === 'week') return isThai ? '/สัปดาห์' : '/week'
  if (unit === 'event_period') return isThai ? '/งาน' : '/event'
  return ''
}
