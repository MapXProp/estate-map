'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  clearCloudListingDraft,
  clearListingDraft,
  getListingDraftSummary,
  publishListingDraft,
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
  SparklesIcon,
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
        err instanceof Error
          ? err.message
          : isThai
            ? 'ยังไม่สามารถส่งประกาศได้ กรุณาลองอีกครั้ง'
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
          <ButtonPrimary type="button" onClick={() => router.push('/add-listing/1')}>
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
          {isThai ? 'ตรวจอีกครั้งก่อนเผยแพร่' : 'Review before publishing'}
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
            label={isThai ? 'พื้นที่' : 'Area'}
            value={
              summary?.payload.land_area_sqm
                ? `${summary.payload.land_area_sqm} ${isThai ? 'ตร.ม. (ที่ดิน)' : 'sq.m. (land)'}`
                : summary?.payload.usable_area_sqm
                  ? `${summary.payload.usable_area_sqm} ${isThai ? 'ตร.ม.' : 'sq.m.'}`
                  : ''
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
            label={isThai ? 'รูปภาพ' : 'Photos'}
            value={
              summary?.payload.media_urls?.length
                ? isThai
                  ? `${summary.payload.media_urls.length} รูป`
                  : `${summary.payload.media_urls.length} photos`
                : isThai
                  ? 'ยังไม่ได้เพิ่ม (เพิ่มภายหลังได้)'
                  : 'None added yet (you can add them later)'
            }
            fallback={isThai ? 'ยังไม่ระบุ' : 'Not specified'}
          />
          <ReviewItem
            label={isThai ? 'วิดีโอ' : 'Videos'}
            value={formatMediaCount(summary?.payload.media_items, 'video', isThai, 'วิดีโอ', 'videos')}
            fallback={isThai ? 'ไม่ได้เพิ่ม' : 'None added'}
          />
          <ReviewItem
            label={isThai ? 'ภาพ 360°' : '360° photos'}
            value={formatMediaCount(summary?.payload.media_items, '360', isThai, 'ภาพ', 'photos')}
            fallback={isThai ? 'ไม่ได้เพิ่ม' : 'None added'}
          />
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

const formatMediaCount = (
  media: Array<{ media_type: string }> | undefined,
  mediaType: string,
  isThai: boolean,
  thaiUnit: string,
  englishUnit: string
) => {
  const count = media?.filter((item) => item.media_type === mediaType).length || 0
  return count ? `${count} ${isThai ? thaiUnit : englishUnit}` : ''
}

export default Page
