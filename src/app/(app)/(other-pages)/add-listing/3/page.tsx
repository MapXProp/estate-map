'use client'

import { getOfferType, type OfferTypeCode } from '@/data/propertyTaxonomy'
import {
  getListingDraft,
  saveListingDraftToCloud,
  saveListingStep,
  uploadListingPhotos,
  type ListingDraft,
  type ListingDraftValue,
} from '@/lib/listingDraft'
import { getApiBaseUrl } from '@/lib/auth'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import { BanknotesIcon, InformationCircleIcon, PhoneIcon, PhotoIcon } from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import FormItem from '../FormItem'

const Page = () => {
  const router = useRouter()
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [offers, setOffers] = useState<OfferTypeCode[]>(['rent'])
  const [salePrice, setSalePrice] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [keyMoneyAmount, setKeyMoneyAmount] = useState('')
  const [serviceFeeMonthly, setServiceFeeMonthly] = useState('')
  const [minimumLeaseMonths, setMinimumLeaseMonths] = useState('')
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    router.prefetch('/add-listing/4')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedOffers = readValues(savedDraft['offerTypes[]']).filter(isOfferTypeCode)
      setDraft(savedDraft)
      setOffers(savedOffers.length ? savedOffers : offersFromLegacy(readText(savedDraft.listing_type)))
      setSalePrice(readText(savedDraft.salePrice))
      setRentPriceMonthly(readText(savedDraft.rentPriceMonthly))
      setKeyMoneyAmount(readText(savedDraft.keyMoneyAmount))
      setServiceFeeMonthly(readText(savedDraft.serviceFeeMonthly))
      setMinimumLeaseMonths(readText(savedDraft.minimumLeaseMonths))
      setPriceOnRequest(readText(savedDraft.priceOnRequest) === 'yes')
      setUploadedPhotoUrls(readValues(savedDraft['listingPhotoUrls[]']))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const previewUrls = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  const hasSale = offers.includes('sale')
  const hasRent = offers.includes('rent') || offers.includes('sublease')
  const hasTransfer = offers.includes('business_transfer')

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, Math.max(0, 12 - uploadedPhotoUrls.length))
    setPhotos(selected)
    setUploadError('')
  }

  const handleSubmitForm = async (formData: FormData) => {
    setUploadError('')
    setIsUploading(true)
    let nextPhotoUrls = uploadedPhotoUrls

    try {
      if (photos.length) {
        const uploaded = await uploadListingPhotos(photos)
        nextPhotoUrls = [...new Set([...uploadedPhotoUrls, ...uploaded])].slice(0, 12)
        setUploadedPhotoUrls(nextPhotoUrls)
        setPhotos([])
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง')
      setIsUploading(false)
      return
    }

    if (!hasSale) formData.set('salePrice', '')
    if (!hasRent && !hasTransfer) formData.set('rentPriceMonthly', '')
    if (!hasTransfer) formData.set('keyMoneyAmount', '')
    formData.set('priceOnRequest', priceOnRequest ? 'yes' : '')
    formData.set('selectedPhotoCount', String(nextPhotoUrls.length))
    nextPhotoUrls.forEach((url) => formData.append('listingPhotoUrls[]', url))
    const savedDraft = saveListingStep(3, formData)
    await saveListingDraftToCloud(savedDraft).catch(() => undefined)
    setIsUploading(false)
    router.push('/add-listing/4')
  }

  if (!draft) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
  }

  return (
    <>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <BanknotesIcon className="h-4 w-4" />
          ราคาและการติดต่อ
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ทำให้ประกาศพร้อมรับลูกค้า
        </h1>
        <p className="font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          ใส่ราคาให้ชัดและเลือกช่องทางที่สะดวกสำหรับให้ผู้สนใจติดต่อกลับ
        </p>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-6">
        <SectionCard
          icon={<PhotoIcon className="size-5" />}
          title="รูปภาพของทรัพย์"
          description="เลือกภาพหน้าปกก่อน ตามด้วยภายใน ห้องน้ำ วิว และบริเวณโดยรอบ สูงสุด 12 รูป"
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-orange-700">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              <PhotoIcon className="size-6" />
            </span>
            <span className="mt-4 font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              เลือกรูปจากอุปกรณ์
            </span>
            <span className="mt-1 font-sarabun text-xs text-neutral-500">
              JPG, PNG หรือ WebP · รูปแรกจะเป็นภาพหน้าปก
            </span>
            <input
              name="listingPhotos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotos}
              className="sr-only"
            />
          </label>

          {uploadedPhotoUrls.length || previewUrls.length ? (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {[...uploadedPhotoUrls.map(resolveListingMediaUrl), ...previewUrls].map((url, index) => (
                <div
                  key={url}
                  className="aspect-square overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-neutral-200 dark:ring-neutral-700"
                  style={{ backgroundImage: `url(${url})` }}
                  aria-label={`รูปที่ ${index + 1}`}
                >
                  {index === 0 ? (
                    <span className="m-2 inline-block rounded-full bg-neutral-950/75 px-2 py-1 font-sarabun text-[10px] text-white">
                      ภาพหน้าปก
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            <InformationCircleIcon className="mt-0.5 size-5 shrink-0" />
            <p className="font-sarabun text-xs leading-5">
              เมื่อกดไปขั้นถัดไป ระบบจะอัปโหลดและบันทึกรูปไว้กับร่างประกาศโดยอัตโนมัติ
            </p>
          </div>
          {isUploading ? (
            <p className="mt-3 font-sarabun text-sm font-medium text-emerald-700">กำลังอัปโหลดรูป กรุณารอสักครู่...</p>
          ) : null}
          {uploadError ? (
            <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700">
              {uploadError}
            </p>
          ) : null}
        </SectionCard>

        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
            รูปแบบประกาศที่เลือกไว้
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((offer) => (
              <span
                key={offer}
                className="rounded-full bg-white px-3 py-1.5 font-sarabun text-sm text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700"
              >
                {getOfferType(offer)?.nameTh || offer}
              </span>
            ))}
          </div>
        </section>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900">
          <input
            type="checkbox"
            checked={priceOnRequest}
            onChange={(event) => setPriceOnRequest(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span>
            <span className="block font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
              ยังไม่ระบุราคา ให้ผู้สนใจสอบถาม
            </span>
            <span className="mt-1 block font-sarabun text-xs leading-5 text-neutral-500">
              เหมาะกับพื้นที่ออกบูธ ล็อกตลาด โครงการใหม่ หรือประกาศที่กำลังรอยืนยันราคา
            </span>
          </span>
        </label>

        <input type="hidden" name="currency" value="THB" />

        {hasSale ? (
          <PriceSection title="ราคาขาย" description="ราคารวมของทรัพย์ ไม่ใช่ราคาต่อตารางเมตร">
            <PriceInput name="salePrice" value={salePrice} onChange={setSalePrice} suffix="บาท" />
          </PriceSection>
        ) : null}

        {hasRent ? (
          <PriceSection
            title={offers.includes('sublease') ? 'ค่าเช่าช่วงต่อเดือน' : 'ค่าเช่าต่อเดือน'}
            description="ระบุค่าเช่าหลักก่อนรวมค่าสาธารณูปโภคและค่าบริการอื่น"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label="ค่าเช่ารายเดือน">
                <PriceInput
                  name="rentPriceMonthly"
                  value={rentPriceMonthly}
                  onChange={setRentPriceMonthly}
                  suffix="บาท/เดือน"
                />
              </FormItem>
              <FormItem label="ระยะสัญญาขั้นต่ำ">
                <Select
                  name="minimumLeaseMonths"
                  value={minimumLeaseMonths}
                  onChange={(event) => setMinimumLeaseMonths(event.target.value)}
                  className="[&_select]:h-12 [&_select]:rounded-2xl"
                >
                  <option value="">ไม่ระบุ</option>
                  <option value="1">1 เดือน</option>
                  <option value="3">3 เดือน</option>
                  <option value="6">6 เดือน</option>
                  <option value="12">1 ปี</option>
                  <option value="24">2 ปี</option>
                  <option value="36">3 ปี</option>
                </Select>
              </FormItem>
              <FormItem label="ค่าบริการส่วนกลางต่อเดือน" desccription="เว้นว่างได้ หากรวมอยู่ในค่าเช่าแล้ว">
                <PriceInput
                  name="serviceFeeMonthly"
                  value={serviceFeeMonthly}
                  onChange={setServiceFeeMonthly}
                  suffix="บาท/เดือน"
                />
              </FormItem>
            </div>
          </PriceSection>
        ) : null}

        {hasTransfer ? (
          <PriceSection
            title="ราคาเซ้งหรือค่าโอนสิทธิ"
            description="ค่าโอนสิทธิ กิจการ หรืออุปกรณ์ ไม่ใช่ราคาซื้อกรรมสิทธิ์ในอสังหาริมทรัพย์"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label="ราคาเซ้ง">
                <PriceInput
                  name="keyMoneyAmount"
                  value={keyMoneyAmount}
                  onChange={setKeyMoneyAmount}
                  suffix="บาท"
                />
              </FormItem>
              {!hasRent ? (
                <FormItem label="ค่าเช่าที่ต้องจ่ายต่อหลังรับโอน">
                  <PriceInput
                    name="rentPriceMonthly"
                    value={rentPriceMonthly}
                    onChange={setRentPriceMonthly}
                    suffix="บาท/เดือน"
                  />
                </FormItem>
              ) : null}
            </div>
          </PriceSection>
        ) : null}

        <input type="hidden" name="priceNegotiable" value="" />
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <input
            name="priceNegotiable"
            value="yes"
            type="checkbox"
            defaultChecked={readText(draft.priceNegotiable) === 'yes'}
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
          />
          <span>
            <span className="block font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
              ราคาต่อรองได้
            </span>
            <span className="mt-1 block font-sarabun text-xs leading-5 text-neutral-500">
              แสดงให้ผู้ค้นหาทราบว่าเจ้าของพร้อมพูดคุยเรื่องราคา
            </span>
          </span>
        </label>

        <SectionCard
          icon={<PhoneIcon className="size-5" />}
          title="ช่องทางติดต่อ"
          description="ข้อมูลนี้จะแสดงกับผู้สนใจประกาศ กรุณาใช้ช่องทางที่ติดต่อได้จริง"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormItem label="ชื่อผู้ติดต่อ">
              <Input
                name="contactName"
                defaultValue={readText(draft.contactName)}
                placeholder="ชื่อเจ้าของหรือผู้ดูแล"
                required
              />
            </FormItem>
            <FormItem label="เบอร์โทรศัพท์">
              <Input
                name="contactPhone"
                defaultValue={readText(draft.contactPhone)}
                inputMode="tel"
                placeholder="08x-xxx-xxxx"
                required
              />
            </FormItem>
            <FormItem label="LINE ID" desccription="เว้นว่างได้">
              <Input name="lineId" defaultValue={readText(draft.lineId)} placeholder="Line ID" />
            </FormItem>
            <FormItem label="อีเมล" desccription="เว้นว่างได้">
              <Input
                name="contactEmail"
                defaultValue={readText(draft.contactEmail)}
                type="email"
                placeholder="name@example.com"
              />
            </FormItem>
          </div>
        </SectionCard>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
          <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-sarabun leading-6">กรอกราคาเป็นตัวเลข เช่น 35000 หรือ 1,250,000 ระบบจะจัดรูปแบบภายหลัง</p>
        </div>
      </Form>
    </>
  )
}

const SectionCard = ({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
        {icon}
      </span>
      <div>
        <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
        <p className="mt-1 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </div>
    <div className="mt-6">{children}</div>
  </section>
)

const PriceSection = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
    <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
    <p className="mt-1 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
    <div className="mt-5">{children}</div>
  </section>
)

const PriceInput = ({
  name,
  value,
  suffix,
  required,
  onChange,
}: {
  name: string
  value: string
  suffix: string
  required?: boolean
  onChange: (value: string) => void
}) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-neutral-500">฿</div>
    <Input
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputMode="decimal"
      pattern="[0-9,]*(\.[0-9]{1,2})?"
      placeholder="0"
      required={required}
      className="h-12 ps-9! pe-28!"
    />
    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-xs text-neutral-500">
      {suffix}
    </div>
  </div>
)

const readText = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraftValue | undefined) => (value ? (Array.isArray(value) ? value : [value]) : [])
const resolveListingMediaUrl = (value: string) =>
  value.startsWith('/') ? `${getApiBaseUrl()}${value}` : value
const isOfferTypeCode = (value: string): value is OfferTypeCode =>
  ['sale', 'rent', 'sublease', 'business_transfer'].includes(value)
const offersFromLegacy = (value: string): OfferTypeCode[] => {
  if (value === 'sale_and_rent') return ['sale', 'rent']
  return isOfferTypeCode(value) ? [value] : ['rent']
}

export default Page
