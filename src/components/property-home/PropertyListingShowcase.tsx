'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { CheckCircle2, Heart, MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type ListingGroup = 'residential' | 'mixed_use' | 'commercial' | 'land'

type PrototypeListing = {
  id: number
  group: ListingGroup
  type: string
  offer: string
  title: string
  location: string
  facts: string[]
  price: string
  unit?: string
  image: string
  href?: string
  badge?: string
  verified?: boolean
  verificationLabel?: string
  priceLabel?: string
  imagePosition?: 'center' | 'top'
}

const DeferredListingImage = ({
  alt,
  eager,
  position = 'center',
  src,
}: {
  alt: string
  eager: boolean
  position?: 'center' | 'top'
  src: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(eager)

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '240px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoad ? (
        <Image
          fill
          src={src}
          alt={alt}
          sizes="(max-width: 402px) 82vw, (max-width: 640px) 330px, (max-width: 1280px) 50vw, 25vw"
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'low'}
          preload={eager}
          className={`object-cover transition duration-500 group-hover:scale-[1.035] ${
            position === 'top' ? 'object-top' : 'object-center'
          }`}
        />
      ) : null}
    </div>
  )
}

const filters: { value: 'all' | ListingGroup; label: string; labelEn: string }[] = [
  { value: 'all', label: 'แนะนำ', labelEn: 'Featured' },
  { value: 'residential', label: 'ที่อยู่อาศัย', labelEn: 'Residential' },
  { value: 'mixed_use', label: 'อยู่ + ธุรกิจ', labelEn: 'Live + work' },
  { value: 'commercial', label: 'ธุรกิจ', labelEn: 'Business' },
  { value: 'land', label: 'ที่ดิน', labelEn: 'Land' },
]

const publishedListings: PrototypeListing[] = [
  {
    id: 11,
    group: 'land',
    type: 'ที่ดินเปล่า · 2 แปลงติดกัน',
    offer: 'ขาย',
    title: 'ที่ดิน 700 ตร.ว. สุทธิสาร หน้ากว้างติดถนน 87 ม.',
    location: 'ซอยจัดสรร ถนนสุทธิสารวินิจฉัย, กรุงเทพฯ',
    facts: ['700 ตร.ว.', '2 แปลง', 'หน้ากว้างรวม 87 ม.'],
    price: '315,000,000',
    unit: 'บาท',
    image: '/listing-media/mapxprop/sutthisan-700-sq-wah/01-cover.webp',
    href: '/real-estate-listings/land-for-sale-sutthisan-700-sq-wah',
    badge: 'เจ้าของลงเอง',
    verified: true,
    verificationLabel: 'ผู้ติดต่อเชื่อถือได้',
  },
  {
    id: 9,
    group: 'commercial',
    type: 'พื้นที่ออกบูธ · กลุ่มออฟฟิศ',
    offer: 'เปิดจอง',
    title: 'Food O’Clock — THE EMPIRE TOWER',
    location: 'ชั้น M, THE EMPIRE TOWER, สาทร',
    facts: ['5 รอบ', '31 ส.ค.–2 ต.ค. 2569', 'อาหารและไลฟ์สไตล์'],
    price: '0',
    priceLabel: 'สอบถามราคากับผู้จัด',
    image: '/listing-media/hbd/food-o-clock-empire-tower-2026.jpg',
    href: '/real-estate-listings/food-o-clock-the-empire-tower-2026',
    badge: 'พื้นที่ออกบูธ',
    verified: true,
    verificationLabel: 'ตรวจสอบผู้จัดแล้ว',
    imagePosition: 'top',
  },
  {
    id: 10,
    group: 'commercial',
    type: 'พื้นที่ออกบูธ · ศูนย์การค้า',
    offer: 'เปิดจอง',
    title: 'LOCAL FAVORITES — EMSPHERE',
    location: 'EM MARKET HALL ชั้น G, EMSPHERE',
    facts: ['11–22 ก.ย. 2569', 'อาหารและเครื่องดื่ม', 'คนเดินห้างและต่างชาติ'],
    price: '0',
    priceLabel: 'สอบถามราคากับผู้จัด',
    image: '/listing-media/hbd/local-favorites-emsphere-2026.jpg',
    href: '/real-estate-listings/local-favorites-emsphere-2026',
    badge: 'พื้นที่ออกบูธ',
    verified: true,
    verificationLabel: 'ตรวจสอบผู้จัดแล้ว',
    imagePosition: 'top',
  },
]

