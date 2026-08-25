'use client'

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
  const [summary, setSummary] = useState<ReturnType<typeof getListingDraftSummary> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  useEffect(() => {
    setSummary(getListingDraftSummary())
  }, [])

  const handleSubmitForm = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      const data = await publishListingDraft()
      await clearCloudListingDraft().catch(() => undefined)
      clearListingDraft()
      setSuccessId(data.public_listing_id || data.slug || 'created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ยังไม่สามารถส่งประกาศได้ กรุณาลองอีกครั้ง')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-9 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <CheckCircleIcon className="mx-auto h-14 w-14 text-emerald-600" />
        <h2 className="mt-4 font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ส่งประกาศเรียบร้อยแล้ว
        </h2>
        <p className="mx-auto mt-3 max-w-xl font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          ระบบบันทึกประกาศและส่งเข้าคิวตรวจสอบแล้ว · รหัสประกาศ {successId}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonSecondary href="/account">ดูบัญชีของฉัน</ButtonSecondary>
          <ButtonPrimary type="button" onClick={() => router.push('/add-listing/1')}>
            ลงประกาศใหม่
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
          พร้อมส่งประกาศ
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ตรวจอีกครั้งก่อนเผยแพร่
        </h1>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-5">
        <ReviewCard icon={<HomeModernIcon className="size-5" />} title="ข้อมูลประกาศ" editHref="/add-listing/1">
          <div className="sm:col-span-2">
            <p className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {summary?.payload.title || 'ยังไม่ได้ระบุหัวข้อประกาศ'}
            </p>
            <p className="mt-2 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {[summary?.propertyGroup, summary?.propertyType, summary?.listingScope, summary?.listingType]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <ReviewItem label="เหมาะสำหรับ" value={summary?.usageType} />
          <ReviewItem label="ชื่อโครงการ / สถานที่" value={summary?.payload.custom_project_name} />
        </ReviewCard>

        <ReviewCard icon={<MapPinIcon className="size-5" />} title="ทำเลและรายละเอียด" editHref="/add-listing/2">
          <ReviewItem label="ตำแหน่ง" value={summary?.location} className="sm:col-span-2" />
          <ReviewItem
            label="พื้นที่"
            value={
              summary?.payload.land_area_sqm
                ? `${summary.payload.land_area_sqm} ตร.ม. (ที่ดิน)`
                : summary?.payload.usable_area_sqm
                  ? `${summary.payload.usable_area_sqm} ตร.ม.`
                  : ''
            }
          />
          <ReviewItem label="ห้องนอน" value={summary?.payload.bedroom_count} />
          <ReviewItem label="ห้องน้ำ" value={summary?.payload.bathroom_count} />
          <ReviewItem label="ที่จอดรถ" value={summary?.payload.parking_count} />
          <ReviewItem
            label="รูปภาพ"
            value={
              summary?.payload.media_urls?.length
                ? `${summary.payload.media_urls.length} รูป`
                : 'ยังไม่ได้เพิ่ม (เพิ่มภายหลังได้)'
            }
          />
        </ReviewCard>

        <ReviewCard icon={<PhoneIcon className="size-5" />} title="ราคาและการติดต่อ" editHref="/add-listing/3">
          <ReviewItem label="ราคา" value={summary?.price} className="sm:col-span-2" />
          <ReviewItem label="ชื่อผู้ติดต่อ" value={summary?.payload.contact_name} />
          <ReviewItem label="โทรศัพท์" value={summary?.payload.contact_phone} />
          <ReviewItem label="LINE ID" value={summary?.payload.line_id} />
          <ReviewItem label="อีเมล" value={summary?.payload.contact_email} />
        </ReviewCard>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <ButtonSecondary type="button" href="/add-listing/3">
            <ArrowLeftIcon className="h-5 w-5" />
            ย้อนกลับ
          </ButtonSecondary>
          <ButtonPrimary type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'กำลังส่งประกาศ...' : 'ส่งประกาศเพื่อตรวจสอบ'}
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
  children,
}: {
  icon: React.ReactNode
  title: string
  editHref: string
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
        แก้ไข
      </Link>
    </div>
    <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">{children}</div>
  </section>
)

const ReviewItem = ({ label, value, className }: { label: string; value?: string; className?: string }) => (
  <div className={className}>
    <p className="font-sarabun text-xs font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
    <p className="mt-1 font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
      {value || 'ยังไม่ระบุ'}
    </p>
  </div>
)

export default Page
