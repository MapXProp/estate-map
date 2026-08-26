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
import { getListingReviews } from '@/data/data'
import { getRealEstateListingByHandle } from '@/data/listings'
import { fetchPropertyListingDetail } from '@/lib/propertySearch'
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
import { Fragment } from 'react'
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

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const databaseListing = await fetchPropertyListingDetail(handle)

  if (databaseListing) {
    return {
      title: databaseListing.title,
      description: databaseListing.description,
    }
  }
  const listing = await getRealEstateListingByHandle(handle)

  if (!listing) {
    return {
      title: 'Listing not found',
      description: 'The listing you are looking for does not exist.',
    }
  }

  return {
    title: listing?.title,
    description: listing?.description,
  }
}

const Page = async ({ params }: { params: Promise<{ handle: string }> }) => {
  const { handle } = await params

  const databaseListing = await fetchPropertyListingDetail(handle)
  if (databaseListing?.event) {
    return <EventBoothListingView listing={databaseListing} />
  }
  if (databaseListing?.property_type_code === 'land') {
    return <LandListingView listing={databaseListing} />
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
