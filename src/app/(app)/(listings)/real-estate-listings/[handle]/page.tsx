import {
  Bathtub02Icon,
  BodySoapIcon,
  CableCarIcon,
  CctvCameraIcon,
  HairDryerIcon,
  MeetingRoomIcon,
  ShampooIcon,
  Speaker01Icon,
  TvSmartIcon,
  VirtualRealityVr01Icon,
  WaterEnergyIcon,
  WaterPoloIcon,
  Wifi01Icon,
} from '@/components/Icons'
import StartRating from '@/components/StartRating'
import JsonLd from '@/components/seo/JsonLd'
import { getListingReviews } from '@/data/data'
import { getRealEstateListingByHandle } from '@/data/listings'
import { getPropertyType } from '@/data/propertyTaxonomy'
import { fetchPropertyListingDetail, type PropertyListingDetail } from '@/lib/propertySearch'
import { absoluteUrl, createPageMetadata, SITE_NAME, SITE_URL } from '@/lib/seo'
import { Button } from '@/shared/Button'
import ButtonSecondary from '@/shared/ButtonSecondary'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/shared/description-list'
import { Divider } from '@/shared/divider'
import { Link } from '@/shared/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import {
  Award04Icon,
  CropIcon,
  Flag03Icon,
  Mail01Icon,
  Medal01Icon,
  Navigation03Icon,
  SmartPhone01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cache, Fragment } from 'react'
import HeaderGallery from '../../components/HeaderGallery'
import HostAvatar from '../../components/HostAvatar'
import MobilePropertyOverview from '../../components/MobilePropertyOverview'
import SectionHeader from '../../components/SectionHeader'
import { SectionHeading, SectionSubheading } from '../../components/SectionHeading'
import SectionHost from '../../components/SectionHost'
import SectionListingReviews from '../../components/SectionListingReviews'
import SectionMap from '../../components/SectionMap'
import EventBoothListingView from './EventBoothListingView'
import LandListingView from './LandListingView'
import PropertyListingView from './PropertyListingView'

const getDatabaseListing = cache(fetchPropertyListingDetail)

const getListingPath = (handle: string) => `/real-estate-listings/${encodeURIComponent(handle)}`

const getListingImages = (listing: PropertyListingDetail) =>
  listing.media
    .filter((item) => item.media_type === 'image')
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((item) => absoluteUrl(item.url))

const getListingSection = (listing: PropertyListingDetail) => {
  if (
    listing.event ||
    ['shophouse', 'home_office', 'office', 'retail_space', 'warehouse', 'factory', 'hotel_resort'].includes(
      listing.property_type_code
    )
  ) {
    return { name: 'พื้นที่ธุรกิจ', url: absoluteUrl('/business') }
  }
  if (['rental_room', 'apartment', 'flat', 'dormitory', 'monthly_hotel'].includes(listing.property_type_code)) {
    return { name: 'ห้องเช่าและที่พัก', url: absoluteUrl('/rooms') }
  }
  return { name: 'บ้านและที่อยู่อาศัย', url: absoluteUrl('/homes') }
}

const getAddressStructuredData = (listing: PropertyListingDetail) => ({
  '@type': 'PostalAddress',
  streetAddress: [listing.address, listing.road].filter(Boolean).join(' '),
  addressLocality: listing.district,
  addressRegion: listing.province,
  postalCode: listing.postal_code,
  addressCountry: 'TH',
})

