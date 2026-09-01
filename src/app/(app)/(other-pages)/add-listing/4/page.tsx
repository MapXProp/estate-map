'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getApiBaseUrl } from '@/lib/auth'
import {
  clearCloudListingDraft,
  clearListingDraft,
  getListingDraftSummary,
  publishListingDraft,
  type ListingMediaInput,
} from '@/lib/listingDraft'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonSecondary from '@/shared/ButtonSecondary'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  HomeModernIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  PhotoIcon,
  SparklesIcon,
  VideoCameraIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const Page = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [summary, setSummary] = useState<ReturnType<typeof getListingDraftSummary> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')
  const mediaItems = summary?.payload.media_items || []
  const photoUrls = uniqueMediaUrls(
    mediaItems.filter((item) => item.media_type === 'image'),
    summary?.payload.media_urls
  )
  const videoUrls = uniqueMediaUrls(mediaItems.filter((item) => item.media_type === 'video'))
  const panoramaUrls = uniqueMediaUrls(mediaItems.filter((item) => item.media_type === '360'))

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSummary(getListingDraftSummary(locale)))
    return () => cancelAnimationFrame(frame)
  }, [locale])

  const handleSubmitForm = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      const data = await publishListingDraft()
      await clearCloudListingDraft().catch(() => undefined)
      clearListingDraft()
      setSuccessId(data.public_listing_id || data.slug || 'created')
    } catch (err) {
      setError(
        isThai
          ? 'ยังไม่สามารถส่งประกาศได้ กรุณาลองอีกครั้ง'
          : err instanceof Error
            ? err.message
            : 'Unable to submit your listing. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-9 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <CheckCircleIcon className="mx-auto h-14 w-14 text-emerald-600" />
        <h2 className="mt-4 font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {isThai ? 'ส่งประกาศเรียบร้อยแล้ว' : 'Listing submitted'}
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {isThai
            ? `ระบบบันทึกประกาศและส่งเข้าคิวตรวจสอบแล้ว · รหัสประกาศ ${successId}`
            : `Your listing has been saved and sent for review · Listing ID ${successId}`}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonSecondary href="/account-listings">{isThai ? 'ดูประกาศของฉัน' : 'View my listings'}</ButtonSecondary>
          <ButtonPrimary type="button" onClick={() => router.push('/add-listing/1?new=1')}>
            {isThai ? 'ลงประกาศใหม่' : 'Create another listing'}
          </ButtonPrimary>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">
          <SparklesIcon className="h-4 w-4" />
          {isThai ? 'พร้อมส่งประกาศ' : 'Ready to submit'}
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {isThai ? 'ตรวจอีกครั้งก่อนส่งประกาศ' : 'Review before submitting'}
        </h1>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-5">
        <ReviewCard
          icon={<HomeModernIcon className="size-5" />}
          title={isThai ? 'ข้อมูลประกาศ' : 'Listing information'}
          editHref="/add-listing/1"
          editLabel={isThai ? 'แก้ไข' : 'Edit'}
        >
          <div className="sm:col-span-2">
            <p className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {summary?.payload.title || (isThai ? 'ยังไม่ได้ระบุหัวข้อประกาศ' : 'Listing title not specified')}
            </p>
            <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {[
                summary?.discoveryChannel,
                summary?.propertyType,
                summary?.businessSpaceType,
                summary?.listingScope,
                summary?.listingType,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <ReviewItem
            label={isThai ? 'เหมาะสำหรับ' : 'Suitable for'}
            value={summary?.usageType}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ชื่อโครงการ / สถานที่' : 'Project / place name'}
            value={summary?.payload.custom_project_name}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
        </ReviewCard>

        <ReviewCard
          icon={<MapPinIcon className="size-5" />}
          title={isThai ? 'ทำเลและรายละเอียด' : 'Location & details'}
          editHref="/add-listing/2"
          editLabel={isThai ? 'แก้ไข' : 'Edit'}
        >
          <ReviewItem
            label={isThai ? 'ตำแหน่ง' : 'Location'}
            value={summary?.location}
            className="sm:col-span-2"
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ขนาดที่ดิน' : 'Land area'}
            value={
              summary?.payload.land_area_sqm ? `${summary.payload.land_area_sqm} ${isThai ? 'ตร.ม.' : 'sq.m.'}` : ''
            }
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'พื้นที่ใช้สอย' : 'Usable area'}
            value={
              summary?.payload.usable_area_sqm ? `${summary.payload.usable_area_sqm} ${isThai ? 'ตร.ม.' : 'sq.m.'}` : ''
            }
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ห้องนอน' : 'Bedrooms'}
            value={summary?.payload.bedroom_count}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ห้องน้ำ' : 'Bathrooms'}
            value={summary?.payload.bathroom_count}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ที่จอดรถ' : 'Parking spaces'}
            value={summary?.payload.parking_count}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'สภาพทรัพย์' : 'Condition'}
            value={formatDetailCode(summary?.payload.property_condition, isThai)}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'สถานะปัจจุบัน' : 'Occupancy'}
            value={formatDetailCode(summary?.payload.occupancy_status, isThai)}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'เอกสารสิทธิ์ / รูปแบบสิทธิ์' : 'Title / tenure'}
            value={formatDetailCode(
              summary?.payload.category_details?.title_deed_type || summary?.payload.category_details?.tenure_type,
              isThai
            )}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
        </ReviewCard>

        <ReviewCard
          icon={<PhotoIcon className="size-5" />}
          title={isThai ? 'รูปภาพ วิดีโอ และภาพ 360°' : 'Photos, videos & 360° media'}
          editHref="/add-listing/3"
          editLabel={isThai ? 'จัดการสื่อ' : 'Manage media'}
        >
          <ReviewMediaPreview isThai={isThai} photoUrls={photoUrls} videoUrls={videoUrls} panoramaUrls={panoramaUrls} />
        </ReviewCard>

        <ReviewCard
          icon={<PhoneIcon className="size-5" />}
          title={isThai ? 'ราคาและการติดต่อ' : 'Price & contact'}
          editHref="/add-listing/3"
          editLabel={isThai ? 'แก้ไข' : 'Edit'}
        >
          <ReviewItem
            label={isThai ? 'ราคา' : 'Price'}
            value={summary?.price}
            className="sm:col-span-2"
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ชื่อผู้ติดต่อ' : 'Contact name'}
            value={summary?.payload.contact_name}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'บทบาท' : 'Role'}
            value={contactRoleLabel(summary?.payload.contact_role_code, isThai)}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'ได้รับสิทธิลงประกาศจาก' : 'Authority source'}
            value={contactAuthorityLabel(summary?.payload.contact_authority_code, isThai)}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'บริษัท / สังกัด' : 'Company / organization'}
            value={summary?.payload.contact_organization_name}
            fallback={isThai ? 'ไม่มีสังกัดที่ระบุ' : 'No organization specified'}
          />
          <ReviewItem
            label={isThai ? 'สถานะผู้ติดต่อ' : 'Contact status'}
            value={isThai ? 'ข้อมูลที่ผู้ลงประกาศระบุเอง · ยังไม่ Verified' : 'Self-declared · Not verified'}
            fallback={isThai ? 'ยังไม่ตรวจสอบ' : 'Not verified'}
          />
          <ReviewItem
            label={isThai ? 'โทรศัพท์' : 'Phone'}
            value={summary?.payload.contact_phone}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'เบอร์สำรอง' : 'Backup phone'}
            value={summary?.payload.contact_phone_secondary}
            fallback={isThai ? 'ไม่ได้เพิ่ม' : 'Not added'}
          />
          <ReviewItem
            label="LINE ID"
            value={summary?.payload.line_id}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label="Instagram"
            value={summary?.payload.instagram_handle}
            fallback={isThai ? 'ไม่ได้เพิ่ม' : 'Not added'}
          />
          <ReviewItem
            label={isThai ? 'อีเมล' : 'Email'}
            value={summary?.payload.contact_email}
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
        </ReviewCard>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <ButtonSecondary type="button" href="/add-listing/3">
            <ArrowLeftIcon className="h-5 w-5" />
            {isThai ? 'ย้อนกลับ' : 'Back'}
          </ButtonSecondary>
          <ButtonPrimary type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isThai
                ? 'กำลังส่งประกาศ...'
                : 'Submitting listing...'
              : isThai
                ? 'ส่งประกาศเพื่อตรวจสอบ'
                : 'Submit for review'}
          </ButtonPrimary>
        </div>
      </Form>
    </>
  )
}

