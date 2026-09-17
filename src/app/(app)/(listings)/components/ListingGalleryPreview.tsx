'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Images } from 'lucide-react'
import Image from 'next/image'

export default function ListingGalleryPreview({
  images,
  previews,
  imageAlt,
  mediaCount,
  onImage,
  onAll,
}: {
  images: string[]
  previews?: string[]
  imageAlt: string
  mediaCount: number
  onImage: (index: number) => void
  onAll: () => void
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const visible = (previews?.length ? previews : images).slice(0, 3)
  return (
    <div
      data-listing-gallery-preview
      className="relative hidden overflow-hidden rounded-2xl bg-neutral-100 min-[744px]:block dark:bg-neutral-800"
    >
      <div
        className={`grid h-[clamp(320px,34vw,440px)] gap-1.5 ${visible.length > 1 ? 'grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] grid-rows-2' : 'grid-cols-1'}`}
      >
        {visible.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => onImage(images.indexOf(src))}
            aria-label={
              th ? `เปิดรูปที่ ${images.indexOf(src) + 1} แบบเต็มจอ` : `Open photo ${images.indexOf(src) + 1}`
            }
            className={`relative min-h-0 min-w-0 overflow-hidden focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[#176b50] ${index === 0 || visible.length === 2 ? 'row-span-2' : ''}`}
          >
            <Image
              src={src}
              alt={`${imageAlt} · ${images.indexOf(src) + 1}`}
              fill
              sizes={index === 0 ? '(min-width: 1100px) 560px, 64vw' : '(min-width: 1100px) 310px, 34vw'}
              priority={index === 0}
              className="object-cover transition duration-300 hover:brightness-95"
            />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onAll}
        data-listing-all-media
        className="absolute right-3 bottom-3 flex min-h-11 items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]"
      >
        <Images className="size-4" /> {th ? `ดูสื่อทั้งหมด · ${mediaCount}` : `All media · ${mediaCount}`}
      </button>
    </div>
  )
}