const getListingStructuredData = (listing: PropertyListingDetail) => {
  const canonicalUrl = absoluteUrl(getListingPath(listing.slug))
  const images = getListingImages(listing)
  const section = getListingSection(listing)
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MapxProp', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: section.name, item: section.url },
      { '@type': 'ListItem', position: 3, name: listing.title, item: canonicalUrl },
    ],
  }

  if (listing.event?.rounds.length) {
    const event = listing.event
    const organizerName = event.organizer_name || listing.contact_organization_name || listing.contact_name || SITE_NAME
    const locationName = event.venue_name || listing.building_name || listing.project_name || listing.address
    const events = event.rounds.map((round, index) => ({
      '@type': 'Event',
      '@id': `${canonicalUrl}#round-${index + 1}`,
      name: round.label ? `${event.name} – ${round.label}` : `${event.name} รอบที่ ${index + 1}`,
      description: listing.description,
      startDate: round.starts_on,
      endDate: round.ends_on,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      image: images,
      url: `${canonicalUrl}#round-${index + 1}`,
      location: {
        '@type': 'Place',
        name: [locationName, event.venue_floor_label].filter(Boolean).join(' · '),
        address: getAddressStructuredData(listing),
        ...(listing.latitude !== undefined && listing.longitude !== undefined
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: listing.latitude,
                longitude: listing.longitude,
              },
            }
          : {}),
      },
      organizer: {
        '@type': event.organizer_name || listing.contact_organization_name ? 'Organization' : 'Person',
        name: organizerName,
        ...(event.organizer_website_url ? { url: event.organizer_website_url } : {}),
      },
      ...(!event.price_on_request && (round.price_amount ?? listing.offer_amount) !== undefined
        ? {
            offers: {
              '@type': 'Offer',
              url: canonicalUrl,
              price: round.price_amount ?? listing.offer_amount,
              priceCurrency: listing.currency || 'THB',
              availability:
                round.availability_status === 'closed' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
          }
        : {}),
    }))

    return { '@context': 'https://schema.org', '@graph': [breadcrumb, ...events] }
  }

  const place = {
    '@type': 'Place',
    '@id': `${canonicalUrl}#property`,
    name: listing.title,
    description: listing.description,
    image: images,
    address: getAddressStructuredData(listing),
    ...(listing.latitude !== undefined && listing.longitude !== undefined
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: listing.latitude,
            longitude: listing.longitude,
          },
        }
      : {}),
  }

  const offer =
    listing.offer_amount !== undefined
      ? {
          '@type': 'Offer',
          '@id': `${canonicalUrl}#offer`,
          price: listing.offer_amount,
          priceCurrency: listing.currency || 'THB',
          url: canonicalUrl,
          availability: 'https://schema.org/InStock',
          itemOffered: { '@id': `${canonicalUrl}#property` },
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumb,
      place,
      ...(offer ? [offer] : []),
      {
        '@type': 'WebPage',
        '@id': canonicalUrl,
        url: canonicalUrl,
        name: listing.title,
        description: listing.description,
        primaryImageOfPage: images[0] ? { '@type': 'ImageObject', url: images[0] } : undefined,
        mainEntity: { '@id': `${canonicalUrl}#property` },
        datePublished: listing.published_at,
        inLanguage: 'th-TH',
        breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
      },
    ],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const databaseListing = await getDatabaseListing(handle)

  if (databaseListing) {
    const propertyType = getPropertyType(databaseListing.property_type_code)
    const location = [databaseListing.district, databaseListing.province].filter(Boolean).join(' ')
    return createPageMetadata({
      title: databaseListing.title,
      description:
        databaseListing.description ||
        `ดูรายละเอียด${propertyType?.nameTh || 'อสังหาริมทรัพย์'}${location ? `ใน${location}` : ''} พร้อมราคา รูปภาพ ทำเล และข้อมูลติดต่อ`,
      path: getListingPath(databaseListing.slug || handle),
      keywords: [
        databaseListing.event?.name,
        propertyType?.nameTh,
        databaseListing.offer_type === 'sale' ? 'ขาย' : 'ให้เช่า',
        databaseListing.district,
        databaseListing.province,
        'MapxProp',
      ].filter((value): value is string => Boolean(value)),
      images: getListingImages(databaseListing),
      type: 'article',
    })
  }
  const listing = await getRealEstateListingByHandle(handle)

  if (!listing) {
    return createPageMetadata({
      title: 'ไม่พบประกาศ',
      description: 'ไม่พบประกาศอสังหาริมทรัพย์ที่คุณกำลังค้นหา',
      path: getListingPath(handle),
      index: false,
    })
  }

  return createPageMetadata({
    title: listing.title,
    description: listing.description,
    path: getListingPath(handle),
    index: false,
  })
}