const ReviewMediaPreview = ({
  isThai,
  photoUrls,
  videoUrls,
  panoramaUrls,
}: {
  isThai: boolean
  photoUrls: string[]
  videoUrls: string[]
  panoramaUrls: string[]
}) => {
  const totalMedia = photoUrls.length + videoUrls.length + panoramaUrls.length

  if (!totalMedia) {
    return (
      <div className="sm:col-span-2">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-center dark:border-neutral-700 dark:bg-neutral-950/60">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-neutral-500 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <PhotoIcon className="size-6" />
          </span>
          <p className="mt-3 font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {isThai ? 'ยังไม่ได้เพิ่มรูปภาพหรือวิดีโอ' : 'No photos or videos added'}
          </p>
          <p className="mt-1 max-w-md font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'สื่อไม่บังคับ คุณสามารถกด “จัดการสื่อ” เพื่อย้อนกลับไปเพิ่มก่อนส่งประกาศ'
              : 'Media is optional. Use “Manage media” to add it before submitting your listing.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-3 font-sarabun dark:bg-emerald-950/25">
        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          <CheckCircleIcon className="size-5" />
          {isThai ? `อัปโหลดครบ ${totalMedia} ไฟล์` : `${totalMedia} files uploaded`}
        </span>
        <span className="text-xs text-emerald-800/75 dark:text-emerald-200/75">
          {isThai ? 'ตรวจสื่อด้านล่างก่อนส่งประกาศ' : 'Check the media below before submitting'}
        </span>
      </div>

      {photoUrls.length ? (
        <section>
          <ReviewMediaHeading
            icon={<PhotoIcon className="size-4" />}
            title={isThai ? 'รูปภาพ' : 'Photos'}
            count={photoUrls.length}
          />
          <div
            className="relative mt-3 aspect-[16/10] overflow-hidden rounded-3xl bg-neutral-100 bg-cover bg-center ring-1 ring-neutral-200 sm:aspect-[16/8] dark:bg-neutral-800 dark:ring-neutral-700"
            style={{ backgroundImage: `url(${resolveListingMediaUrl(photoUrls[0])})` }}
            role="img"
            aria-label={isThai ? 'ภาพหน้าปกประกาศ' : 'Listing cover photo'}
          >
            <span className="absolute top-3 left-3 rounded-full bg-neutral-950/75 px-3 py-1.5 font-sarabun text-xs font-semibold text-white backdrop-blur-sm">
              {isThai ? 'ภาพหน้าปก' : 'Cover photo'}
            </span>
          </div>
          {photoUrls.length > 1 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 min-[560px]:grid-cols-3 lg:grid-cols-4">
              {photoUrls.slice(1).map((url, index) => (
                <div
                  key={url}
                  className="aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 bg-cover bg-center ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
                  style={{ backgroundImage: `url(${resolveListingMediaUrl(url)})` }}
                  role="img"
                  aria-label={isThai ? `รูปภาพที่ ${index + 2}` : `Photo ${index + 2}`}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {videoUrls.length ? (
        <section>
          <ReviewMediaHeading
            icon={<VideoCameraIcon className="size-4" />}
            title={isThai ? 'วิดีโอ' : 'Videos'}
            count={videoUrls.length}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {videoUrls.map((url, index) => (
              <video
                key={url}
                src={resolveListingMediaUrl(url)}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-2xl bg-neutral-950 object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                aria-label={isThai ? `วิดีโอที่ ${index + 1}` : `Video ${index + 1}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {panoramaUrls.length ? (
        <section>
          <ReviewMediaHeading
            icon={<ViewfinderCircleIcon className="size-4" />}
            title={isThai ? 'ภาพ 360°' : '360° photos'}
            count={panoramaUrls.length}
          />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {panoramaUrls.map((url, index) => (
              <div
                key={url}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100 bg-cover bg-center ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
                style={{ backgroundImage: `url(${resolveListingMediaUrl(url)})` }}
                role="img"
                aria-label={isThai ? `ภาพ 360° ที่ ${index + 1}` : `360° photo ${index + 1}`}
              >
                <span className="absolute right-2 bottom-2 rounded-full bg-neutral-950/75 px-2.5 py-1 font-sarabun text-[11px] font-semibold text-white backdrop-blur-sm">
                  360°
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

const ReviewMediaHeading = ({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) => (
  <div className="flex items-center gap-2 font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
    <span className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40">
      {icon}
    </span>
    <span>{title}</span>
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      {count}
    </span>
  </div>
)

const ReviewCard = ({
  icon,
  title,
  editHref,
  editLabel,
  children,
}: {
  icon: React.ReactNode
  title: string
  editHref: string
  editLabel: string
  children: React.ReactNode
}) => (
  <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-7 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
          {icon}
        </span>
        <h2 className="font-sarabun font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      <Link
        href={editHref}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-sarabun text-xs font-medium text-orange-600 transition hover:bg-orange-50 dark:hover:bg-orange-950/30"
      >
        <PencilSquareIcon className="size-4" />
        {editLabel}
      </Link>
    </div>
    <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">{children}</div>
  </section>
)

const ReviewItem = ({
  label,
  value,
  className,
  fallback,
}: {
  label: string
  value?: string
  className?: string
  fallback: string
}) => (
  <div className={className}>
    <p className="font-sarabun text-xs font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
    <p className="mt-1 font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">{value || fallback}</p>
  </div>
)

const formatDetailCode = (value: string | boolean | string[] | undefined, isThai: boolean) => {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? (isThai ? 'ใช่' : 'Yes') : isThai ? 'ไม่ใช่' : 'No'
  if (!value) return ''

  const labels: Record<string, [string, string]> = {
    new: ['ใหม่ / สร้างเสร็จใหม่', 'Newly completed'],
    like_new: ['สภาพเหมือนใหม่', 'Like new'],
    good: ['สภาพดี พร้อมใช้งาน', 'Good, ready to use'],
    needs_renovation: ['ควรปรับปรุง', 'Needs renovation'],
    under_construction: ['อยู่ระหว่างก่อสร้าง', 'Under construction'],
    vacant: ['ว่าง พร้อมเข้าอยู่', 'Vacant'],
    owner_occupied: ['เจ้าของพักอยู่', 'Owner occupied'],
    tenant_occupied: ['มีผู้เช่าอยู่', 'Tenant occupied'],
    freehold: ['กรรมสิทธิ์ (Freehold)', 'Freehold'],
    leasehold: ['สิทธิการเช่า (Leasehold)', 'Leasehold'],
    right_of_possession: ['สิทธิครอบครอง', 'Right of possession'],
    chanote: ['โฉนดที่ดิน (น.ส.4)', 'Chanote (Nor Sor 4)'],
    nor_sor_3_gor: ['น.ส.3 ก.', 'Nor Sor 3 Gor'],
    nor_sor_3: ['น.ส.3', 'Nor Sor 3'],
    sor_kor_1: ['ส.ค.1', 'Sor Kor 1'],
  }
  return labels[value]?.[isThai ? 0 : 1] || value.replaceAll('_', ' ')
}

const uniqueMediaUrls = (media: ListingMediaInput[], fallback: string[] = []) =>
  [...new Set([...media.map((item) => item.url), ...fallback])].filter(Boolean)

const resolveListingMediaUrl = (value: string) => (value.startsWith('/') ? `${getApiBaseUrl()}${value}` : value)

const contactRoleLabel = (value: string | undefined, isThai: boolean) => {
  const labels: Record<string, [string, string]> = {
    owner: ['เจ้าของทรัพย์', 'Property owner'],
    owner_representative: ['ผู้รับมอบอำนาจจากเจ้าของ', 'Owner-authorized representative'],
    independent_broker: ['นายหน้าอิสระ', 'Independent broker'],
    agency_broker: ['นายหน้าสังกัดบริษัท', 'Agency broker'],
    developer_investor_representative: ['ตัวแทนโครงการ / นักลงทุน', 'Developer or investor representative'],
    property_manager: ['ผู้ดูแลทรัพย์ / ผู้จัดการอาคาร', 'Property or building manager'],
  }
  return value ? labels[value]?.[isThai ? 0 : 1] || value : ''
}

const contactAuthorityLabel = (value: string | undefined, isThai: boolean) => {
  const labels: Record<string, [string, string]> = {
    self: ['ทรัพย์ของฉันเอง', 'Own property'],
    property_owner: ['เจ้าของทรัพย์โดยตรง', 'Property owner directly'],
    brokerage_company: ['บริษัทนายหน้าหรือทีม', 'Brokerage company or team'],
    developer_project: ['โครงการ / ผู้พัฒนา', 'Project or developer'],
    investor_asset_holder: ['นักลงทุน / ผู้ถือทรัพย์', 'Investor or asset holder'],
    co_broker: ['นายหน้าร่วม (Co-broker)', 'Co-broker'],
    property_management_company: ['บริษัทบริหารทรัพย์', 'Property management company'],
  }
  return value ? labels[value]?.[isThai ? 0 : 1] || value : ''
}

export default Page