const englishListings: Record<
  number,
  Pick<PrototypeListing, 'type' | 'offer' | 'title' | 'location' | 'facts' | 'unit' | 'badge'>
> = {
  11: {
    type: 'Vacant land · 2 adjoining plots',
    offer: 'Sale',
    title: '700 sq.wah land in Sutthisan with 87 m road frontage',
    location: 'Soi Chatsan, Sutthisan Winitchai Road, Bangkok',
    facts: ['2,800 sq.m.', '2 plots', 'Approx. 87 m frontage'],
    unit: '',
    badge: 'Owner listed',
  },
  9: {
    type: 'Event booth · Office crowd',
    offer: 'Booking open',
    title: 'Food O’Clock — THE EMPIRE TOWER',
    location: 'M Floor, THE EMPIRE TOWER, Sathon',
    facts: ['5 rounds', 'Aug 31–Oct 2, 2026', 'Food + lifestyle'],
    unit: '',
    badge: 'Event booth',
  },
  10: {
    type: 'Event booth · Shopping mall',
    offer: 'Booking open',
    title: 'LOCAL FAVORITES — EMSPHERE',
    location: 'EM MARKET HALL, G Floor, EMSPHERE',
    facts: ['Sep 11–22, 2026', 'Food + beverages', 'Mall visitors + expats'],
    unit: '',
    badge: 'Event booth',
  },
}

