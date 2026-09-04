'use client'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import ListingImageFallback from '@/components/ListingImageFallback'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyType } from '@/data/propertyTaxonomy'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import {
  Bath,
  BedDouble,
  CarFront,
  ExternalLink,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'

const PropertyListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const propertyType = getPropertyType(listing.property_type_code)
  const propertyLabel = isThai
    ? propertyType?.nameTh || listing.property_type_code
    : propertyType?.nameEn || listing.property_type_code
  const images = listing.media.filter((item) => item.media_type === 'image').map((item) => item.url)
  const media: PropertyMediaItem[] = listing.media
    .filter((item) => ['image', 'video', '360', 'panorama'].includes(item.media_type))
    .map((item) => ({
      id: String(item.id),
      type: item.media_type === 'image' ? 'photo' : item.media_type === 'video' ? 'video' : '360',
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      caption: item.title || item.alt_text,
    }))
  const fullAddress = [listing.address, listing.subdistrict, listing.district, listing.province, listing.postal_code]
    .filter(Boolean)
    .join(' ')
  const price = formatPrice(listing, isThai)
  const currencySymbol = listing.currency === 'USD' ? 'US$' : '฿'
  const formatRetailAmount = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 0 })}`
  const retailTerms =
    listing.property_type_code === 'retail_space'
      ? [
          ...(listing.deposit_amount !== undefined
            ? [
                {
                  label: isThai ? 'ค่ามัดจำ' : 'Security deposit',
                  value: formatRetailAmount(listing.deposit_amount),
                },
              ]
            : []),
          ...(listing.advance_rent_amount !== undefined
            ? [
                {
                  label: isThai ? 'ค่าเช่าล่วงหน้า' : 'Advance rent',
                  value: formatRetailAmount(listing.advance_rent_amount),
                },
              ]
            : []),
          ...(listing.minimum_contract_months !== undefined
            ? [
                {
                  label: isThai ? 'สัญญาขั้นต่ำ' : 'Minimum contract',
                  value: isThai
                    ? `${formatNumber(listing.minimum_contract_months, locale)} เดือน`
                    : `${formatNumber(listing.minimum_contract_months, locale)} month${listing.minimum_contract_months === 1 ? '' : 's'}`,
                },
              ]
            : []),
          ...(listing.service_fee_monthly !== undefined
            ? [
                {
                  label: isThai ? 'ค่าส่วนกลาง / ค่าบริการ' : 'Service fee',
                  value: `${formatRetailAmount(listing.service_fee_monthly)}${isThai ? '/เดือน' : '/month'}`,
                },
              ]
            : []),
        ]
      : []
  const phoneURL = listing.contact_phone ? `tel:${listing.contact_phone.replace(/[^+\d]/g, '')}` : ''
  const emailURL = listing.contact_email ? `mailto:${listing.contact_email}` : ''
  const lineHandle = listing.line_id.replace(/^@/, '')
  const lineURL = lineHandle ? `https://line.me/R/ti/p/%40${encodeURIComponent(lineHandle)}` : ''
  const mapURL =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`
      : ''
  const facts = [
    ...(listing.usable_area_sqm !== undefined
      ? [
          {
            icon: Maximize2,
            value: `${formatNumber(listing.usable_area_sqm, locale)} ${isThai ? 'ตร.ม.' : 'sq.m.'}`,
            label: isThai ? 'พื้นที่ใช้สอย' : 'Usable area',
          },
        ]
      : []),
    ...(listing.bedroom_count !== undefined
      ? [
          {
            icon: BedDouble,
            value: formatNumber(listing.bedroom_count, locale),
            label: isThai ? 'ห้องนอน' : 'Bedrooms',
          },
        ]
      : []),
    ...(listing.bathroom_count !== undefined
      ? [
          {
            icon: Bath,
            value: formatNumber(listing.bathroom_count, locale),
            label: isThai ? 'ห้องน้ำ' : 'Bathrooms',
          },
        ]
      : []),
    ...(listing.parking_count !== undefined
      ? [
          {
            icon: CarFront,
            value: formatNumber(listing.parking_count, locale),
            label: isThai ? 'ที่จอดรถ' : 'Parking',
          },
        ]
      : []),
  ]

  return (
    <div className="pb-24 min-[744px]:pb-0">
      <main className="-mx-4 max-w-screen-xl px-3 pt-0 pb-4 min-[744px]:mx-auto min-[744px]:px-6 min-[744px]:py-8 sm:px-5 lg:px-8">
        {media.length ? (
          <HeaderGallery
            images={images}
            media={media}
            listingIdentifier={listing.slug || listing.public_listing_id}
            gridType={images.length >= 3 ? 'grid2' : 'grid1'}
            propertyDetails={{
              title: listing.title,
              category: propertyLabel,
              price,
              address: fullAddress,
              bedrooms: listing.bedroom_count ?? '-',
              bathrooms: listing.bathroom_count ?? '-',
              area: listing.usable_area_sqm ?? '-',
              phone: listing.contact_phone,
            }}
          />
        ) : (
          <ListingImageFallback className="aspect-[16/7] rounded-[28px]" />
        )}

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 font-sarabun text-sm font-semibold text-[#176b50]">
                {offerLabel(listing.offer_type, isThai)}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 font-sarabun text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                {propertyLabel}
              </span>
              {listing.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 font-sarabun text-sm font-semibold text-[#176b50]">
                  <ShieldCheck className="size-4" /> {isThai ? 'ตรวจสอบแล้ว' : 'Verified'}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-start justify-between gap-4">
              <h1 className="max-w-4xl font-sarabun text-3xl leading-tight font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
                {listing.title}
              </h1>
              <BtnLikeIcon
                listingIdentifier={listing.slug || listing.public_listing_id}
                className="mt-0.5 shrink-0"
                colorClass="border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                sizeClass="size-11"
              />
            </div>
            {fullAddress ? (
              <div className="mt-4 flex items-start gap-2 font-sarabun text-sm leading-6 text-neutral-600 sm:text-base dark:text-neutral-300">
                <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
                <span>{fullAddress}</span>
              </div>
            ) : null}

            {facts.length ? (
              <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {facts.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <item.icon className="size-5 text-[#176b50]" />
                    <p className="mt-3 font-sarabun text-lg font-semibold text-neutral-950 dark:text-white">
                      {item.value}
                    </p>
                    <p className="mt-0.5 font-sarabun text-xs text-neutral-500">{item.label}</p>
                  </div>
                ))}
              </section>
            ) : null}

            {listing.property_type_code === 'retail_space' ? (
              <section className="mt-7 rounded-3xl border border-[#dce9e4] bg-[#f7faf8] p-5 lg:hidden dark:border-[#205e30] dark:bg-[#173520]">
                <p className="font-sarabun text-sm text-neutral-500 dark:text-neutral-300">
                  {isThai ? 'ค่าเช่าและเงื่อนไข' : 'Rent & terms'}
                </p>
                <p className="mt-1 font-sarabun text-2xl font-semibold text-[#123f32] dark:text-white">{price}</p>
                <RetailTerms items={retailTerms} />
              </section>
            ) : null}

            <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
              <h2 className="font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
                {isThai ? 'รายละเอียดประกาศ' : 'Listing details'}
              </h2>
              <div className="mt-5 space-y-4 font-sarabun text-[15px] leading-7 whitespace-pre-line text-neutral-700 sm:text-base dark:text-neutral-300">
                {listing.description}
              </div>
            </section>

            {listing.amenities.length ? (
              <section className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
                <h2 className="font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'จุดเด่นและสิ่งอำนวยความสะดวก' : 'Features & amenities'}
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-neutral-100 px-3 py-2 font-sarabun text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      {amenityLabel(amenity, isThai)}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {mapURL ? (
              <section className="mt-10 rounded-3xl border border-[#dce9e4] bg-[#f7faf8] p-5 sm:p-6 dark:border-[#205e30] dark:bg-[#173520]">
                <h2 className="flex items-center gap-2 font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
                  <MapPin className="size-5 text-[#176b50] dark:text-[#8bd49c]" />{' '}
                  {isThai ? 'ตำแหน่งทรัพย์' : 'Property location'}
                </h2>
                <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {fullAddress}
                </p>
                <a
                  href={mapURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 font-sarabun text-sm font-semibold text-[#176b50] hover:underline dark:text-[#8bd49c]"
                >
                  {isThai ? 'เปิดตำแหน่งบนแผนที่' : 'Open in maps'} <ExternalLink className="size-4" />
                </a>
              </section>
            ) : null}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_18px_55px_rgba(18,63,50,0.10)] dark:border-neutral-800 dark:bg-neutral-900">
              <p className="font-sarabun text-sm text-neutral-500">{isThai ? 'ราคา' : 'Price'}</p>
              <p className="mt-1 font-sarabun text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                {price}
              </p>
              <RetailTerms items={retailTerms} />
              <div className="my-5 border-t border-neutral-200 dark:border-neutral-800" />
              <p className="font-sarabun font-semibold text-neutral-950 dark:text-white">
                {isThai ? 'ติดต่อ' : 'Contact'} {listing.contact_name}
              </p>
              {listing.contact_organization_name ? (
                <p className="mt-1 font-sarabun text-sm text-neutral-500">{listing.contact_organization_name}</p>
              ) : null}
              <div className="mt-5 grid gap-2.5">
                {phoneURL ? (
                  <a
                    href={phoneURL}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#176b50] px-5 font-sarabun font-semibold text-white transition hover:bg-[#145d46]"
                  >
                    <Phone className="size-4" /> {listing.contact_phone}
                  </a>
                ) : null}
                {lineURL ? (
                  <a
                    href={lineURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 font-sarabun font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <MessageCircle className="size-4" /> LINE
                  </a>
                ) : null}
                {emailURL ? (
                  <a
                    href={emailURL}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 font-sarabun font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Mail className="size-4" /> {isThai ? 'ส่งอีเมล' : 'Email'}
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {(phoneURL || lineURL) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-3 backdrop-blur min-[744px]:hidden dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mx-auto flex max-w-md gap-2">
            {lineURL ? (
              <a
                href={lineURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#cddfd8] font-sarabun font-medium text-[#123f32] dark:text-white"
              >
                <MessageCircle className="size-4" /> LINE
              </a>
            ) : null}
            {phoneURL ? (
              <a
                href={phoneURL}
                className="flex h-12 flex-[1.35] items-center justify-center gap-2 rounded-full bg-[#123f32] font-sarabun font-medium text-white"
              >
                <Phone className="size-4" /> {isThai ? 'โทรหาผู้ติดต่อ' : 'Call contact'}
              </a>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

const RetailTerms = ({ items }: { items: Array<{ label: string; value: string }> }) => {
  if (!items.length) return null

  return (
    <dl className="mt-4 grid gap-2 border-t border-[#dce9e4] pt-4 dark:border-neutral-700">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 font-sarabun text-sm">
          <dt className="text-neutral-500 dark:text-neutral-400">{item.label}</dt>
          <dd className="text-right font-semibold text-neutral-900 dark:text-neutral-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const formatNumber = (value: number, locale: 'th' | 'en') =>
  value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 })

const formatPrice = (listing: PropertyListingDetail, isThai: boolean) => {
  if (listing.offer_amount === undefined) return isThai ? 'สอบถามราคา' : 'Price on request'
  const amount = listing.offer_amount.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 0 })
  const currency = listing.currency === 'USD' ? 'US$' : '฿'
  const unit =
    listing.price_unit === 'month'
      ? isThai
        ? '/เดือน'
        : '/month'
      : listing.price_unit === 'day'
        ? isThai
          ? '/วัน'
          : '/day'
        : listing.price_unit === 'week'
          ? isThai
            ? '/สัปดาห์'
            : '/week'
          : listing.price_unit === 'event_period'
            ? isThai
              ? '/งาน'
              : '/event'
            : ''
  return `${currency}${amount}${unit}`
}

const offerLabel = (value: string, isThai: boolean) => {
  const labels: Record<string, [string, string]> = {
    sale: ['ขาย', 'For sale'],
    rent: ['ให้เช่า', 'For rent'],
    sublease: ['ให้เช่าช่วง', 'Sublease'],
    business_transfer: ['เซ้ง / โอนกิจการ', 'Business transfer'],
  }
  return labels[value]?.[isThai ? 0 : 1] || value
}

const amenityLabel = (value: string, isThai: boolean) => {
  const labels: Record<string, [string, string]> = {
    air_conditioning: ['เครื่องปรับอากาศ', 'Air conditioning'],
    parking: ['ที่จอดรถ', 'Parking'],
    elevator: ['ลิฟต์', 'Elevator'],
    security: ['ระบบรักษาความปลอดภัย', 'Security'],
    swimming_pool: ['สระว่ายน้ำ', 'Swimming pool'],
    fitness: ['ฟิตเนส', 'Fitness'],
    wifi: ['อินเทอร์เน็ต / Wi-Fi', 'Internet / Wi-Fi'],
    pet_friendly: ['เลี้ยงสัตว์ได้', 'Pet friendly'],
  }
  return labels[value]?.[isThai ? 0 : 1] || value.replaceAll('_', ' ')
}

export default PropertyListingView
