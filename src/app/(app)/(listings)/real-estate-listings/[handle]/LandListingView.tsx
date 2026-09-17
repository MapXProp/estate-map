'use client'

import PropertyPrices from '@/components/PropertyPrices'
import { isPropertyPlan, propertyPreviewImages } from '@/lib/propertyDetailPresentation'
import { getPropertyPrices, propertyOffersLabel } from '@/lib/propertyPrices'
import styles from './PropertyListingView.module.css'

import PropertyDescription from '@/components/PropertyDescription'
import ListingContactDetails, { ListingContactChannels } from '@/components/property-home/ListingContactDetails'
import ListingLocationSection from '@/components/property-home/ListingLocationSection'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import ListingImageFallback from '@/components/ListingImageFallback'
import ListingViewCount from '@/components/ListingViewCount'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import {
  Building2,
  ChevronDown,
  LandPlot,
  MapPin,
  Ruler,
  ShieldCheck,
  SplitSquareVertical,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'
import MobileListingContactSheet from '../../components/MobileListingContactSheet'

const numericDetail = (listing: PropertyListingDetail, key: string) => {
  const value = listing.category_details?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const booleanDetail = (listing: PropertyListingDetail, key: string) => listing.category_details?.[key] === true

const textDetail = (listing: PropertyListingDetail, key: string) => {
  const value = listing.category_details?.[key]
  return typeof value === 'string' ? value : ''
}

type FeatureCard = { title_th?: unknown; body_th?: unknown; title_en?: unknown; body_en?: unknown }

const getFeatureCards = (listing: PropertyListingDetail, isThai: boolean) => {
  const block = listing.content_blocks?.find((item) => item.code === 'land_highlights' && item.type === 'feature_cards')
  const items = Array.isArray(block?.content)
    ? block.content
        .filter((item): item is FeatureCard => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          title:
            typeof (isThai ? item.title_th : item.title_en) === 'string'
              ? String(isThai ? item.title_th : item.title_en)
              : '',
          body:
            typeof (isThai ? item.body_th : item.body_en) === 'string'
              ? String(isThai ? item.body_th : item.body_en)
              : '',
        }))
        .filter((item) => item.title && item.body)
    : []

  return { heading: (isThai ? block?.heading_th : block?.heading_en) || '', items }
}

const formatThaiNumber = (value: number) => value.toLocaleString('th-TH', { maximumFractionDigits: 0 })

const LandListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const title = isThai ? listing.title : listing.title_en || listing.title
  const description = isThai ? listing.description : listing.description_en || listing.description
  const address = isThai ? listing.address : listing.address_en || listing.address
  const province = isThai ? listing.province : listing.province_en || listing.province
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
  const landAreaSquareWah = numericDetail(listing, 'land_area_square_wah') ?? (listing.land_area_sqm || 0) / 4
  const plotCount = numericDetail(listing, 'plot_count')
  const frontage = numericDetail(listing, 'road_frontage_meters')
  const storedPricePerSquareWah = numericDetail(listing, 'price_per_square_wah')
  const isVacantLand = booleanDetail(listing, 'vacant_land')
  const hasStructures = booleanDetail(listing, 'structures_present')
  const isSoldTogether = booleanDetail(listing, 'sale_together_only')
  const contactRole = contactRoleLabel(listing.contact_role_code)
  const isOwnerDirect = listing.contact_role_code === 'owner' || textDetail(listing, 'seller_type') === 'owner_direct'
  const isTrustedContact = listing.contact_role_code
    ? listing.contact_verification_status === 'authority_verified'
    : listing.is_verified || textDetail(listing, 'contact_trust_status') === 'verified'
  const featureCards = getFeatureCards(listing, isThai)
  const prices = getPropertyPrices(listing)
  const offerAmount = prices.find((price) => price.offerType === 'sale')?.amount || 0
  const pricePerSquareWah =
    offerAmount > 0 && landAreaSquareWah > 0 ? Math.round(offerAmount / landAreaSquareWah) : storedPricePerSquareWah
  const formattedPricePerSquareWah = pricePerSquareWah ? formatCurrencyFrom(pricePerSquareWah, listing.currency) : ''
  const fullAddress = [address, province].filter(Boolean).join(' ')
  const contactLinks = getPropertyPreviewContacts(listing)
  const hasContacts = Boolean(
    listing.contact_name || listing.organization_name || listing.contact_organization_name || contactLinks.length
  )
  const mapURL =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`
      : ''
  const factCards = [
    { icon: LandPlot, value: `${formatThaiNumber(landAreaSquareWah)} ตร.ว.`, label: 'เนื้อที่รวม' },
    ...(plotCount ? [{ icon: SplitSquareVertical, value: `${plotCount} แปลง`, label: 'แปลงติดกัน' }] : []),
    ...(frontage ? [{ icon: Ruler, value: `≈ ${frontage} ม.`, label: 'หน้ากว้างรวม' }] : []),
    ...(isVacantLand || !hasStructures ? [{ icon: LandPlot, value: 'ที่ดินเปล่า', label: 'ไม่มีสิ่งปลูกสร้าง' }] : []),
  ]

  return (
    <div {...listingAnalyticsAttributes(listing, 'listing_page')} className="pb-24 min-[1100px]:pb-0">
      <main
        data-property-listing-page
        className={`${styles.page} -mx-4 max-w-screen-xl px-3 min-[744px]:mx-auto min-[744px]:px-0 sm:px-5`}
      >
        <h1 className="sr-only">{title}</h1>
        <div className="px-1 pt-2 pb-4 min-[744px]:hidden">
          <div className="mb-1.5 flex min-h-10 items-center justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
              <span className="text-[#176b50]">{propertyOffersLabel(prices, isThai)}</span>
              <span className="text-neutral-300" aria-hidden="true">
                ·
              </span>
              <span className="truncate text-neutral-500">{isVacantLand ? 'ที่ดินเปล่า' : 'ที่ดิน'}</span>
            </p>
            <BtnLikeIcon
              listingIdentifier={listing.slug || listing.public_listing_id}
              className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#176b50] [&>svg]:!size-[18px]"
              colorClass="bg-transparent text-neutral-500 hover:bg-neutral-100 active:bg-neutral-100"
              sizeClass="size-10"
            />
          </div>
          <p
            aria-hidden="true"
            className="text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950"
          >
            {title}
          </p>
          {fullAddress && (
            <div className="mt-2.5 flex items-start gap-2 text-sm leading-6 text-neutral-600">
              <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
              <div className="min-w-0">
                <span>{fullAddress}</span>
                <a
                  href="#listing-location"
                  className="flex min-h-9 items-center text-sm font-medium text-[#176b50] underline underline-offset-4"
                >
                  {isThai ? 'ดูแผนที่และการเดินทาง' : 'View map and directions'}
                </a>
              </div>
            </div>
          )}
        </div>

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
                  imageAlt={title}
                  squareMobileCorners
                  hideMobileFavorite
                />
              ) : (
                <ListingImageFallback className="aspect-[16/7] rounded-[28px]" />
              )}
            </div>
            <div className={styles.landIdentity}>
              <div className="order-2 hidden flex-wrap items-center gap-2 min-[744px]:order-1 min-[744px]:flex">
                {prices.length > 0 && (
                  <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                    {propertyOffersLabel(prices, isThai)}
                  </span>
                )}
                {isVacantLand && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                    ที่ดินเปล่า
                  </span>
                )}
                {isSoldTogether && plotCount && (
                  <span className="hidden rounded-full bg-[#fff7ed] px-3 py-1.5 text-sm font-medium text-[#c95a16] min-[744px]:inline-flex">
                    ขายรวม {plotCount} แปลง
                  </span>
                )}
                {isOwnerDirect && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                    <UserRoundCheck className="size-4" /> เจ้าของขายเอง
                  </span>
                )}
                {contactRole && !isOwnerDirect && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
                    <Building2 className="size-4" /> {contactRole}
                  </span>
                )}
                {isTrustedContact && (
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50] min-[744px]:inline-flex">
                    <ShieldCheck className="size-4" /> ผู้ติดต่อเชื่อถือได้
                  </span>
                )}
              </div>

              <div className="order-1 hidden min-[744px]:order-2 min-[744px]:mt-4 min-[744px]:block">
                <p
                  aria-hidden="true"
                  className="max-w-4xl text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.25rem]"
                >
                  {title}
                </p>
                {fullAddress && (
                  <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-neutral-600 sm:text-base">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
                    <div className="min-w-0">
                      <span className="block">{fullAddress}</span>
                      <a
                        href="#listing-location"
                        className="inline-flex min-h-9 items-center text-sm font-medium text-[#176b50] underline underline-offset-4"
                      >
                        {isThai ? 'ดูแผนที่และการเดินทาง' : 'View map and directions'}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ListingViewCount
              listingId={listing.public_listing_id}
              initialCount={listing.view_count}
              source="listing_page"
              className="order-3 mt-3 min-[744px]:order-none"
            />
            <section className={`${styles.facts} order-3 min-[744px]:order-none`}>
              {factCards.map((item) => (
                <div key={item.label} className={`${styles.fact} bg-white`}>
                  <item.icon className="size-5 text-[#176b50]" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-neutral-950">{item.value}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.label}</p>
                </div>
              ))}
            </section>

            {hasContacts && (
              <details className="group order-2 mt-4 overflow-hidden rounded-2xl border border-[#dce9e4] bg-[#f7faf8] min-[744px]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 select-none [&::-webkit-details-marker]:hidden">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                    {isOwnerDirect ? <UserRoundCheck className="size-4.5" /> : <Building2 className="size-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500">
                      {isOwnerDirect ? 'เจ้าของขายเอง' : contactRole || 'ผู้ลงประกาศ'}
                    </p>
                    <p className="truncate text-sm font-semibold text-neutral-950">{listing.contact_name}</p>
                  </div>
                  {isTrustedContact && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#176b50]">
                      <ShieldCheck className="size-4" /> เชื่อถือได้
                    </span>
                  )}
                  <ChevronDown className="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t border-[#dce9e4] p-3">
                  <ListingContactChannels listing={listing} isThai={isThai} revealOnRequest={false} />
                </div>
              </details>
            )}

            <section className="order-1 mt-6 min-[744px]:order-none min-[744px]:mt-10 min-[744px]:border-t min-[744px]:border-neutral-200 min-[744px]:pt-8">
              <h2 className="text-xl font-semibold text-neutral-950 min-[744px]:text-2xl">รายละเอียดที่ดิน</h2>
              <PropertyDescription
                text={description}
                collapsible
                separateLocation
                isThai={isThai}
                className="mt-4 text-[15px]"
              />
            </section>

            <ListingLocationSection listing={listing} isThai={isThai} className="order-4 mt-8 min-[744px]:order-none" />

            {featureCards.items.length > 0 && (
              <section className="order-5 mt-10 border-t border-neutral-200 pt-8 min-[744px]:order-none">
                <h2 className="text-2xl font-semibold text-neutral-950">{featureCards.heading}</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {featureCards.items.map((item) => (
                    <div key={item.title} className="rounded-2xl bg-[#f4f8f6] p-5">
                      <h3 className="font-semibold text-[#123f32]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {listing.transaction_terms.length > 0 && (
              <section className="order-6 mt-10 border-t border-neutral-200 pt-8 min-[744px]:order-none">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-950">
                    <WalletCards className="size-5 text-[#176b50]" /> ค่าใช้จ่ายและเงื่อนไข
                  </h2>
                  <ul className="mt-4 space-y-2.5 text-sm leading-6 text-neutral-700">
                    {listing.transaction_terms.map((term) => (
                      <li key={term.code}>
                        <span className="font-medium text-neutral-800">{term.label_th}</span> {term.value_th}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div id="contact-owner-desktop" data-listing-contact-card className={`${styles.contactCard} bg-white`}>
              <p className="text-sm text-neutral-500">{isThai ? 'ราคา' : 'Price'}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <PropertyPrices prices={prices} variant="detail" className="text-neutral-950" />
                {pricePerSquareWah ? (
                  <p className="text-sm font-medium text-[#71817b]">เฉลี่ย {formattedPricePerSquareWah}/ตร.ว.</p>
                ) : null}
              </div>
              <div className="my-5 border-t border-neutral-200" />
              <ListingContactDetails listing={listing} isThai={isThai} />
            </div>
          </aside>
        </div>
      </main>

      {(hasContacts || mapURL) && (
        <div
          data-listing-contact-bar
          className={`${styles.bottomBar} border-t border-neutral-200 bg-white/96 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur`}
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {prices.length === 1 && (
                <p className="text-[10px] leading-none text-neutral-500">{isThai ? 'ราคา' : 'Price'}</p>
              )}
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <PropertyPrices prices={prices} variant="compact" className="text-neutral-950" />
                {pricePerSquareWah && prices.length === 1 ? (
                  <p className="text-[10px] leading-none font-medium whitespace-nowrap text-[#71817b]">
                    เฉลี่ย {formattedPricePerSquareWah}/ตร.ว.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {hasContacts && (
                <MobileListingContactSheet
                  showOnTablet
                  isThai={isThai}
                  triggerLabel={isThai ? 'ติดต่อ' : 'Contact'}
                  analyticsListingId={listing.public_listing_id}
                  analyticsPropertyType={listing.property_type_code}
                  contactName={listing.contact_name}
                  roleLabel={contactRole}
                  authorityLabel={contactAuthorityLabel(listing.contact_authority_code)}
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
              {mapURL && (
                <a
                  href={mapURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ตำแหน่งอสังหา"
                  title="ตำแหน่งอสังหา"
                  className="grid size-10 place-items-center rounded-full border border-[#d7e5df] bg-[#f3f8f6] text-[#176b50] transition active:scale-95"
                >
                  <MapPin className="size-[18px]" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
  return labels[value] || ''
}

const contactAuthorityLabel = (value: string) => {
  const labels: Record<string, string> = {
    self: 'ตนเอง',
    property_owner: 'เจ้าของทรัพย์โดยตรง',
    brokerage_company: 'บริษัทนายหน้าหรือทีม',
    developer_project: 'โครงการ / ผู้พัฒนา',
    investor_asset_holder: 'นักลงทุน / ผู้ถือทรัพย์',
    co_broker: 'นายหน้าร่วม (Co-broker)',
    property_management_company: 'บริษัทบริหารทรัพย์',
  }
  return labels[value] || ''
}

export default LandListingView