const PropertyListingShowcase = ({
  mode = 'all',
  compactStart = false,
}: {
  mode?: 'all' | 'homes' | 'rooms' | 'business'
  compactStart?: boolean
}) => {
  const { locale, formatCurrency } = usePreferences()
  const isThai = locale === 'th'
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]['value']>('all')
  const [likedIds, setLikedIds] = useState<number[]>([])

  const availableListings = useMemo(() => {
    if (mode === 'homes') return publishedListings.filter((listing) => listing.group === 'land')
    if (mode === 'rooms') return []
    if (mode === 'business') return publishedListings.filter((listing) => listing.group === 'commercial')
    return publishedListings
  }, [mode])
  const availableFilters = useMemo(() => {
    const groups = new Set(availableListings.map((listing) => listing.group))
    return filters.filter((filter) => filter.value === 'all' || groups.has(filter.value))
  }, [availableListings])
  const visibleListings = useMemo(() => {
    return activeFilter === 'all'
      ? availableListings
      : availableListings.filter((listing) => listing.group === activeFilter)
  }, [activeFilter, availableListings])

  const toggleLike = (id: number) => {
    setLikedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <section
      className={
        compactStart
          ? 'pt-6 pb-10 sm:pt-8 sm:pb-14 lg:pt-10 lg:pb-16'
          : 'pt-14 pb-10 sm:pt-18 sm:pb-14 lg:pt-24 lg:pb-16'
      }
    >
      <div className="container">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-[#176b50] dark:text-emerald-300">
              {compactStart ? (isThai ? 'เพิ่งลงประกาศ' : 'Just listed') : isThai ? 'อัปเดตล่าสุด' : 'Recently updated'}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
              {compactStart
                ? isThai
                  ? 'ประกาศใหม่และน่าสนใจ'
                  : 'New and noteworthy listings'
                : isThai
                  ? 'ประกาศใหม่และน่าสนใจ'
                  : 'Fresh properties worth seeing'}
            </h2>
            <p className="mt-2 hidden text-neutral-500 sm:block dark:text-neutral-400">
              {compactStart
                ? isThai
                  ? 'รายการล่าสุดในหมวดนี้ พร้อมข้อมูลสำคัญที่ใช้ตัดสินใจได้ทันที'
                  : 'The latest listings in this zone, with the essentials ready to compare.'
                : isThai
                  ? 'การ์ดเดียวกัน แต่เลือกแสดงรายละเอียดสำคัญให้เหมาะกับทรัพย์แต่ละประเภท'
                  : 'The right details for every kind of property, in one consistent view.'}
            </p>
          </div>

          {availableFilters.length > 1 && (
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
              {availableFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {isThai ? filter.label : filter.labelEn}
              </button>
              ))}
            </div>
          )}
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {visibleListings.length === 0 && (
            <div className="col-span-full w-full rounded-3xl border border-[#dbe7e2] bg-[#f7faf8] px-6 py-12 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-xl font-semibold text-[#123f32] dark:text-emerald-200">
                {isThai ? 'หมวดนี้กำลังรอประกาศแรก' : 'This zone is ready for its first listing'}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500 dark:text-neutral-400">
                {isThai
                  ? 'เราไม่แสดงข้อมูลจำลอง เพื่อให้ทุกประกาศที่คุณเห็นเป็นข้อมูลจริงเท่านั้น'
                  : 'We have removed sample inventory so every property you see is a real listing.'}
              </p>
              <Link
                href="/add-listing/1"
                className="mt-6 inline-flex rounded-full bg-[#123f32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#176b50]"
              >
                {isThai ? 'ลงประกาศแรกฟรี' : 'Post the first listing free'}
              </Link>
            </div>
          )}
          {visibleListings.map((listing, index) => {
            const liked = likedIds.includes(listing.id)
            const displayListing = isThai ? listing : { ...listing, ...englishListings[listing.id] }
            const price = Number(listing.price.replace(/,/g, ''))
            return (
              <article
                key={listing.id}
                className="group w-[82vw] max-w-[330px] shrink-0 snap-start sm:w-auto sm:max-w-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-800">
                  <DeferredListingImage
                    src={listing.image}
                    alt={displayListing.title}
                    eager={index === 0}
                    position={listing.imagePosition}
                  />
                  <Link
                    href={listing.href || '/real-estate-categories/all'}
                    aria-label={displayListing.title}
                    className="absolute inset-0"
                  />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-neutral-950 shadow-sm backdrop-blur">
                        {displayListing.offer}
                      </span>
                      {listing.badge && (
                        <span className="rounded-full bg-[#123f32]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                          {displayListing.badge}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={
                        liked
                          ? isThai
                            ? 'นำออกจากรายการโปรด'
                            : 'Remove from favorites'
                          : isThai
                            ? 'บันทึกเป็นรายการโปรด'
                            : 'Save to favorites'
                      }
                      onClick={() => toggleLike(listing.id)}
                      className="flex size-10 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition hover:scale-105"
                    >
                      <Heart className={`size-5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>

                <Link href={listing.href || '/real-estate-categories/all'} className="block pt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      {displayListing.type}
                    </span>
                    {listing.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#176b50] dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />{' '}
                        {isThai
                          ? listing.verificationLabel || 'ตรวจสอบแล้ว'
                          : listing.verificationLabel
                            ? 'Organizer checked'
                            : 'Verified'}
                      </span>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-base font-semibold text-neutral-950 transition group-hover:text-[#176b50] dark:text-white dark:group-hover:text-emerald-300">
                    {displayListing.title}
                  </h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <MapPin className="size-4 shrink-0" strokeWidth={1.7} />
                    <span className="truncate">{displayListing.location}</span>
                  </p>
                  <div className="mt-3 flex min-h-6 flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {displayListing.facts.map((fact, index) => (
                      <span key={fact} className="whitespace-nowrap">
                        {index > 0 && <span className="me-2 text-neutral-300 dark:text-neutral-600">·</span>}
                        {fact}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                    {listing.priceLabel ? (
                      <span className="text-base font-semibold text-[#123f32] dark:text-emerald-200">
                        {isThai ? listing.priceLabel : 'Ask the organizer for pricing'}
                      </span>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-neutral-950 dark:text-white">
                          {formatCurrency(price)}
                        </span>{' '}
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {isThai ? listing.unit?.replace('บาท', '') : displayListing.unit}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </article>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/real-estate-categories/all"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white dark:border-neutral-700 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"
          >
            {isThai ? 'ดูประกาศทั้งหมด' : 'View all listings'}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PropertyListingShowcase
