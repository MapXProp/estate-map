'use client'

import {
  isPropertyLocationHeading,
  isPropertyPlan,
  propertyDescriptionSections,
} from '@/lib/propertyDetailPresentation'
import { getMapPreviewGoogleMapsUrl } from '@/lib/propertyMapPreview'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { ChevronDown, ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'

export default function ListingLocationSection({
  listing,
  isThai,
  className = '',
}: {
  listing: PropertyListingDetail
  isThai: boolean
  className?: string
}) {
  const address = (isThai ? listing.address : listing.address_en || listing.address)?.trim()
  const district = isThai ? listing.district : listing.district_en || listing.district
  const province = isThai ? listing.province : listing.province_en || listing.province
  const subdistrict = isThai ? listing.subdistrict : listing.subdistrict_en || listing.subdistrict
  const addressLine = [
    address,
    subdistrict && subdistrict !== district && !address?.includes(subdistrict) ? subdistrict : '',
    listing.postal_code && !address?.includes(listing.postal_code) ? listing.postal_code : '',
  ]
    .filter(Boolean)
    .join(' ')
  const area = [...new Set([district, province].filter(Boolean))].join(' · ')
  const description = isThai ? listing.description : listing.description_en || listing.description
  const paragraphs = propertyDescriptionSections(description || '')
    .filter((section) => isPropertyLocationHeading(section.heading))
    .flatMap((section) => section.paragraphs)
  const location =
    typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
      ? { lat: listing.latitude, lng: listing.longitude }
      : undefined
  const mapURL = getMapPreviewGoogleMapsUrl(location)
  const directionsURL = getMapPreviewGoogleMapsUrl(location, true)
  const photos = (listing.media || []).filter((item) => item.media_type === 'image')
  const publishedMap = photos.find((item) => item.role_code === 'map')
  const photo =
    photos.find((item) => item.is_primary && !isPropertyPlan(item)) || photos.find((item) => !isPropertyPlan(item))
  const preview = publishedMap || photo
  const [failedImage, setFailedImage] = useState('')
  const showPreview = Boolean(preview?.url && failedImage !== preview.url)
  const nearby = listing.nearby_places || []
  if (!mapURL && !address && !area && !paragraphs.length && !nearby.length) return null
  const caption = publishedMap
    ? isThai
      ? 'แผนที่การเดินทางจากผู้ลงประกาศ'
      : 'Location map supplied by the advertiser'
    : isThai
      ? 'ภาพสถานที่จากประกาศ'
      : 'Property photo from the listing'
  const previewImage = preview && (
    // Keep publisher maps uncropped so road names and access routes remain visible.
    <img
      src={preview.url}
      alt={caption}
      loading="lazy"
      decoding="async"
      onError={() => setFailedImage(preview.url)}
      className={`aspect-[4/3] w-full ${publishedMap ? 'object-contain' : 'object-cover'}`}
    />
  )
  return (
    <section
      id="listing-location"
      data-listing-location
      className={`scroll-mt-28 border-t border-neutral-200 pt-8 dark:border-neutral-800 ${className}`}
    >
      <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">
        {isThai ? 'ทำเลและการเดินทาง' : 'Location and directions'}
      </h2>
      <div className={`mt-5 grid items-start gap-5 ${showPreview ? 'min-[744px]:grid-cols-2' : ''}`}>
        {showPreview && (
          <figure className="min-w-0">
            {mapURL ? (
              <a
                href={mapURL}
                target="_blank"
                rel="noopener noreferrer"
                data-listing-location-preview
                aria-label={isThai ? 'ดูตำแหน่งประกาศใน Google Maps' : 'View this property on Google Maps'}
                className="group relative block overflow-hidden rounded-2xl border border-neutral-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#176b50]"
              >
                {previewImage}
                <span className="flex min-h-10 items-center justify-center gap-1.5 border-t border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 group-hover:bg-neutral-50">
                  <MapPin className="size-4" /> {isThai ? 'ดูบน Google Maps' : 'View on Google Maps'}{' '}
                  <ExternalLink className="size-3.5" />
                </span>
              </a>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">{previewImage}</div>
            )}
            <figcaption className="mt-2 text-xs text-neutral-500">{caption}</figcaption>
          </figure>
        )}
        <div className="order-first min-w-0 min-[744px]:order-none">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" aria-hidden="true" />
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {area || (isThai ? 'ทำเลของประกาศ' : 'Property location')}
              </h3>
              {addressLine && (
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{addressLine}</p>
              )}
            </div>
          </div>
          {directionsURL && (
            <a
              href={directionsURL}
              target="_blank"
              rel="noopener noreferrer"
              data-listing-directions
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-[#176b50] hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            >
              <Navigation className="size-4 text-[#176b50]" />
              {isThai ? 'นำทางด้วย Google Maps' : 'Get directions in Google Maps'}
              <ExternalLink className="size-3.5 text-neutral-500" />
            </a>
          )}
          {nearby.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {nearby.map((place) => (
                <li key={`${place.place_type_code}-${place.name_th}`} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  {isThai ? place.name_th : place.name_en || place.name_th}
                </li>
              ))}
            </ul>
          )}
          {paragraphs.length > 0 && (
            <details open className="group mt-4 border-t border-neutral-200 dark:border-neutral-800">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200 [&::-webkit-details-marker]:hidden">
                {isThai ? 'ข้อมูลการเดินทางเพิ่มเติม' : 'More location information'}
                <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
              </summary>
              <div className="space-y-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="[overflow-wrap:anywhere] whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </section>
  )
}
