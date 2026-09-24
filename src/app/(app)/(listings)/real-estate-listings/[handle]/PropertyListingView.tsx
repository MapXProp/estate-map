'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import ListingViewCount from '@/components/ListingViewCount'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import ListingContactDetails from '@/components/property-home/ListingContactDetails'
import ListingLocationSection from '@/components/property-home/ListingLocationSection'
import PropertyDescription from '@/components/PropertyDescription'
import PropertyPrices from '@/components/PropertyPrices'
import { getPropertyType, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import { isPropertyPlan, propertyPreviewImages } from '@/lib/propertyDetailPresentation'
import { getMapPreviewGoogleMapsUrl } from '@/lib/propertyMapPreview'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'
import { getPropertyPrices, propertyOffersLabel, propertyPricesText } from '@/lib/propertyPrices'
import { getPropertyMapSearchUrl, type PropertyListingDetail } from '@/lib/propertySearch'
import {
  Banknote,
  Bath,
  BedDouble,
  Building2,
  CarFront,
  ExternalLink,
  MapPin,
  Maximize2,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'
import MobileListingActionBar from '../../components/MobileListingActionBar'
import MobileListingContactSheet from '../../components/MobileListingContactSheet'
import styles from './PropertyListingView.module.css'

const PropertyListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const title = isThai ? listing.title : listing.title_en || listing.title
  const description = isThai ? listing.description : listing.description_en || listing.description
  const address = isThai ? listing.address : listing.address_en || listing.address
  const subdistrict = isThai ? listing.subdistrict : listing.subdistrict_en || listing.subdistrict
  const district = isThai ? listing.district : listing.district_en || listing.district
  const province = isThai ? listing.province : listing.province_en || listing.province
  const propertyType = getPropertyType(normalizeLegacyPropertyType(listing.property_type_code))
  const propertyLabel = isThai
    ? propertyType?.nameTh || listing.property_type_code
    : propertyType?.nameEn || listing.property_type_code
  const images = listing.media.filter((item) => item.media_type === 'image').map((item) => item.url)
  const media: PropertyMediaItem[] = listing.media
    .filter((item) => ['image', 'video', '360', 'panorama'].includes(item.media_type))
    .map((item) => ({
      id: String(item.id),
      type:
        item.media_type === 'image'
          ? isPropertyPlan(item)
            ? 'floor-plan'
            : 'photo'
          : item.media_type === 'video'
            ? 'video'
            : '360',
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      caption: item.title || item.alt_text,
    }))
  const fullAddress = [address, subdistrict, district, province, listing.postal_code].filter(Boolean).join(' ')
  const projectDisplayName = listing.project_display_name || listing.project_name_en || listing.project_name
  const prices = getPropertyPrices(listing)
  const listingTone =
    propertyType?.groupCode === 'commercial' || propertyType?.groupCode === 'mixed_use'
      ? 'business'
      : prices.length === 1 && prices[0].offerType === 'rent'
        ? 'rooms'
        : 'homes'
  const price = propertyPricesText(prices, isThai, formatCurrencyFrom)
  const formatRetailAmount = (amount: number) => formatCurrencyFrom(amount, listing.currency)
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
  const contactLinks = getPropertyPreviewContacts(listing)
  const hasContacts = Boolean(
    listing.contact_name || listing.organization_name || listing.contact_organization_name || contactLinks.length
  )
  const location =
    typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
      ? { lat: listing.latitude, lng: listing.longitude }
      : undefined
  const locationMapURL = getMapPreviewGoogleMapsUrl(location)
  const isTrustedContact =
    listing.organization_verification_status === 'verified' ||
    listing.contact_verification_status === 'authority_verified'
  const facts = [
    ...(listing.land_area_sqm !== undefined
      ? [
          {
            icon: Maximize2,
            value: `${formatNumber(listing.land_area_sqm / 4, locale)} ${isThai ? 'ตร.ว.' : 'sq.wah'}`,
            label: isThai ? 'ขนาดที่ดิน' : 'Land area',
          },
        ]
      : []),
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
    ...(listing.total_floors !== undefined
      ? [{ icon: Building2, value: formatNumber(listing.total_floors, locale), label: isThai ? 'จำนวนชั้น' : 'Floors' }]
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
    <div
      {...listingAnalyticsAttributes(listing, 'listing_page')}
      data-listing-tone={listingTone}
      className={styles.surface}
    >
      <main
        data-property-listing-page
        className={`${styles.page} -mx-4 max-w-screen-xl px-3 min-[744px]:mx-auto min-[744px]:px-0 sm:px-5`}
      >
        <div className={styles.layout}>
          <div className={styles.content}>
            <div className={styles.gallery}>
              {media.length ? (
                <HeaderGallery
                  images={images}
                  media={media}
                  listingIdentifier={listing.slug || listing.public_listing_id}
                  gridType="grid2"
                  listingPresentation
                  previewImages={propertyPreviewImages(listing.media)}
                  propertyDetails={{
                    title,
                    category: propertyLabel,
                    price,
                    prices,
                    isVerified: listing.is_verified,
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
            </div>
            <div className={styles.identity}>
              <div className="flex flex-col">
                <div className="order-2 mt-3 flex flex-wrap items-center gap-2 min-[744px]:order-1 min-[744px]:mt-0">
                  <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 font-sarabun text-sm font-semibold text-[#176b50]">
                    {propertyOffersLabel(prices, isThai) || offerLabel(listing.offer_type, isThai)}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 font-sarabun text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {propertyLabel}
                  </span>
                  {listing.usage_type === 'mixed' ? (
                    <span className="rounded-full bg-[#eef3f8] px-3 py-1.5 font-sarabun text-sm font-semibold text-[#385f7a] dark:bg-sky-950/45 dark:text-sky-200">
                      {isThai ? 'อยู่อาศัย + ธุรกิจ' : 'Mixed use · live + work'}
                    </span>
                  ) : null}
                  {listing.is_verified ? (
                    <span className="hidden items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 font-sarabun text-sm font-semibold text-[#176b50] min-[744px]:inline-flex">
                      <ShieldCheck className="size-4" /> {isThai ? 'ตรวจสอบแล้ว' : 'Verified'}
                    </span>
                  ) : null}
                </div>

                <div className="order-1 min-[744px]:order-2 min-[744px]:mt-4">
                  <h1 className="max-w-4xl font-sarabun text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.25rem] dark:text-white">
                    {title}
                  </h1>
                  <ListingViewCount
                    listingId={listing.public_listing_id}
                    initialCount={listing.view_count}
                    source="listing_page"
                    className="mt-2"
                  />
                </div>
              </div>
              {projectDisplayName ? (
                <Link
                  href={getPropertyMapSearchUrl(projectDisplayName)}
                  data-listing-project-name
                  className="mt-3 flex w-fit items-start gap-2 rounded-xl bg-[#edf5f1] px-3 py-2 font-sarabun text-sm text-[#176b50] transition hover:bg-[#e2efe9] dark:bg-emerald-950 dark:text-emerald-200"
                >
                  <Building2 className="mt-0.5 size-4.5 shrink-0" />
                  <span className="font-semibold">{projectDisplayName}</span>
                </Link>
              ) : null}
              {fullAddress ? (
                <div
                  data-listing-address
                  className="mt-3 flex items-start gap-2 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300"
                >
                  <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
                  <div className="min-w-0">
                    <span className="min-[744px]:hidden">{fullAddress}</span>
                    <span className="hidden min-[744px]:inline">
                      {[district, province].filter(Boolean).join(' · ')}
                    </span>
                    {locationMapURL && (
                      <a
                        href={locationMapURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-listing-map-link
                        aria-label={
                          isThai
                            ? 'ดูตำแหน่งใน Google Maps (เปิดแท็บใหม่)'
                            : 'View location in Google Maps (opens a new tab)'
                        }
                        className="ml-2 inline-flex items-center gap-1 font-medium whitespace-nowrap text-[#176b50] underline underline-offset-4"
                      >
                        {isThai ? 'ดูแผนที่' : 'View map'}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            {facts.length ? (
              <section id="listing-overview" aria-label={isThai ? 'ข้อมูลสำคัญ' : 'Key facts'} className={styles.facts}>
                {facts.map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.fact} bg-white dark:border-neutral-800 dark:bg-neutral-900`}
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

            {prices.length > 0 ? (
              <section
                className={`mt-5 rounded-2xl border border-[#dce9e4] bg-[#f7faf8] p-4 min-[1100px]:hidden dark:border-[#205e30] dark:bg-[#173520] ${listing.property_type_code !== 'retail_space' && prices.length === 1 ? 'max-[743px]:hidden' : ''}`}
              >
                <p className="font-sarabun text-sm text-neutral-500 dark:text-neutral-300">
                  {listing.property_type_code === 'retail_space'
                    ? isThai
                      ? 'ค่าเช่าและเงื่อนไข'
                      : 'Rent & terms'
                    : isThai
                      ? 'ราคา'
                      : 'Price'}
                </p>
                <PropertyPrices prices={prices} variant="detail" className="mt-2 text-[#123f32] dark:text-white" />
                <RetailTerms items={retailTerms} />
              </section>
            ) : null}

            <section id="listing-description" className={`${styles.section} mt-8`}>
              <h2 className="font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
                {isThai ? 'รายละเอียดประกาศ' : 'Listing details'}
              </h2>
              <PropertyDescription
                text={description}
                sectioned
                separateLocation
                isThai={isThai}
                className="mt-4 font-sarabun text-[15px]"
              />
            </section>

            <ListingLocationSection listing={listing} isThai={isThai} className={`${styles.section} mt-8`} />

            {listing.amenities.length ? (
              <section className={styles.section}>
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
          </div>

          <aside className={styles.sidebar}>
            <div
              id="contact-owner-desktop"
              data-listing-contact-card
              className={`${styles.contactCard} bg-white dark:bg-neutral-900`}
            >
              <div className={styles.pricePanel}>
                <p className={styles.priceLabel}>
                  <Banknote aria-hidden="true" />
                  {isThai ? 'ราคาประกาศ' : 'Listing price'}
                </p>
                <PropertyPrices prices={prices} variant="detail" />
              </div>
              <div className={styles.contactBody}>
                {retailTerms.length > 0 && (
                  <div className="mb-5">
                    <RetailTerms items={retailTerms} />
                  </div>
                )}
                <ListingContactDetails listing={listing} isThai={isThai} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {(hasContacts || locationMapURL) && (
        <MobileListingActionBar
          prices={prices}
          isThai={isThai}
          mapUrl={locationMapURL}
          quickContact={
            contactLinks.find((contact) => contact.kind === 'phone') ||
            contactLinks.find((contact) => contact.kind === 'line')
          }
        >
          {hasContacts && (
            <MobileListingContactSheet
              showOnTablet
              isThai={isThai}
              triggerLabel={isThai ? 'ติดต่อผู้ประกาศ' : 'Contact advertiser'}
              analyticsListingId={listing.public_listing_id}
              analyticsPropertyType={listing.property_type_code}
              contactName={listing.contact_name}
              roleLabel={contactRoleLabel(listing.contact_role_code)}
              organizationName={listing.organization_name || listing.contact_organization_name}
              organizationPublicId={listing.organization_public_id}
              verificationStatus={listing.contact_verification_status}
              trusted={isTrustedContact}
              phone={listing.contact_phone}
              secondaryPhone={listing.contact_phone_secondary}
              email={listing.contact_email}
              lineId={listing.line_id}
              instagramHandle={listing.instagram_handle}
              websiteUrl={listing.organization_website_url}
            />
          )}
        </MobileListingActionBar>
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

const offerLabel = (value: string, isThai: boolean) => {
  const labels: Record<string, [string, string]> = {
    sale: ['ขาย', 'For sale'],
    rent: ['ให้เช่า', 'For rent'],
    sublease: ['ให้เช่าช่วง', 'Sublease'],
    business_transfer: ['เซ้ง / โอนกิจการ', 'Business transfer'],
  }
  return labels[value]?.[isThai ? 0 : 1] || value
}

const contactRoleLabel = (value: string) => {
  const labels: Record<string, string> = {
    owner: 'เจ้าของทรัพย์',
    owner_representative: 'ผู้รับมอบอำนาจจากเจ้าของ',
    independent_broker: 'นายหน้าอิสระ',
    agency_broker: 'นายหน้าสังกัดบริษัท',
    developer_investor_representative: 'ตัวแทนโครงการ / นักลงทุน',
    property_manager: 'ผู้ดูแลทรัพย์ / ผู้จัดการอาคาร',
  }
  return labels[value] || 'ผู้ลงประกาศ'
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
    pet_area: ['พื้นที่สำหรับสัตว์เลี้ยง', 'Pet area'],
  }
  return labels[value]?.[isThai ? 0 : 1] || value.replaceAll('_', ' ')
}

export default PropertyListingView
