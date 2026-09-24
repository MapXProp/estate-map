'use client'

import MobileListingActionBar from '@/app/(app)/(listings)/components/MobileListingActionBar'
import MobileListingContactSheet from '@/app/(app)/(listings)/components/MobileListingContactSheet'
import BtnLikeIcon from '@/components/BtnLikeIcon'
import ListingViewCount from '@/components/ListingViewCount'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import sheetStyles from '@/components/property-map/MobileSheet.module.css'
import PropertyPhotoGallery from '@/components/property-map/PropertyPhotoGallery'
import PropertyPreviewContactCard from '@/components/property-map/PropertyPreviewContactCard'
import PropertyDescription from '@/components/PropertyDescription'
import PropertyPrices from '@/components/PropertyPrices'
import { getPropertyType, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import { getMapPreviewGallery, getMapPreviewGoogleMapsUrl } from '@/lib/propertyMapPreview'
import {
  getPropertyPreviewContactAuthority,
  getPropertyPreviewContactRole,
  getPropertyPreviewFacts,
} from '@/lib/propertyPreviewDetails'
import { getPropertyPrices } from '@/lib/propertyPrices'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ChevronLeft, ExternalLink, ImageIcon, MapPin, Maximize2, Share2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PropertyPreviewModal = ({ listing }: { listing: PropertyListingDetail }) => {
  const router = useRouter()
  const { locale } = usePreferences()
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
  const directionsUrl = getMapPreviewGoogleMapsUrl(
    typeof listing.latitude === 'number' && typeof listing.longitude === 'number'
      ? { lat: listing.latitude, lng: listing.longitude }
      : undefined,
    true
  )
  const propertyType = getPropertyType(normalizeLegacyPropertyType(listing.property_type_code))
  const category = (isThai ? propertyType?.nameTh : propertyType?.nameEn) || (isThai ? 'อสังหาริมทรัพย์' : 'Property')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(() => router.back(), !galleryOpen && !contactOpen)
  const prices = getPropertyPrices(listing)

  const shareProperty = async () => {
    const shareData = { title, url: `${window.location.origin}/real-estate-listings/${encodeURIComponent(handle)}` }
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined)
      return
    }
    await navigator.clipboard?.writeText(shareData.url).catch(() => undefined)
  }

  return (
    <Dialog
      open
      onClose={() => {
        if (!galleryOpen && !contactOpen) dismiss()
      }}
      className="relative z-[80]"
    >
      <DialogBackdrop
        ref={backdropRef}
        className={`${sheetStyles.modalBackdrop} fixed inset-0 bg-neutral-950/55 backdrop-blur-[1px]`}
      />
      <div className="fixed inset-0 overflow-y-auto p-3 lg:p-5">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            {...listingAnalyticsAttributes(listing, 'map_modal')}
            ref={panelRef}
            data-property-detail-sheet
            className={`${sheetStyles.modalPanel} relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1380px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(0,0,0,.3)] lg:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900`}
          >
            <header
              data-sheet-drag-handle
              className={`${sheetStyles.handle} flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4 sm:px-6 dark:border-neutral-800`}
            >
              <span className={sheetStyles.grip} aria-hidden="true" />
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <button
                type="button"
                onClick={dismiss}
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
                  onClick={dismiss}
                  aria-label="ปิดรายละเอียด"
                  className="flex size-10 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <X className="size-5" />
                </button>
              </div>
            </header>

            <div data-sheet-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                      <ListingViewCount
                        listingId={listing.public_listing_id}
                        initialCount={listing.view_count}
                        source="map_modal"
                      />
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

                <aside className="hidden border-s border-neutral-200 bg-[#f7faf8] p-6 lg:block dark:border-neutral-800 dark:bg-neutral-950/40">
                  <PropertyPreviewContactCard
                    listing={listing}
                    price={<PropertyPrices prices={prices} variant="detail" />}
                    isThai={isThai}
                    directionsUrl={directionsUrl}
                  />
                </aside>
              </div>
            </div>
            <footer data-property-preview-footer className="shrink-0 lg:hidden">
              <MobileListingActionBar
                placement="sheet"
                prices={prices}
                isThai={isThai}
                mapUrl={directionsUrl}
                open={contactOpen}
                onOpenChange={setContactOpen}
              >
                <MobileListingContactSheet
                  key={listing.public_listing_id}
                  analyticsListingId={listing.public_listing_id}
                  analyticsPropertyType={listing.property_type_code}
                  contactName={listing.contact_name}
                  roleLabel={getPropertyPreviewContactRole(listing.contact_role_code, isThai)}
                  authorityLabel={getPropertyPreviewContactAuthority(listing.contact_authority_code, isThai)}
                  organizationName={listing.organization_name || listing.contact_organization_name}
                  organizationPublicId={listing.organization_public_id}
                  verificationStatus={listing.contact_verification_status}
                  trusted={listing.organization_verification_status === 'verified'}
                  phone={listing.contact_phone}
                  secondaryPhone={listing.contact_phone_secondary}
                  email={listing.contact_email}
                  lineId={listing.line_id}
                  instagramHandle={listing.instagram_handle}
                  websiteUrl={listing.organization_website_url}
                  triggerLabel={isThai ? 'ติดต่อ' : 'Contact'}
                  showOnTablet
                  maxWidth={1023}
                  isThai={isThai}
                />
              </MobileListingActionBar>
            </footer>
          </DialogPanel>
        </div>
      </div>

      {galleryOpen && (
        <PropertyPhotoGallery images={images} title={title} isThai={isThai} onClose={() => setGalleryOpen(false)} />
      )}
    </Dialog>
  )
}

export default PropertyPreviewModal
