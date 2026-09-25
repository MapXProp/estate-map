'use client'

import PropertyPrices from '@/components/PropertyPrices'
import { isPropertyPlan, propertyPreviewImages } from '@/lib/propertyDetailPresentation'
import { getPropertyPrices, propertyOffersLabel } from '@/lib/propertyPrices'
import styles from './PropertyListingView.module.css'

import PropertyDescription from '@/components/PropertyDescription'
import ListingContactDetails from '@/components/property-home/ListingContactDetails'
import ListingLocationSection from '@/components/property-home/ListingLocationSection'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'

import ListingImageFallback from '@/components/ListingImageFallback'
import ListingViewCount from '@/components/ListingViewCount'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import ListingDetailActions from '@/components/property-home/ListingDetailActions'
import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import { getMapPreviewGoogleMapsUrl } from '@/lib/propertyMapPreview'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import {
  Banknote,
  Building2,
  ExternalLink,
  LandPlot,
  MapPin,
  Ruler,
  ShieldCheck,
  SplitSquareVertical,
  WalletCards,
} from 'lucide-react'
import HeaderGallery, { type PropertyMediaItem } from '../../components/HeaderGallery'
import MobileListingActionBar from '../../components/MobileListingActionBar'
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

const LandListingView = ({ listing }: { listing: PropertyListingDetail }) => {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const title = isThai ? listing.title : listing.title_en || listing.title
  const description = isThai ? listing.description : listing.description_en || listing.description
  const address = isThai ? listing.address : listing.address_en || listing.address
  const district = isThai ? listing.district : listing.district_en || listing.district
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
      width: item.width,
      height: item.height,
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
  const location =
    typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
      ? { lat: listing.latitude, lng: listing.longitude }
      : undefined
  const locationMapURL = getMapPreviewGoogleMapsUrl(location)
  const formatNumber = (value: number) => value.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 })
  const factCards = [
    ...(landAreaSquareWah > 0
      ? [
          {
            icon: LandPlot,
            value: `${formatNumber(landAreaSquareWah)} ${isThai ? 'ตร.ว.' : 'sq.wah'}`,
            label: isThai ? 'เนื้อที่รวม' : 'Land area',
          },
        ]
      : []),
    ...(plotCount
      ? [{ icon: SplitSquareVertical, value: formatNumber(plotCount), label: isThai ? 'จำนวนแปลง' : 'Plots' }]
      : []),
    ...(frontage
      ? [
          {
            icon: Ruler,
            value: `≈ ${formatNumber(frontage)} ${isThai ? 'ม.' : 'm'}`,
            label: isThai ? 'หน้ากว้างรวม' : 'Frontage',
          },
        ]
      : []),
    ...(isVacantLand
      ? [
          {
            icon: LandPlot,
            value: isThai ? 'ที่ดินเปล่า' : 'Vacant land',
            label: isThai ? 'ไม่มีสิ่งปลูกสร้าง' : 'No structures',
          },
        ]
      : hasStructures
        ? [
            {
              icon: Building2,
              value: isThai ? 'มีสิ่งปลูกสร้าง' : 'With structures',
              label: isThai ? 'ลักษณะที่ดิน' : 'Land features',
            },
          ]
        : []),
  ]

  return (
    <div {...listingAnalyticsAttributes(listing, 'listing_page')} data-listing-tone="homes" className={styles.surface}>
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
                  imageAlt={title}
                  squareMobileCorners
                  hideMobileFavorite
                />
              ) : (
                <ListingImageFallback className="aspect-[16/7] rounded-[28px]" />
              )}
            </div>
            <div data-listing-identity className={styles.identity}>
              <div className="flex flex-col">
                <div className="order-2 mt-3 flex flex-wrap items-center gap-2 min-[744px]:order-1 min-[744px]:mt-0">
                  <span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50]">
                    {propertyOffersLabel(prices, isThai)}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {isVacantLand ? (isThai ? 'ที่ดินเปล่า' : 'Vacant land') : isThai ? 'ที่ดิน' : 'Land'}
                  </span>
                  {isSoldTogether && plotCount ? (
                    <span className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-sm font-medium text-[#c95a16] dark:bg-amber-950/40 dark:text-amber-200">
                      {isThai ? `ขายรวม ${plotCount} แปลง` : `Sold together · ${plotCount} plots`}
                    </span>
                  ) : null}
                  {listing.is_verified ? (
                    <span className="hidden items-center gap-1.5 rounded-full bg-[#edf5f1] px-3 py-1.5 text-sm font-semibold text-[#176b50] min-[744px]:inline-flex">
                      <ShieldCheck className="size-4" /> {isThai ? 'ตรวจสอบแล้ว' : 'Verified'}
                    </span>
                  ) : null}
                </div>
                <div className="order-1 min-[744px]:order-2 min-[744px]:mt-4">
                  <h1 className="max-w-4xl text-[1.625rem] leading-[1.28] font-semibold tracking-tight text-neutral-950 sm:text-[2rem] lg:text-[2.25rem] dark:text-white">
                    {title}
                  </h1>
                  <div className={styles.listingTools}>
                    <ListingViewCount
                      listingId={listing.public_listing_id}
                      initialCount={listing.view_count}
                      source="listing_page"
                    />
                    <ListingDetailActions identifier={listing.slug || listing.public_listing_id} title={title} />
                  </div>
                </div>
              </div>
              {fullAddress && (
                <div
                  data-listing-address
                  className="mt-3 flex items-start gap-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300"
                >
                  <MapPin className="mt-0.5 size-5 shrink-0 text-[#176b50]" />
                  <div className="min-w-0">
                    <span className="min-[744px]:hidden">{fullAddress}</span>
                    <span className="hidden min-[744px]:inline">
                      {[district, province].filter(Boolean).join(' · ') || fullAddress}
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
              )}
            </div>

            <section id="listing-overview" aria-label={isThai ? 'ข้อมูลสำคัญ' : 'Key facts'} className={styles.facts}>
              {factCards.map((item) => (
                <div key={item.label} className={`${styles.fact} bg-white dark:border-neutral-800 dark:bg-neutral-900`}>
                  <item.icon className="size-5 text-[#176b50]" aria-hidden="true" />
                  <p className="mt-3 text-lg font-semibold text-neutral-950 dark:text-white">{item.value}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.label}</p>
                </div>
              ))}
            </section>

            <section
              data-listing-inline-price
              className="mt-5 rounded-2xl border border-[#dce9e4] bg-[#f7faf8] p-4 min-[1100px]:hidden dark:border-[#205e30] dark:bg-[#173520]"
            >
              <p className="font-sarabun text-sm text-neutral-500 dark:text-neutral-300">{isThai ? 'ราคา' : 'Price'}</p>
              <PropertyPrices prices={prices} variant="detail" className="mt-2 text-[#123f32] dark:text-white" />
              {pricePerSquareWah ? (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-300">
                  {isThai
                    ? `เฉลี่ย ${formattedPricePerSquareWah}/ตร.ว.`
                    : `Average ${formattedPricePerSquareWah}/sq.wah`}
                </p>
              ) : null}
            </section>

            <section id="listing-description" className={styles.section}>
              <h2 className="text-xl font-semibold text-neutral-950 min-[744px]:text-2xl">
                {isThai ? 'รายละเอียดที่ดิน' : 'Land details'}
              </h2>
              <PropertyDescription
                text={description}
                sectioned
                separateLocation
                isThai={isThai}
                className="mt-4 text-[15px]"
              />
            </section>

            <ListingLocationSection listing={listing} isThai={isThai} className={styles.section} />

            {featureCards.items.length > 0 && (
              <section className={styles.section}>
                <h2 className="text-2xl font-semibold text-neutral-950">{featureCards.heading}</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {featureCards.items.map((item) => (
                    <div key={item.title} className={styles.featureCard}>
                      <h3 className="font-semibold text-[#123f32]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {listing.transaction_terms.length > 0 && (
              <section className={styles.section}>
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
              <div className={styles.pricePanel}>
                <p className={styles.priceLabel}>
                  <Banknote aria-hidden="true" />
                  {isThai ? 'ราคาประกาศ' : 'Listing price'}
                </p>
                <PropertyPrices prices={prices} variant="detail" />
                {pricePerSquareWah ? (
                  <p className={styles.priceNote}>
                    {isThai ? 'เฉลี่ย' : 'Average'} {formattedPricePerSquareWah}/{isThai ? 'ตร.ว.' : 'sq.wah'}
                  </p>
                ) : null}
              </div>
              <div className={styles.contactBody}>
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
          priceNote={
            pricePerSquareWah
              ? `${isThai ? 'เฉลี่ย' : 'Average'} ${formattedPricePerSquareWah}/${isThai ? 'ตร.ว.' : 'sq.wah'}`
              : undefined
          }
          quickContact={
            contactLinks.find((contact) => contact.kind === 'phone') ||
            contactLinks.find((contact) => contact.kind === 'line')
          }
        >
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
        </MobileListingActionBar>
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
