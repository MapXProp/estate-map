'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import PropertyPrices from '@/components/PropertyPrices'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyPrices } from '@/lib/propertyPrices'
import type { PropertySearchListing } from '@/lib/propertySearch'
import { MapPin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function RelatedPropertyCards({ listings }: { listings: PropertySearchListing[] }) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  if (!listings.length) return null
  return (
    <>
      <h2 className="mb-5 font-sarabun text-xl font-semibold">
        {th ? 'อสังหาฯ ที่คุณอาจสนใจ' : 'More properties to explore'}
      </h2>
      <ul
        data-related-property-cards
        className="grid grid-cols-1 gap-5 min-[500px]:grid-cols-2 min-[1100px]:grid-cols-4"
      >
        {listings.map((item) => {
          const title = th ? item.title : item.title_en || item.title
          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={`/real-estate-listings/${encodeURIComponent(item.slug)}`}
                prefetch={false}
                className="group block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-[#b5d5c6] hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                  {item.primary_image_url ? (
                    <Image
                      src={item.primary_image_url}
                      alt={title}
                      fill
                      sizes="(min-width: 1100px) 310px, (min-width: 500px) 45vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:transform-none"
                    />
                  ) : (
                    <ListingImageFallback />
                  )}
                </div>
                <div className="p-4">
                  <PropertyPrices prices={getPropertyPrices(item)} className="text-[#176b50] dark:text-emerald-300" />
                  <p className="mt-2 line-clamp-2 font-sarabun text-sm leading-6 font-semibold text-neutral-900 dark:text-white">
                    {title}
                  </p>
                  <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-neutral-500">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    {[
                      th ? item.district : item.district_en || item.district,
                      th ? item.province : item.province_en || item.province,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