const Page = async ({ params }: { params: Promise<{ handle: string }> }) => {
  const { handle } = await params

  const databaseListing = await getDatabaseListing(handle)
  if (databaseListing?.event) {
    return (
      <>
        <JsonLd data={getListingStructuredData(databaseListing)} />
        <EventBoothListingView listing={databaseListing} />
      </>
    )
  }
  if (databaseListing?.property_type_code === 'land') {
    return (
      <>
        <JsonLd data={getListingStructuredData(databaseListing)} />
        <LandListingView listing={databaseListing} />
      </>
    )
  }
  if (databaseListing) {
    return (
      <>
        <JsonLd data={getListingStructuredData(databaseListing)} />
        <PropertyListingView listing={databaseListing} />
      </>
    )
  }

  const listing = await getRealEstateListingByHandle(handle)

  if (!listing?.id) {
    return redirect('/real-estate-categories/all')
  }
  const {
    address,
    bathrooms,
    bedrooms,
    date,
    description,
    featuredImage,
    galleryImgs,
    isAds,
    like,
    listingCategory,
    map,
    maxGuests,
    price,
    reviewCount,
    reviewStart,
    saleOff,
    title,
    host,
    acreage,
  } = listing
  const reviews = (await getListingReviews(handle)).slice(0, 3) // Fetching only the first 3 reviews for display

  //

  const renderSectionHeader = () => {
    return (
      <SectionHeader
        address={address}
        host={host}
        listingCategory={listingCategory}
        reviewCount={reviewCount}
        reviewStart={reviewStart}
        title={title}
        listingIdentifier={handle}
      >
        <div className="flex items-center gap-x-3">
          <UsersIcon className="mb-0.5 size-6" />
          <span>{maxGuests} guests</span>
        </div>
        <div className="flex items-center gap-x-3">
          <HugeiconsIcon icon={CropIcon} size={24} strokeWidth={1.5} />
          <span>{acreage} Sq.Fit</span>
        </div>
        <div className="flex items-center gap-x-3">
          <Bathtub02Icon className="mb-0.5 size-6" />
          <span>{bathrooms} baths</span>
        </div>
        <div className="flex items-center gap-x-3">
          <MeetingRoomIcon className="mb-0.5 size-6" />
          <span>{bedrooms} bedrooms</span>
        </div>
      </SectionHeader>
    )
  }

  const renderSectionInfo = () => {
    const highlights = [
      {
        title: 'ทำเลเดินทางสะดวก',
        description: 'อยู่ใกล้บริการและสิ่งอำนวยความสะดวกที่จำเป็นต่อการใช้ชีวิตประจำวัน',
      },
      {
        title: 'พื้นที่ใช้งานลงตัว',
        description: 'จัดสรรพื้นที่ภายในให้ใช้งานง่าย พร้อมพื้นที่สำหรับการอยู่อาศัยอย่างเป็นสัดส่วน',
      },
      {
        title: 'เหมาะกับการอยู่อาศัย',
        description: 'ตอบโจทย์ทั้งการอยู่อาศัยด้วยตัวเองและการวางแผนสำหรับครอบครัว',
      },
      {
        title: 'มีโอกาสต่อยอดในอนาคต',
        description: 'สามารถพิจารณาเพื่ออยู่อาศัย ปล่อยเช่า หรือถือครองระยะยาวได้',
      },
    ]
    return (
      <div className="listingSection__wrap">
        <SectionHeading>รายละเอียดอสังหา</SectionHeading>
        <div className="leading-relaxed text-neutral-700 dark:text-neutral-300">
          <span>{description}</span>
        </div>

        <div className="hidden min-[744px]:contents">
          <Divider />

          <SectionHeading>จุดเด่นของอสังหา</SectionHeading>
          <DescriptionList>
            {highlights.map((item, index) => (
              <Fragment key={index}>
                <DescriptionTerm>{item.title}</DescriptionTerm>
                <DescriptionDetails>{item.description}</DescriptionDetails>
              </Fragment>
            ))}
          </DescriptionList>
        </div>
      </div>
    )
  }

  const renderSectionAmenities = () => {
    const Amenities_demos = [
      { name: 'Wi-Fi ความเร็วสูง', icon: Wifi01Icon },
      { name: 'อ่างอาบน้ำ', icon: Bathtub02Icon },
      { name: 'ไดร์เป่าผม', icon: HairDryerIcon },
      { name: 'เครื่องเสียง', icon: Speaker01Icon },
      { name: 'แชมพู', icon: ShampooIcon },
      { name: 'สบู่อาบน้ำ', icon: BodySoapIcon },
      { name: 'ระบบน้ำพร้อมใช้งาน', icon: WaterEnergyIcon },
      { name: 'สระว่ายน้ำ', icon: WaterPoloIcon },
      { name: 'เดินทางสะดวก', icon: CableCarIcon },
      { name: 'สมาร์ตทีวี', icon: TvSmartIcon },
      { name: 'กล้องวงจรปิด', icon: CctvCameraIcon },
      { name: 'รองรับการชมทรัพย์ออนไลน์', icon: VirtualRealityVr01Icon },
    ]

    return (
      <div className="listingSection__wrap">
        <div>
          <SectionHeading>สิ่งอำนวยความสะดวก</SectionHeading>
          <SectionSubheading>รายละเอียดอุปกรณ์และบริการที่มีในอสังหานี้</SectionSubheading>
        </div>
        <Divider className="w-14!" />

        <div className="grid grid-cols-1 gap-6 text-sm text-neutral-700 xl:grid-cols-3 dark:text-neutral-300">
          {Amenities_demos.filter((_, i) => i < 12).map((item) => (
            <div key={item.name} className="flex items-center gap-x-3">
              <item.icon className="h-6 w-6" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        {/* ----- */}
        <div className="w-14 border-b border-neutral-200"></div>
        <div>
          <ButtonSecondary>ดูสิ่งอำนวยความสะดวกทั้งหมด</ButtonSecondary>
        </div>
      </div>
    )
  }

  const renderSidebarPriceAndForm = () => {
    return (
      <div className="listingSection__wrap sm:shadow-xl">
        {/* PRICE */}
        <div>
          <p className="text-base font-normal text-neutral-500 dark:text-neutral-400">Offers over </p>
          <div className="mt-1.5 flex items-end text-2xl font-semibold sm:text-3xl">
            <span className="text-neutral-300 line-through">$350</span>
            <span className="mx-2">{price}</span>
          </div>
        </div>

        <Divider />

        {/* host */}
        <div className="flex items-center gap-x-4">
          <HostAvatar avatarUrl={host.avatarUrl} />
          <div>
            <SectionHeading>
              <Link href={'/authors/' + host.handle}>{host.displayName}</Link>
            </SectionHeading>
            <div className="mt-1.5 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
              <StartRating point={host.rating} reviewCount={host.reviewsCount} />
              <span className="mx-2">·</span>
              <span>{host.listingsCount} properties</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-x-1.5">
            <HugeiconsIcon icon={Medal01Icon} size={20} color="currentColor" strokeWidth={1.5} />
            Supperhost
          </div>
          <div className="w-px bg-neutral-200 dark:bg-neutral-700"></div>
          <div className="flex items-center gap-x-1.5">
            <HugeiconsIcon icon={Award04Icon} size={20} color="currentColor" strokeWidth={1.5} />
            2+ years
          </div>
        </div>

        {/* info */}
        <div className="flex flex-col gap-y-2.5 text-neutral-700 dark:text-neutral-300">
          <div className="flex items-center gap-x-3">
            <HugeiconsIcon icon={Mail01Icon} size={24} />
            <span>{host.email}</span>
          </div>
          <div className="flex items-center gap-x-3">
            <HugeiconsIcon icon={SmartPhone01Icon} size={24} />
            <span>{host.phone}</span>
          </div>
        </div>

        {/* == */}
        <div className="flex gap-2">
          <Button href={'/authors/' + handle}>Get in touch</Button>
          <ButtonSecondary outline>
            Sent email
            <HugeiconsIcon icon={Navigation03Icon} size={20} color="currentColor" strokeWidth={1.5} className="mb-px" />
          </ButtonSecondary>
        </div>
        <Divider />

        <div className="flex items-center gap-x-2 text-sm text-neutral-700 dark:text-neutral-300">
          <HugeiconsIcon icon={Flag03Icon} size={16} color="currentColor" strokeWidth={1.5} />
          <span>Report this host</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 min-[744px]:pb-0">
      {/*  HEADER */}
      <HeaderGallery
        gridType="grid2"
        images={galleryImgs}
        initiallySaved={like}
        listingIdentifier={handle}
        propertyDetails={{
          title,
          category: listingCategory,
          price,
          address,
          bedrooms,
          bathrooms,
          area: acreage,
          phone: host.phone,
        }}
      />
      <MobilePropertyOverview
        title={title}
        category={listingCategory}
        price={price}
        address={address}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        area={acreage}
        maxGuests={maxGuests}
        phone={host.phone}
      />

      {/* MAIN */}
      <main className="relative z-[1] mt-0 flex flex-col gap-8 min-[744px]:mt-10 lg:flex-row xl:gap-10">
        {/* CONTENT */}
        <div className="flex w-full flex-col gap-y-8 lg:w-3/5 xl:w-[64%] xl:gap-y-10">
          <div className="hidden min-[744px]:block">{renderSectionHeader()}</div>
          {renderSectionInfo()}
          {renderSectionAmenities()}
        </div>

        {/* SIDEBAR */}
        <div id="contact-owner-desktop" className="hidden grow min-[744px]:block">
          <div className="sticky top-5">{renderSidebarPriceAndForm()}</div>
        </div>
      </main>

      <Divider className="my-16" />

      <div className="flex flex-col gap-y-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div id="contact-owner" className="w-full scroll-mt-24 lg:w-4/9 xl:w-1/3">
            <SectionHost {...host} />
          </div>
          <div className="w-full lg:w-2/3">
            <SectionListingReviews reviewCount={reviewCount} reviewStart={reviewStart} reviews={reviews} />
          </div>
        </div>

        <div id="property-location">
          <SectionMap />
        </div>
      </div>
    </div>
  )
}

export default Page
