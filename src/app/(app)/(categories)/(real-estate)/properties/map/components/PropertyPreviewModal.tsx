'use client'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import type { TRealEstateListing } from '@/data/listings'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { Bath, BedDouble, ChevronLeft, ChevronRight, ExternalLink, MapPin, Maximize2, Phone, Share2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PropertyPreviewListing = TRealEstateListing & {
  host: {
    phone: string
  }
}

const PropertyPreviewModal = ({ listing }: { listing: PropertyPreviewListing }) => {
  const router = useRouter()
  const { locale } = usePreferences()
  const images = listing.galleryImgs.length ? listing.galleryImgs : [listing.featuredImage]
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<number | null>(null)

  const shareProperty = async () => {
    const shareData = { title: listing.title, url: window.location.href }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(window.location.href)
  }

  return (
    <Dialog open onClose={() => router.back()} className="relative z-[80]">
      <DialogBackdrop className="fixed inset-0 bg-neutral-950/55 backdrop-blur-[1px]" />
      <div className="fixed inset-0 overflow-y-auto p-3 lg:p-5">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.3)] dark:bg-neutral-900 lg:max-h-[calc(100dvh-2.5rem)]">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800">
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
                  listingIdentifier={listing.handle}
                  isLiked={listing.like}
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
                  <div className="grid h-[min(53vh,560px)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                    <button
                      type="button"
                      onClick={() => setGalleryOpen(true)}
                      aria-label={`ดูรูปทั้งหมด ${images.length} รูป`}
                      className="group relative col-span-3 row-span-2 overflow-hidden text-start"
                    >
                      <Image src={images[0]} alt={listing.title} fill priority className="object-cover" sizes="(max-width: 1280px) 60vw, 800px" />
                      <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
                    </button>
                    {[images[1] || images[0], images[2] || images[0]].map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setGalleryOpen(true)}
                        aria-label={`ดูรูปทั้งหมด ${images.length} รูป`}
                        className="group relative overflow-hidden text-start"
                      >
                        <Image src={image} alt={`${listing.title} ${index + 2}`} fill className="object-cover" sizes="240px" />
                        <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/5" />
                        {index === 1 && (
                          <span className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-3">
                            <span className="flex items-center gap-1.5 rounded-full border border-white/45 bg-white/88 px-3 py-2 text-xs font-medium text-neutral-800 shadow-sm backdrop-blur-md">
                              <Maximize2 className="size-4" /> ดูรูปทั้งหมด · {images.length} รูป
                            </span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mx-auto max-w-4xl py-7">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#176b50]">
                      <span className="rounded-full bg-[#edf6f1] px-3 py-1.5">{listing.listingCategory}</span>
                      {listing.saleOff && <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">{listing.saleOff}</span>}
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold text-neutral-950 sm:text-3xl dark:text-white">{listing.title}</h1>
                    <p className="mt-2 flex items-start gap-2 text-neutral-500 dark:text-neutral-400">
                      <MapPin className="mt-0.5 size-5 shrink-0" /> {listing.address}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y border-neutral-200 py-4 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                      <span className="flex items-center gap-2"><BedDouble className="size-5 text-[#176b50]" /> {listing.bedrooms} ห้องนอน</span>
                      <span className="flex items-center gap-2"><Bath className="size-5 text-[#176b50]" /> {listing.bathrooms} ห้องน้ำ</span>
                      <span>{listing.acreage} ตร.ม.</span>
                    </div>
                    <h2 className="mt-6 text-lg font-semibold text-neutral-950 dark:text-white">เกี่ยวกับอสังหานี้</h2>
                    <p className="mt-2 line-clamp-4 leading-7 text-neutral-600 dark:text-neutral-300">{listing.description}</p>
                    <a
                      href={`/real-estate-listings/${listing.handle}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 underline-offset-4 transition hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      เปิดหน้ารายละเอียดทั้งหมด <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>

                <aside className="border-t border-neutral-200 bg-[#f7faf8] p-5 lg:border-t-0 lg:border-s lg:p-6 dark:border-neutral-800 dark:bg-neutral-950/40">
                  <div className="sticky top-5 rounded-2xl border border-[#dbe8e2] bg-white p-5 shadow-[0_12px_32px_rgba(18,63,50,.09)] dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">ราคาประกาศ</p>
                    <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">{listing.price}</p>
                    <div className="my-5 h-px bg-neutral-200 dark:bg-neutral-800" />
                    <p className="font-semibold text-neutral-950 dark:text-white">สนใจอสังหานี้?</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">ติดต่อผู้ลงประกาศเพื่อนัดชม หรือสอบถามรายละเอียดเพิ่มเติม</p>
                    <a
                      href={`tel:${listing.host.phone}`}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123f32] px-4 py-3.5 font-semibold text-white transition hover:bg-[#176b50]"
                    >
                      <Phone className="size-5" /> ติดต่อผู้ลงประกาศ
                    </a>
                    <p className="mt-3 text-center text-xs text-neutral-400">ตรวจสอบข้อมูลก่อนโอนเงินทุกครั้ง</p>
                  </div>
                </aside>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>

      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} className="relative z-[90]">
        <DialogBackdrop className="fixed inset-0 bg-neutral-950/75 backdrop-blur-[2px]" />
        <div className="fixed inset-0 flex items-center justify-center p-3 lg:p-5">
          <DialogPanel className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1540px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 lg:max-h-[calc(100dvh-2.5rem)]">
            <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 dark:border-neutral-800 lg:px-7">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950 dark:text-white">รูปภาพทั้งหมด</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">เลือกภาพเพื่อดูขนาดใหญ่ · {images.length} รูป</p>
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50 p-3 dark:bg-neutral-950/60 lg:p-4">
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
                      alt={`${listing.title} รูปที่ ${index + 1}`}
                      fill
                      sizes="(max-width: 1279px) 50vw, 33vw"
                      priority={index < 6}
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
          <DialogPanel className="relative size-full max-w-[1500px]">
            {activeImage !== null && (
              <>
                <Image
                  src={images[activeImage]}
                  alt={`${listing.title} รูปที่ ${activeImage + 1}`}
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
                  onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                  aria-label={locale === 'th' ? 'รูปก่อนหน้า' : 'Previous image'}
                  className="absolute top-1/2 left-0 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <ChevronLeft className="size-7" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage((activeImage + 1) % images.length)}
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
