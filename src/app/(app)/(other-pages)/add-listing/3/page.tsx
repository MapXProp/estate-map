'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getOfferType, type OfferTypeCode } from '@/data/propertyTaxonomy'
import { getApiBaseUrl } from '@/lib/auth'
import {
  getListingDraft,
  saveListingDraftToCloud,
  saveListingStep,
  uploadListingMedia,
  type ListingDraft,
  type ListingDraftValue,
} from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import {
  BanknotesIcon,
  ChevronDownIcon,
  PhoneIcon,
  PhotoIcon,
  VideoCameraIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import FormItem from '../FormItem'

const MAX_PHOTOS = 12
const MAX_VIDEOS = 4
const MAX_PANORAMAS = 4

const Page = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const currencyName = isThai ? 'บาท' : 'THB'
  const currencySymbol = '฿'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [offers, setOffers] = useState<OfferTypeCode[]>(['rent'])
  const [salePrice, setSalePrice] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [keyMoneyAmount, setKeyMoneyAmount] = useState('')
  const [eventBookingPrice, setEventBookingPrice] = useState('')
  const [serviceFeeMonthly, setServiceFeeMonthly] = useState('')
  const [minimumLeaseMonths, setMinimumLeaseMonths] = useState('')
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [panoramas, setPanoramas] = useState<File[]>([])
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([])
  const [uploadedPanoramaUrls, setUploadedPanoramaUrls] = useState<string[]>([])
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
      setEventBookingPrice(readText(savedDraft.eventBookingPrice))
      setServiceFeeMonthly(readText(savedDraft.serviceFeeMonthly))
      setMinimumLeaseMonths(readText(savedDraft.minimumLeaseMonths))
      setPriceOnRequest(readText(savedDraft.priceOnRequest) === 'yes')
      setUploadedPhotoUrls(readValues(savedDraft['listingPhotoUrls[]']))
      setUploadedVideoUrls(readValues(savedDraft['listingVideoUrls[]']))
      setUploadedPanoramaUrls(readValues(savedDraft['listingPanoramaUrls[]']))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const previewUrls = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  const videoPreviewUrls = useMemo(() => videos.map((video) => URL.createObjectURL(video)), [videos])
  const panoramaPreviewUrls = useMemo(
    () => panoramas.map((panorama) => URL.createObjectURL(panorama)),
    [panoramas]
  )

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  useEffect(() => {
    return () => videoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [videoPreviewUrls])

  useEffect(() => {
    return () => panoramaPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [panoramaPreviewUrls])

  const hasSale = offers.includes('sale')
  const hasRent = offers.includes('rent') || offers.includes('sublease')
  const hasTransfer = offers.includes('business_transfer')
  const hasEventBooking = offers.includes('event_booking')

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, Math.max(0, MAX_PHOTOS - uploadedPhotoUrls.length))
    setPhotos(selected)
    setUploadError('')
  }

  const handleVideos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
      .filter((file) => ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type))
      .slice(0, Math.max(0, MAX_VIDEOS - uploadedVideoUrls.length))
    setVideos(selected)
    setUploadError('')
  }

  const handlePanoramas = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, Math.max(0, MAX_PANORAMAS - uploadedPanoramaUrls.length))
    setPanoramas(selected)
    setUploadError('')
  }

  const handleSubmitForm = async (formData: FormData) => {
    setUploadError('')
    setIsUploading(true)
    let nextPhotoUrls = uploadedPhotoUrls
    let nextVideoUrls = uploadedVideoUrls
    let nextPanoramaUrls = uploadedPanoramaUrls

    try {
      if (photos.length) {
        const uploaded = await uploadListingMedia(photos, 'image')
        nextPhotoUrls = [...new Set([...uploadedPhotoUrls, ...uploaded])].slice(0, MAX_PHOTOS)
        setUploadedPhotoUrls(nextPhotoUrls)
        setPhotos([])
      }
      if (videos.length) {
        const uploaded = await uploadListingMedia(videos, 'video')
        nextVideoUrls = [...new Set([...uploadedVideoUrls, ...uploaded])].slice(0, MAX_VIDEOS)
        setUploadedVideoUrls(nextVideoUrls)
        setVideos([])
      }
      if (panoramas.length) {
        const uploaded = await uploadListingMedia(panoramas, '360')
        nextPanoramaUrls = [...new Set([...uploadedPanoramaUrls, ...uploaded])].slice(0, MAX_PANORAMAS)
        setUploadedPanoramaUrls(nextPanoramaUrls)
        setPanoramas([])
      }
    } catch (error) {
      setUploadError(
        isThai && error instanceof Error
          ? error.message
          : isThai
            ? 'อัปโหลดสื่อไม่สำเร็จ กรุณาลองอีกครั้ง'
            : 'Unable to upload media. Please try again.'
      )
      setIsUploading(false)
      return
    }

    if (!hasSale) formData.set('salePrice', '')
    if (!hasRent && !hasTransfer) formData.set('rentPriceMonthly', '')
    if (!hasTransfer) formData.set('keyMoneyAmount', '')
    if (!hasEventBooking) formData.set('eventBookingPrice', '')
    formData.set('priceOnRequest', priceOnRequest ? 'yes' : '')
    formData.set('selectedPhotoCount', String(nextPhotoUrls.length))
    formData.set('selectedVideoCount', String(nextVideoUrls.length))
    formData.set('selectedPanoramaCount', String(nextPanoramaUrls.length))
    nextPhotoUrls.forEach((url) => formData.append('listingPhotoUrls[]', url))
    nextVideoUrls.forEach((url) => formData.append('listingVideoUrls[]', url))
    nextPanoramaUrls.forEach((url) => formData.append('listingPanoramaUrls[]', url))
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
          {isThai ? 'ราคาและการติดต่อ' : 'Price & contact'}
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {isThai ? 'ทำให้ประกาศพร้อมรับลูกค้า' : 'Get your listing ready for enquiries'}
        </h1>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-6">
        <SectionCard icon={<PhotoIcon className="size-5" />} title={isThai ? 'รูปภาพของทรัพย์' : 'Property photos'}>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center transition hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-orange-700">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              <PhotoIcon className="size-6" />
            </span>
            <span className="mt-4 font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isThai ? 'เลือกรูปจากอุปกรณ์' : 'Choose photos from your device'}
            </span>
            <span className="mt-1 font-sarabun text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {isThai
                ? 'แนะนำ 6–8 รูป · เพิ่มได้สูงสุด 12 รูป · รูปแรกเป็นภาพหน้าปก'
                : '6–8 recommended · up to 12 photos · the first photo is the cover'}
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
                  aria-label={isThai ? `รูปที่ ${index + 1}` : `Photo ${index + 1}`}
                >
                  {index === 0 ? (
                    <span className="m-2 inline-block rounded-full bg-neutral-950/75 px-2 py-1 font-sarabun text-[10px] text-white">
                      {isThai ? 'ภาพหน้าปก' : 'Cover photo'}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {isUploading ? (
            <p className="mt-3 font-sarabun text-sm font-medium text-emerald-700">
              {isThai ? 'กำลังอัปโหลดสื่อ กรุณารอสักครู่...' : 'Uploading media. Please wait...'}
            </p>
          ) : null}
          {uploadError ? (
            <p
              role="alert"
              className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700"
            >
              {uploadError}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          icon={<VideoCameraIcon className="size-5" />}
          title={isThai ? 'วิดีโอของทรัพย์ (ไม่บังคับ)' : 'Property videos (optional)'}
        >
          <p className="mb-4 font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'เพิ่มคลิปพาชม ห้องจริง หรือบรรยากาศรอบทรัพย์ได้สูงสุด 4 ไฟล์'
              : 'Add walkthroughs, room tours or surroundings — up to 4 files.'}
          </p>
          <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 transition hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              <VideoCameraIcon className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'เลือกวิดีโอ' : 'Choose videos'}
              </span>
              <span className="mt-1 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                MP4, WebM, MOV · {isThai ? 'ไฟล์ละไม่เกิน 50 MB' : 'up to 50 MB each'} ·{' '}
                {uploadedVideoUrls.length + videos.length}/{MAX_VIDEOS}
              </span>
            </span>
            <input
              name="listingVideos"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mov"
              multiple
              onChange={handleVideos}
              className="sr-only"
            />
          </label>

          {uploadedVideoUrls.length || videoPreviewUrls.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[...uploadedVideoUrls.map(resolveListingMediaUrl), ...videoPreviewUrls].map((url, index) => (
                <video
                  key={url}
                  src={url}
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-2xl bg-neutral-950 object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                  aria-label={isThai ? `วิดีโอที่ ${index + 1}` : `Video ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </SectionCard>

        <details
          open={Boolean(uploadedPanoramaUrls.length || panoramas.length)}
          className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <summary className="flex cursor-pointer list-none items-center gap-3 p-5 sm:p-7 [&::-webkit-details-marker]:hidden">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
              <ViewfinderCircleIcon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {isThai ? 'ภาพ 360° (ส่วนเสริม)' : '360° photos (optional)'}
              </span>
              <span className="mt-0.5 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                {isThai ? 'มีภาพพาโนรามาค่อยเปิดเพิ่ม · สูงสุด 4 รูป' : 'Open only when you have panoramas · up to 4 photos'}
              </span>
            </span>
            <ChevronDownIcon className="size-5 text-neutral-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-neutral-100 px-5 pt-5 pb-6 sm:px-7 sm:pb-7 dark:border-neutral-800">
            <label className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 transition hover:border-orange-400 hover:bg-orange-50/50 dark:border-neutral-700 dark:bg-neutral-950">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
                <ViewfinderCircleIcon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {isThai ? 'เลือกภาพพาโนรามา 360°' : 'Choose 360° panoramas'}
                </span>
                <span className="mt-1 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                  JPG, PNG, WebP · {isThai ? 'ไฟล์ละไม่เกิน 15 MB' : 'up to 15 MB each'} ·{' '}
                  {uploadedPanoramaUrls.length + panoramas.length}/{MAX_PANORAMAS}
                </span>
              </span>
              <input
                name="listingPanoramas"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePanoramas}
                className="sr-only"
              />
            </label>

            {uploadedPanoramaUrls.length || panoramaPreviewUrls.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...uploadedPanoramaUrls.map(resolveListingMediaUrl), ...panoramaPreviewUrls].map((url, index) => (
                  <div
                    key={url}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-neutral-200 dark:ring-neutral-700"
                    style={{ backgroundImage: `url(${url})` }}
                    aria-label={isThai ? `ภาพ 360 ที่ ${index + 1}` : `360 photo ${index + 1}`}
                  >
                    <span className="absolute right-2 bottom-2 rounded-full bg-neutral-950/75 px-2 py-1 font-sarabun text-[10px] font-semibold text-white">
                      360°
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </details>

        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {isThai ? 'รูปแบบประกาศที่เลือกไว้' : 'Selected listing options'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {offers.map((offer) => (
              <span
                key={offer}
                className="rounded-full bg-white px-3 py-1.5 font-sarabun text-sm text-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700"
              >
                {isThai ? getOfferType(offer)?.nameTh || offer : getOfferType(offer)?.nameEn || offer}
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
          <span className="font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {isThai ? 'ยังไม่ระบุราคา ให้ผู้สนใจสอบถาม' : 'Price on request'}
          </span>
        </label>

        <input type="hidden" name="currency" value="THB" />

        {hasSale ? (
          <PriceSection title={isThai ? 'ราคาขายรวม' : 'Sale price'}>
            <PriceInput
              name="salePrice"
              value={salePrice}
              onChange={setSalePrice}
              suffix={currencyName}
              symbol={currencySymbol}
            />
          </PriceSection>
        ) : null}

        {hasRent ? (
          <PriceSection
            title={
              offers.includes('sublease')
                ? isThai
                  ? 'ค่าเช่าช่วงต่อเดือน'
                  : 'Monthly sublease'
                : isThai
                  ? 'ค่าเช่าต่อเดือน'
                  : 'Monthly rent'
            }
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label={isThai ? 'ค่าเช่ารายเดือน' : 'Monthly rent'}>
                <PriceInput
                  name="rentPriceMonthly"
                  value={rentPriceMonthly}
                  onChange={setRentPriceMonthly}
                  suffix={isThai ? 'บาท/เดือน' : `${currencyName}/month`}
                  symbol={currencySymbol}
                />
              </FormItem>
              <FormItem label={isThai ? 'ระยะสัญญาขั้นต่ำ' : 'Minimum lease'}>
                <Select
                  name="minimumLeaseMonths"
                  value={minimumLeaseMonths}
                  onChange={(event) => setMinimumLeaseMonths(event.target.value)}
                  className="[&_select]:h-12 [&_select]:rounded-2xl"
                >
                  <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                  <option value="1">{isThai ? '1 เดือน' : '1 month'}</option>
                  <option value="3">{isThai ? '3 เดือน' : '3 months'}</option>
                  <option value="6">{isThai ? '6 เดือน' : '6 months'}</option>
                  <option value="12">{isThai ? '1 ปี' : '1 year'}</option>
                  <option value="24">{isThai ? '2 ปี' : '2 years'}</option>
                  <option value="36">{isThai ? '3 ปี' : '3 years'}</option>
                </Select>
              </FormItem>
              <FormItem label={isThai ? 'ค่าส่วนกลางต่อเดือน (ไม่บังคับ)' : 'Monthly service fee (optional)'}>
                <PriceInput
                  name="serviceFeeMonthly"
                  value={serviceFeeMonthly}
                  onChange={setServiceFeeMonthly}
                  suffix={isThai ? 'บาท/เดือน' : `${currencyName}/month`}
                  symbol={currencySymbol}
                />
              </FormItem>
            </div>
          </PriceSection>
        ) : null}

        {hasTransfer ? (
          <PriceSection title={isThai ? 'ราคาเซ้งหรือค่าโอนสิทธิ' : 'Transfer or key money'}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label={isThai ? 'ราคาเซ้ง' : 'Transfer price'}>
                <PriceInput
                  name="keyMoneyAmount"
                  value={keyMoneyAmount}
                  onChange={setKeyMoneyAmount}
                  suffix={currencyName}
                  symbol={currencySymbol}
                />
              </FormItem>
              {!hasRent ? (
                <FormItem label={isThai ? 'ค่าเช่าที่ต้องจ่ายต่อหลังรับโอน' : 'Ongoing monthly rent'}>
                  <PriceInput
                    name="rentPriceMonthly"
                    value={rentPriceMonthly}
                    onChange={setRentPriceMonthly}
                    suffix={isThai ? 'บาท/เดือน' : `${currencyName}/month`}
                    symbol={currencySymbol}
                  />
                </FormItem>
              ) : null}
            </div>
          </PriceSection>
        ) : null}

        {hasEventBooking ? (
          <PriceSection title={isThai ? 'ราคาพื้นที่ต่อรอบงาน' : 'Price per event period'}>
            <PriceInput
              name="eventBookingPrice"
              value={eventBookingPrice}
              onChange={setEventBookingPrice}
              suffix={isThai ? 'บาท/รอบ' : `${currencyName}/period`}
              symbol={currencySymbol}
            />
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
          <span className="font-sarabun text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {isThai ? 'ราคาต่อรองได้' : 'Price is negotiable'}
          </span>
        </label>

        <SectionCard icon={<PhoneIcon className="size-5" />} title={isThai ? 'ช่องทางติดต่อ' : 'Contact details'}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormItem label={isThai ? 'ชื่อผู้ติดต่อ' : 'Contact name'}>
              <Input
                name="contactName"
                defaultValue={readText(draft.contactName)}
                placeholder={isThai ? 'ชื่อเจ้าของหรือผู้ดูแล' : 'Owner or property manager'}
                required
              />
            </FormItem>
            <FormItem label={isThai ? 'เบอร์โทรศัพท์' : 'Phone number'}>
              <Input
                name="contactPhone"
                defaultValue={readText(draft.contactPhone)}
                inputMode="tel"
                placeholder="08x-xxx-xxxx"
                required
              />
            </FormItem>
            <FormItem label={isThai ? 'เบอร์โทรสำรอง (ไม่บังคับ)' : 'Backup phone (optional)'}>
              <Input
                name="contactPhoneSecondary"
                defaultValue={readText(draft.contactPhoneSecondary)}
                inputMode="tel"
                placeholder="08x-xxx-xxxx"
              />
            </FormItem>
            <FormItem label={isThai ? 'LINE ID (ไม่บังคับ)' : 'LINE ID (optional)'}>
              <Input name="lineId" defaultValue={readText(draft.lineId)} placeholder="Line ID" />
            </FormItem>
            <FormItem label={isThai ? 'Instagram (ไม่บังคับ)' : 'Instagram (optional)'}>
              <Input
                name="instagramHandle"
                defaultValue={readText(draft.instagramHandle)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="@username"
              />
            </FormItem>
            <FormItem label={isThai ? 'อีเมล (ไม่บังคับ)' : 'Email (optional)'}>
              <Input
                name="contactEmail"
                defaultValue={readText(draft.contactEmail)}
                type="email"
                placeholder="name@example.com"
              />
            </FormItem>
          </div>
        </SectionCard>
      </Form>
    </>
  )
}

const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
        {icon}
      </span>
      <div>
        <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
      </div>
    </div>
    <div className="mt-6">{children}</div>
  </section>
)

const PriceSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
    <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const PriceInput = ({
  name,
  value,
  suffix,
  symbol,
  required,
  onChange,
}: {
  name: string
  value: string
  suffix: string
  symbol: string
  required?: boolean
  onChange: (value: string) => void
}) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-neutral-500">
      {symbol}
    </div>
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
const resolveListingMediaUrl = (value: string) => (value.startsWith('/') ? `${getApiBaseUrl()}${value}` : value)
const isOfferTypeCode = (value: string): value is OfferTypeCode =>
  ['sale', 'rent', 'sublease', 'business_transfer', 'event_booking'].includes(value)
const offersFromLegacy = (value: string): OfferTypeCode[] => {
  if (value === 'sale_and_rent') return ['sale', 'rent']
  return isOfferTypeCode(value) ? [value] : ['rent']
}

export default Page
