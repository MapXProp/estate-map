'use client'

import {
  initialListingMediaProgress,
  useListingFlowProgress,
  type ListingMediaProgressState,
} from '@/components/add-listing/ListingFlowProgressContext'
import { usePreferences, type AppCurrency } from '@/components/preferences/PreferencesProvider'
import { getOfferType, type OfferTypeCode } from '@/data/propertyTaxonomy'
import { getApiBaseUrl } from '@/lib/auth'
import {
  getListingDraft,
  saveListingDraftToCloud,
  saveListingStep,
  uploadListingMedia,
  type ListingDraft,
  type ListingDraftValue,
  type ListingMediaType,
} from '@/lib/listingDraft'
import { validateListingForm } from '@/lib/listingFormValidation'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import {
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloudArrowUpIcon,
  DocumentCheckIcon,
  EyeIcon,
  IdentificationIcon,
  PhoneIcon,
  PhotoIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  VideoCameraIcon,
  ViewfinderCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import FormItem from '../FormItem'

const MAX_PHOTOS = 10
const MAX_VIDEOS = 4
const MAX_PANORAMAS = 4

const fileIdentity = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

const appendUniqueFiles = (current: File[], incoming: File[], limit: number) => {
  const identities = new Set(current.map(fileIdentity))
  const uniqueIncoming = incoming.filter((file) => {
    const identity = fileIdentity(file)
    if (identities.has(identity)) return false
    identities.add(identity)
    return true
  })

  return [...current, ...uniqueIncoming].slice(0, limit)
}

const replaceFormDataValues = (formData: FormData, key: string, values: string[]) => {
  formData.delete(key)
  if (!values.length) {
    formData.set(key, '')
    return
  }
  values.forEach((value) => formData.append(key, value))
}

type ContactRoleCode =
  | ''
  | 'owner'
  | 'owner_representative'
  | 'independent_broker'
  | 'agency_broker'
  | 'developer_investor_representative'
  | 'property_manager'

type ContactAuthorityCode =
  | ''
  | 'self'
  | 'property_owner'
  | 'brokerage_company'
  | 'developer_project'
  | 'investor_asset_holder'
  | 'co_broker'
  | 'property_management_company'

const Page = () => {
  const router = useRouter()
  const { locale, currency: preferredCurrency } = usePreferences()
  const { mediaProgress, setMediaProgress } = useListingFlowProgress()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [offers, setOffers] = useState<OfferTypeCode[]>(['rent'])
  const [salePrice, setSalePrice] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [rentPriceDaily, setRentPriceDaily] = useState('')
  const [keyMoneyAmount, setKeyMoneyAmount] = useState('')
  const [eventBookingPrice, setEventBookingPrice] = useState('')
  const [serviceFeeMonthly, setServiceFeeMonthly] = useState('')
  const [minimumLeaseMonths, setMinimumLeaseMonths] = useState('')
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [priceNegotiable, setPriceNegotiable] = useState(false)
  const [currency, setCurrency] = useState<AppCurrency>('THB')
  const [contactRoleCode, setContactRoleCode] = useState<ContactRoleCode>('')
  const [contactAuthorityCode, setContactAuthorityCode] = useState<ContactAuthorityCode>('')
  const [contactOrganizationName, setContactOrganizationName] = useState('')
  const [contactOrganizationRegistrationNo, setContactOrganizationRegistrationNo] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])
  const [panoramas, setPanoramas] = useState<File[]>([])
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([])
  const [uploadedPanoramaUrls, setUploadedPanoramaUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const uploadLockRef = useRef(false)

  useEffect(() => {
    router.prefetch('/add-listing/4')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedOffers = readValues(savedDraft['offerTypes[]']).filter(isOfferTypeCode)
      setDraft(savedDraft)
      setOffers(savedOffers.length ? savedOffers : offersFromLegacy(readText(savedDraft.listing_type)))
      setSalePrice(formatPriceInput(readText(savedDraft.salePrice)))
      setRentPriceMonthly(formatPriceInput(readText(savedDraft.rentPriceMonthly)))
      setRentPriceDaily(formatPriceInput(readText(savedDraft.rentPriceDaily)))
      setKeyMoneyAmount(formatPriceInput(readText(savedDraft.keyMoneyAmount)))
      setEventBookingPrice(formatPriceInput(readText(savedDraft.eventBookingPrice)))
      setServiceFeeMonthly(formatPriceInput(readText(savedDraft.serviceFeeMonthly)))
      setMinimumLeaseMonths(readText(savedDraft.minimumLeaseMonths))
      const savedPriceOnRequest = readText(savedDraft.priceOnRequest) === 'yes'
      const savedCurrency = readText(savedDraft.currency)
      setPriceOnRequest(savedPriceOnRequest)
      setPriceNegotiable(!savedPriceOnRequest && readText(savedDraft.priceNegotiable) === 'yes')
      setCurrency(savedCurrency === 'THB' || savedCurrency === 'USD' ? savedCurrency : preferredCurrency)
      setContactRoleCode(asContactRoleCode(readText(savedDraft.contactRoleCode)))
      setContactAuthorityCode(asContactAuthorityCode(readText(savedDraft.contactAuthorityCode)))
      setContactOrganizationName(readText(savedDraft.contactOrganizationName))
      setContactOrganizationRegistrationNo(readText(savedDraft.contactOrganizationRegistrationNo))
      setUploadedPhotoUrls(readValues(savedDraft['listingPhotoUrls[]']))
      setUploadedVideoUrls(readValues(savedDraft['listingVideoUrls[]']))
      setUploadedPanoramaUrls(readValues(savedDraft['listingPanoramaUrls[]']))
    })

    return () => cancelAnimationFrame(frame)
  }, [preferredCurrency, router])

  const previewUrls = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  const videoPreviewUrls = useMemo(() => videos.map((video) => URL.createObjectURL(video)), [videos])
  const panoramaPreviewUrls = useMemo(() => panoramas.map((panorama) => URL.createObjectURL(panorama)), [panoramas])

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [previewUrls])

  useEffect(() => {
    return () => videoPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [videoPreviewUrls])

  useEffect(() => {
    return () => panoramaPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
  }, [panoramaPreviewUrls])

  useEffect(() => {
    if (isUploading) return

    const frame = requestAnimationFrame(() => {
      setMediaProgress({
        ...initialListingMediaProgress,
        phase: uploadError ? 'error' : 'idle',
        pendingCount: photos.length + videos.length + panoramas.length,
        uploadedCount: uploadedPhotoUrls.length + uploadedVideoUrls.length + uploadedPanoramaUrls.length,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [
    isUploading,
    panoramas.length,
    photos.length,
    setMediaProgress,
    uploadError,
    uploadedPanoramaUrls.length,
    uploadedPhotoUrls.length,
    uploadedVideoUrls.length,
    videos.length,
  ])

  const hasSale = offers.includes('sale')
  const hasRent = offers.includes('rent') || offers.includes('sublease')
  const hasTransfer = offers.includes('business_transfer')
  const hasEventBooking = offers.includes('event_booking')
  const isMonthlyHotel = readText(draft?.property_type_code) === 'monthly_hotel'

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'))
    setPhotos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_PHOTOS - uploadedPhotoUrls.length)))
    event.target.value = ''
    setUploadError('')
  }

  const handleVideos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) =>
      ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)
    )
    setVideos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_VIDEOS - uploadedVideoUrls.length)))
    event.target.value = ''
    setUploadError('')
  }

  const handlePanoramas = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'))
    setPanoramas((current) =>
      appendUniqueFiles(current, selected, Math.max(0, MAX_PANORAMAS - uploadedPanoramaUrls.length))
    )
    event.target.value = ''
    setUploadError('')
  }

  const removePhoto = (index: number) => {
    if (index < uploadedPhotoUrls.length) {
      setUploadedPhotoUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    const pendingIndex = index - uploadedPhotoUrls.length
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== pendingIndex))
  }

  const removeVideo = (index: number) => {
    if (index < uploadedVideoUrls.length) {
      setUploadedVideoUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    const pendingIndex = index - uploadedVideoUrls.length
    setVideos((current) => current.filter((_, itemIndex) => itemIndex !== pendingIndex))
  }

  const removePanorama = (index: number) => {
    if (index < uploadedPanoramaUrls.length) {
      setUploadedPanoramaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    const pendingIndex = index - uploadedPanoramaUrls.length
    setPanoramas((current) => current.filter((_, itemIndex) => itemIndex !== pendingIndex))
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (uploadLockRef.current) return
    if (!validateListingForm({ isThai })) return

    uploadLockRef.current = true
    setUploadError('')
    setIsUploading(true)
    let nextPhotoUrls = uploadedPhotoUrls
    let nextVideoUrls = uploadedVideoUrls
    let nextPanoramaUrls = uploadedPanoramaUrls
    const pendingMediaTotal = photos.length + videos.length + panoramas.length
    let completedMediaCount = 0
    let uploadedMediaCount = uploadedPhotoUrls.length + uploadedVideoUrls.length + uploadedPanoramaUrls.length

    setMediaProgress({
      phase: pendingMediaTotal ? 'uploading' : 'saving',
      pendingCount: pendingMediaTotal,
      uploadedCount: uploadedMediaCount,
      completedCount: 0,
      totalCount: pendingMediaTotal,
      currentFileName: '',
    })

    const uploadQueue = async ({
      files,
      mediaType,
      existingUrls,
      limit,
      onUrlsChange,
      onFilesChange,
    }: {
      files: File[]
      mediaType: ListingMediaType
      existingUrls: string[]
      limit: number
      onUrlsChange: (urls: string[]) => void
      onFilesChange: (files: File[]) => void
    }) => {
      let urls = existingUrls

      for (const [index, file] of files.entries()) {
        onFilesChange(files.slice(index))
        setMediaProgress({
          phase: 'uploading',
          pendingCount: pendingMediaTotal,
          uploadedCount: uploadedMediaCount,
          completedCount: completedMediaCount,
          totalCount: pendingMediaTotal,
          currentFileName: file.name,
        })

        const uploaded = await uploadListingMedia([file], mediaType)
        urls = [...new Set([...urls, ...uploaded])].slice(0, limit)
        completedMediaCount += 1
        uploadedMediaCount += uploaded.length
        onUrlsChange(urls)
        onFilesChange(files.slice(index + 1))
        setMediaProgress({
          phase: 'uploading',
          pendingCount: pendingMediaTotal,
          uploadedCount: uploadedMediaCount,
          completedCount: completedMediaCount,
          totalCount: pendingMediaTotal,
          currentFileName: file.name,
        })
      }

      return urls
    }

    try {
      if (photos.length) {
        nextPhotoUrls = await uploadQueue({
          files: photos,
          mediaType: 'image',
          existingUrls: uploadedPhotoUrls,
          limit: MAX_PHOTOS,
          onUrlsChange: (urls) => {
            nextPhotoUrls = urls
            setUploadedPhotoUrls(urls)
          },
          onFilesChange: setPhotos,
        })
      }
      if (videos.length) {
        nextVideoUrls = await uploadQueue({
          files: videos,
          mediaType: 'video',
          existingUrls: uploadedVideoUrls,
          limit: MAX_VIDEOS,
          onUrlsChange: (urls) => {
            nextVideoUrls = urls
            setUploadedVideoUrls(urls)
          },
          onFilesChange: setVideos,
        })
      }
      if (panoramas.length) {
        nextPanoramaUrls = await uploadQueue({
          files: panoramas,
          mediaType: '360',
          existingUrls: uploadedPanoramaUrls,
          limit: MAX_PANORAMAS,
          onUrlsChange: (urls) => {
            nextPanoramaUrls = urls
            setUploadedPanoramaUrls(urls)
          },
          onFilesChange: setPanoramas,
        })
      }
    } catch (error) {
      setUploadError(
        isThai
          ? 'อัปโหลดสื่อไม่สำเร็จ กรุณาลองอีกครั้ง'
          : error instanceof Error
            ? error.message
            : 'Unable to upload media. Please try again.'
      )
      uploadLockRef.current = false
      setIsUploading(false)
      return
    }

    setMediaProgress({
      phase: 'saving',
      pendingCount: 0,
      uploadedCount: uploadedMediaCount,
      completedCount: completedMediaCount,
      totalCount: pendingMediaTotal,
      currentFileName: '',
    })

    if (priceOnRequest || !hasSale) formData.set('salePrice', '')
    if (priceOnRequest || (!hasRent && !hasTransfer)) formData.set('rentPriceMonthly', '')
    if (priceOnRequest || !isMonthlyHotel) formData.set('rentPriceDaily', '')
    if (priceOnRequest || !hasTransfer) formData.set('keyMoneyAmount', '')
    if (priceOnRequest || !hasEventBooking) formData.set('eventBookingPrice', '')
    if (priceOnRequest || (!hasRent && !hasTransfer)) formData.set('serviceFeeMonthly', '')
    if (!hasRent && !hasTransfer) formData.set('minimumLeaseMonths', '')
    formData.set('priceOnRequest', priceOnRequest ? 'yes' : '')
    formData.set('priceNegotiable', !priceOnRequest && priceNegotiable ? 'yes' : '')
    formData.set('currency', currency)
    formData.set('contactRoleCode', contactRoleCode)
    formData.set('contactAuthorityCode', contactRoleCode === 'owner' ? 'self' : contactAuthorityCode)
    formData.set('contactOrganizationName', contactOrganizationName.trim())
    formData.set(
      'contactOrganizationRegistrationNo',
      contactOrganizationName.trim() ? contactOrganizationRegistrationNo.trim() : ''
    )
    formData.set('selectedPhotoCount', String(nextPhotoUrls.length))
    formData.set('selectedVideoCount', String(nextVideoUrls.length))
    formData.set('selectedPanoramaCount', String(nextPanoramaUrls.length))
    replaceFormDataValues(formData, 'listingPhotoUrls[]', nextPhotoUrls)
    replaceFormDataValues(formData, 'listingVideoUrls[]', nextVideoUrls)
    replaceFormDataValues(formData, 'listingPanoramaUrls[]', nextPanoramaUrls)
    const savedDraft = saveListingStep(3, formData)
    await saveListingDraftToCloud(savedDraft).catch(() => undefined)
    router.push('/add-listing/4')
  }

  if (!draft) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
  }

  const photoCount = uploadedPhotoUrls.length + photos.length
  const videoCount = uploadedVideoUrls.length + videos.length
  const panoramaCount = uploadedPanoramaUrls.length + panoramas.length

  return (
    <>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          <BanknotesIcon className="h-4 w-4" />
          {isThai ? 'สื่อ ราคา และการติดต่อ' : 'Media, price & contact'}
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {isThai ? 'เตรียมประกาศให้พร้อมตรวจสอบ' : 'Prepare your listing for review'}
        </h1>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} noValidate aria-busy={isUploading} className="space-y-6">
        <PricingPanel
          isThai={isThai}
          offers={offers}
          currency={currency}
          onCurrencyChange={setCurrency}
          priceOnRequest={priceOnRequest}
          onPriceOnRequestChange={(value) => {
            setPriceOnRequest(value)
            if (value) setPriceNegotiable(false)
          }}
          priceNegotiable={priceNegotiable}
          onPriceNegotiableChange={setPriceNegotiable}
          hasSale={hasSale}
          hasRent={hasRent}
          hasTransfer={hasTransfer}
          hasEventBooking={hasEventBooking}
          isMonthlyHotel={isMonthlyHotel}
          salePrice={salePrice}
          onSalePriceChange={setSalePrice}
          rentPriceMonthly={rentPriceMonthly}
          onRentPriceMonthlyChange={setRentPriceMonthly}
          rentPriceDaily={rentPriceDaily}
          onRentPriceDailyChange={setRentPriceDaily}
          keyMoneyAmount={keyMoneyAmount}
          onKeyMoneyAmountChange={setKeyMoneyAmount}
          eventBookingPrice={eventBookingPrice}
          onEventBookingPriceChange={setEventBookingPrice}
          serviceFeeMonthly={serviceFeeMonthly}
          onServiceFeeMonthlyChange={setServiceFeeMonthly}
          minimumLeaseMonths={minimumLeaseMonths}
          onMinimumLeaseMonthsChange={setMinimumLeaseMonths}
        />

        <MediaUploadProgressCard isThai={isThai} progress={mediaProgress} error={uploadError} />

        <SectionCard icon={<PhotoIcon className="size-5" />} title={isThai ? 'รูปภาพของทรัพย์' : 'Property photos'}>
          <label
            className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center transition dark:border-neutral-700 dark:bg-neutral-950 ${
              photoCount >= MAX_PHOTOS
                ? 'cursor-not-allowed opacity-65'
                : 'cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 dark:hover:border-orange-700'
            }`}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              <PhotoIcon className="size-6" />
            </span>
            <span className="mt-4 font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {photoCount >= MAX_PHOTOS
                ? isThai
                  ? 'เพิ่มรูปครบแล้ว'
                  : 'Photo limit reached'
                : photoCount
                  ? isThai
                    ? 'เพิ่มรูปภาพ'
                    : 'Add more photos'
                  : isThai
                    ? 'เลือกรูปภาพ'
                    : 'Choose photos'}
            </span>
            <span className="mt-1 font-sarabun text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {isThai
                ? `สูงสุด ${MAX_PHOTOS} รูป · ไม่เกิน 8 MB/รูป · รูปแรกเป็นภาพหน้าปก · ${photoCount}/${MAX_PHOTOS}`
                : `Up to ${MAX_PHOTOS} photos · 8 MB each · first photo is the cover · ${photoCount}/${MAX_PHOTOS}`}
            </span>
            <input
              name="listingPhotos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={photoCount >= MAX_PHOTOS || isUploading}
              onChange={handlePhotos}
              className="sr-only"
            />
          </label>

          {uploadedPhotoUrls.length || previewUrls.length ? (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
              {[...uploadedPhotoUrls.map(resolveListingMediaUrl), ...previewUrls].map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-cover bg-center ring-1 ring-neutral-200 dark:ring-neutral-700"
                  style={{ backgroundImage: `url(${url})` }}
                  aria-label={isThai ? `รูปที่ ${index + 1}` : `Photo ${index + 1}`}
                >
                  {index === 0 ? (
                    <span className="m-2 inline-block rounded-full bg-neutral-950/75 px-2 py-1 font-sarabun text-[10px] text-white">
                      {isThai ? 'ภาพหน้าปก' : 'Cover photo'}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    disabled={isUploading}
                    className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md ring-1 ring-black/10 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isThai ? `ลบรูปที่ ${index + 1}` : `Remove photo ${index + 1}`}
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
              ))}
            </div>
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
          <label
            className={`flex items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 transition dark:border-neutral-700 dark:bg-neutral-950 ${
              videoCount >= MAX_VIDEOS
                ? 'cursor-not-allowed opacity-65'
                : 'cursor-pointer hover:border-orange-400 hover:bg-orange-50/50'
            }`}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              <VideoCameraIcon className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {videoCount >= MAX_VIDEOS
                  ? isThai
                    ? 'เพิ่มวิดีโอครบแล้ว'
                    : 'Video limit reached'
                  : videoCount
                    ? isThai
                      ? 'เพิ่มวิดีโอ'
                      : 'Add more videos'
                    : isThai
                      ? 'เลือกวิดีโอ'
                      : 'Choose videos'}
              </span>
              <span className="mt-1 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                {isThai
                  ? 'เลือก 1 ไฟล์หรือหลายไฟล์พร้อมกันก็ได้ · ไม่เกิน 50 MB/ไฟล์'
                  : 'Choose one or multiple files · up to 50 MB each'}{' '}
                · MP4, WebM, MOV · {videoCount}/{MAX_VIDEOS}
              </span>
            </span>
            <input
              name="listingVideos"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mov"
              multiple
              disabled={videoCount >= MAX_VIDEOS || isUploading}
              onChange={handleVideos}
              className="sr-only"
            />
          </label>

          {uploadedVideoUrls.length || videoPreviewUrls.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[...uploadedVideoUrls.map(resolveListingMediaUrl), ...videoPreviewUrls].map((url, index) => (
                <div key={url} className="relative">
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-2xl bg-neutral-950 object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                    aria-label={isThai ? `วิดีโอที่ ${index + 1}` : `Video ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    disabled={isUploading}
                    className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md ring-1 ring-black/10 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isThai ? `ลบวิดีโอที่ ${index + 1}` : `Remove video ${index + 1}`}
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                </div>
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
                {isThai
                  ? 'มีภาพพาโนรามาค่อยเปิดเพิ่ม · สูงสุด 4 รูป'
                  : 'Open only when you have panoramas · up to 4 photos'}
              </span>
            </span>
            <ChevronDownIcon className="size-5 text-neutral-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-neutral-100 px-5 pt-5 pb-6 sm:px-7 sm:pb-7 dark:border-neutral-800">
            <label
              className={`flex items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-5 transition dark:border-neutral-700 dark:bg-neutral-950 ${
                panoramaCount >= MAX_PANORAMAS
                  ? 'cursor-not-allowed opacity-65'
                  : 'cursor-pointer hover:border-orange-400 hover:bg-orange-50/50'
              }`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
                <ViewfinderCircleIcon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {panoramaCount >= MAX_PANORAMAS
                    ? isThai
                      ? 'เพิ่มภาพ 360° ครบแล้ว'
                      : '360° photo limit reached'
                    : panoramaCount
                      ? isThai
                        ? 'เพิ่มภาพ 360°'
                        : 'Add more 360° photos'
                      : isThai
                        ? 'เลือกภาพ 360°'
                        : 'Choose 360° photos'}
                </span>
                <span className="mt-1 block font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'เลือก 1 รูปหรือหลายรูปพร้อมกันก็ได้ · ไม่เกิน 15 MB/รูป'
                    : 'Choose one or multiple photos · up to 15 MB each'}{' '}
                  · JPG, PNG, WebP · {panoramaCount}/{MAX_PANORAMAS}
                </span>
              </span>
              <input
                name="listingPanoramas"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={panoramaCount >= MAX_PANORAMAS || isUploading}
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
                    <button
                      type="button"
                      onClick={() => removePanorama(index)}
                      disabled={isUploading}
                      className="absolute top-1 right-1 flex size-10 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md ring-1 ring-black/10 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={isThai ? `ลบภาพ 360° ที่ ${index + 1}` : `Remove 360° photo ${index + 1}`}
                    >
                      <XMarkIcon className="size-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </details>

        <SectionCard icon={<PhoneIcon className="size-5" />} title={isThai ? 'ช่องทางติดต่อ' : 'Contact details'}>
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <IdentificationIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'คุณติดต่อในฐานะใคร' : 'Who are you representing?'}
                </h3>
                <p className="mt-0.5 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'ช่วยให้ผู้สนใจรู้ว่ากำลังคุยกับเจ้าของ นายหน้า หรือตัวแทนจากองค์กรใด'
                    : 'Let customers know whether they are speaking with an owner, broker, or organization representative.'}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormItem label={isThai ? 'บทบาทของผู้ติดต่อ' : 'Contact role'}>
                <Select
                  name="contactRoleCode"
                  value={contactRoleCode}
                  onChange={(event) => {
                    const nextRole = asContactRoleCode(event.target.value)
                    setContactRoleCode(nextRole)
                    setContactAuthorityCode(defaultAuthorityForRole(nextRole))
                  }}
                  required
                  className="[&_select]:h-12 [&_select]:rounded-2xl"
                >
                  <option value="">{isThai ? 'เลือกบทบาท' : 'Select a role'}</option>
                  <option value="owner">{isThai ? 'เจ้าของทรัพย์' : 'Property owner'}</option>
                  <option value="owner_representative">
                    {isThai ? 'ผู้รับมอบอำนาจจากเจ้าของ' : 'Owner-authorized representative'}
                  </option>
                  <option value="independent_broker">{isThai ? 'นายหน้าอิสระ' : 'Independent broker'}</option>
                  <option value="agency_broker">{isThai ? 'นายหน้าสังกัดบริษัท' : 'Agency broker'}</option>
                  <option value="developer_investor_representative">
                    {isThai ? 'ตัวแทนโครงการ / นักลงทุน' : 'Developer or investor representative'}
                  </option>
                  <option value="property_manager">
                    {isThai ? 'ผู้ดูแลทรัพย์ / ผู้จัดการอาคาร' : 'Property or building manager'}
                  </option>
                </Select>
              </FormItem>

              {contactRoleCode === 'owner' ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/70 dark:bg-emerald-950/25">
                  <span className="flex items-center gap-2 font-sarabun text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    <UserCircleIcon className="size-5" />
                    {isThai ? 'ทรัพย์ของฉันเอง' : 'My own property'}
                  </span>
                  <p className="mt-1 font-sarabun text-xs leading-5 text-emerald-800/80 dark:text-emerald-300/80">
                    {isThai
                      ? 'ระบบจะบันทึกว่าเป็นข้อมูลที่เจ้าของระบุเอง'
                      : 'Recorded as a self-declared owner listing.'}
                  </p>
                </div>
              ) : contactRoleCode ? (
                <FormItem label={isThai ? 'ได้รับสิทธิลงประกาศจาก' : 'Authority to list comes from'}>
                  <Select
                    name="contactAuthorityCode"
                    value={contactAuthorityCode}
                    onChange={(event) => setContactAuthorityCode(asContactAuthorityCode(event.target.value))}
                    required
                    className="[&_select]:h-12 [&_select]:rounded-2xl"
                  >
                    <option value="">{isThai ? 'เลือกแหล่งที่มา' : 'Select authority source'}</option>
                    <option value="property_owner">{isThai ? 'เจ้าของทรัพย์โดยตรง' : 'Property owner directly'}</option>
                    <option value="brokerage_company">
                      {isThai ? 'บริษัทนายหน้าหรือทีม' : 'Brokerage company or team'}
                    </option>
                    <option value="developer_project">{isThai ? 'โครงการ / ผู้พัฒนา' : 'Project or developer'}</option>
                    <option value="investor_asset_holder">
                      {isThai ? 'นักลงทุน / ผู้ถือทรัพย์' : 'Investor or asset holder'}
                    </option>
                    <option value="co_broker">{isThai ? 'นายหน้าร่วม (Co-broker)' : 'Co-broker'}</option>
                    <option value="property_management_company">
                      {isThai ? 'บริษัทบริหารทรัพย์' : 'Property management company'}
                    </option>
                  </Select>
                </FormItem>
              ) : null}

              <FormItem
                label={
                  organizationRequired(contactRoleCode)
                    ? isThai
                      ? 'บริษัท / สังกัด'
                      : 'Company / organization'
                    : isThai
                      ? 'บริษัท / สังกัด (ถ้ามี)'
                      : 'Company / organization (optional)'
                }
              >
                <Input
                  name="contactOrganizationName"
                  value={contactOrganizationName}
                  onChange={(event) => setContactOrganizationName(event.target.value)}
                  autoComplete="organization"
                  placeholder={isThai ? 'เช่น บริษัท เอ บี ซี พร็อพเพอร์ตี้ จำกัด' : 'e.g. ABC Property Co., Ltd.'}
                  required={organizationRequired(contactRoleCode)}
                  maxLength={160}
                />
              </FormItem>

              <FormItem
                label={
                  isThai
                    ? 'เลขทะเบียนนิติบุคคล (ไม่บังคับ · ไม่แสดงสาธารณะ)'
                    : 'Company registration no. (optional · private)'
                }
              >
                <Input
                  name="contactOrganizationRegistrationNo"
                  value={contactOrganizationRegistrationNo}
                  onChange={(event) => setContactOrganizationRegistrationNo(event.target.value)}
                  inputMode="numeric"
                  placeholder={isThai ? 'ใช้ประกอบการตรวจสอบบริษัท' : 'Used only for company verification'}
                  maxLength={64}
                />
              </FormItem>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/70 dark:bg-blue-950/25">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="font-sarabun">
                <p className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                  {isThai ? 'สถานะเริ่มต้น: ยังไม่ตรวจสอบ' : 'Initial status: Not verified'}
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-900/75 dark:text-blue-200/75">
                  {verificationGuidance(contactRoleCode, isThai)}
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-900/75 dark:text-blue-200/75">
                  {isThai
                    ? 'การเลือกบทบาทเองจะไม่ทำให้ขึ้นเครื่องหมาย Verified จนกว่าจะตรวจทั้งตัวตนและสิทธิที่เกี่ยวข้องกับทรัพย์'
                    : 'Selecting a role does not grant a Verified badge. Identity and authority for the property must both be checked.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-6 sm:grid-cols-2 dark:border-neutral-800">
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

const MediaUploadProgressCard = ({
  isThai,
  progress,
  error,
}: {
  isThai: boolean
  progress: ListingMediaProgressState
  error: string
}) => {
  const isUploading = progress.phase === 'uploading'
  const isSaving = progress.phase === 'saving'
  const isError = progress.phase === 'error'
  const hasQueuedMedia = progress.pendingCount > 0
  const hasUploadedMedia = progress.uploadedCount > 0
  const progressPercent = progress.totalCount
    ? Math.round((progress.completedCount / progress.totalCount) * 100)
    : isSaving
      ? 100
      : 0

  const status = isUploading
    ? {
        title: isThai
          ? `กำลังอัปโหลด ${progress.completedCount} จาก ${progress.totalCount} ไฟล์`
          : `Uploading ${progress.completedCount} of ${progress.totalCount} files`,
        description: progress.currentFileName,
        badge: `${progressPercent}%`,
        tone: 'border-orange-200 bg-orange-50/70 text-orange-950 dark:border-orange-900/70 dark:bg-orange-950/25 dark:text-orange-100',
      }
    : isSaving
      ? {
          title: isThai ? 'อัปโหลดครบแล้ว กำลังเปิดหน้าตรวจสอบ' : 'Upload complete. Opening review',
          description: isThai
            ? 'กำลังบันทึกร่างล่าสุด กรุณาอย่าปิดหน้านี้'
            : 'Saving the latest draft. Please keep this page open.',
          badge: '100%',
          tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100',
        }
      : isError
        ? {
            title: isThai ? 'มีบางไฟล์ยังอัปโหลดไม่สำเร็จ' : 'Some files could not be uploaded',
            description: error,
            badge: isThai ? 'ลองอีกครั้ง' : 'Try again',
            tone: 'border-red-200 bg-red-50/70 text-red-950 dark:border-red-900/70 dark:bg-red-950/25 dark:text-red-100',
          }
        : hasQueuedMedia
          ? {
              title: isThai
                ? `พร้อมอัปโหลด ${progress.pendingCount} ไฟล์`
                : `${progress.pendingCount} files ready to upload`,
              description: isThai
                ? 'ไฟล์ยังอยู่บนอุปกรณ์ของคุณ ระบบจะอัปโหลดก่อนเปิดหน้าตรวจสอบ'
                : 'These files are still on your device. They will upload before the review page opens.',
              badge: isThai ? 'รออัปโหลด' : 'Waiting',
              tone: 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100',
            }
          : hasUploadedMedia
            ? {
                title: isThai
                  ? `อัปโหลดแล้ว ${progress.uploadedCount} ไฟล์ พร้อมตรวจสอบ`
                  : `${progress.uploadedCount} files uploaded and ready`,
                description: isThai
                  ? 'สื่อถูกบันทึกในร่างแล้ว คุณยังเพิ่มหรือลบไฟล์ก่อนตรวจสอบได้'
                  : 'Media is saved in your draft. You can still add or remove files before review.',
                badge: isThai ? 'พร้อมแล้ว' : 'Ready',
                tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100',
              }
            : {
                title: isThai ? 'ยังไม่ได้เลือกสื่อ' : 'No media selected yet',
                description: isThai
                  ? 'รูปภาพ วิดีโอ และภาพ 360° ไม่บังคับ แต่ช่วยให้ประกาศน่าสนใจขึ้น'
                  : 'Photos, videos, and 360° images are optional, but make a listing more useful.',
                badge: isThai ? 'ไม่บังคับ' : 'Optional',
                tone: 'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-100',
              }

  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
          <CloudArrowUpIcon className="size-5" />
        </span>
        <div>
          <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {isThai ? 'ลำดับการอัปโหลดและตรวจสอบ' : 'Upload and review flow'}
          </h2>
          <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            {isThai
              ? 'สื่อจะอัปโหลดในขั้นนี้ก่อน ส่วนประกาศจะยังไม่ถูกส่งเข้าคิวจนกว่าคุณจะกดส่งในหน้าตรวจสอบ'
              : 'Media uploads in this step. Your listing is not submitted for review until you confirm on the next page.'}
          </p>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 min-[560px]:grid-cols-3">
        <MediaFlowStep
          icon={<PhotoIcon className="size-4" />}
          number="1"
          title={isThai ? 'เลือกสื่อ' : 'Choose media'}
          description={isThai ? 'เลือกทีละไฟล์หรือหลายไฟล์' : 'One or multiple files'}
        />
        <MediaFlowStep
          icon={<CloudArrowUpIcon className="size-4" />}
          number="2"
          title={isThai ? 'อัปโหลดก่อนตรวจ' : 'Upload before review'}
          description={isThai ? 'กดปุ่มด้านล่างเพื่อเริ่ม' : 'Use the button below'}
        />
        <MediaFlowStep
          icon={<DocumentCheckIcon className="size-4" />}
          number="3"
          title={isThai ? 'ตรวจแล้วค่อยส่ง' : 'Review, then submit'}
          description={isThai ? 'เช็กสื่อก่อนส่งประกาศ' : 'Check media before publishing'}
        />
      </ol>

      <div className={`mt-4 rounded-2xl border p-4 transition-colors ${status.tone}`} aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-current/10 dark:bg-black/15">
            {isUploading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
            ) : isSaving || hasUploadedMedia ? (
              <CheckCircleIcon className="size-5" />
            ) : (
              <EyeIcon className="size-5" />
            )}
          </span>
          <span className="min-w-0 flex-1 font-sarabun">
            <span className="block text-sm font-semibold">{status.title}</span>
            <span className="mt-0.5 block truncate text-xs leading-5 opacity-75">{status.description}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white/75 px-2.5 py-1 font-sarabun text-[11px] font-semibold shadow-sm ring-1 ring-current/10 dark:bg-black/15">
            {status.badge}
          </span>
        </div>

        {isUploading || isSaving ? (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
            role="progressbar"
            aria-label={isThai ? 'ความคืบหน้าการอัปโหลดสื่อ' : 'Media upload progress'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-full bg-current transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

const MediaFlowStep = ({
  icon,
  number,
  title,
  description,
}: {
  icon: React.ReactNode
  number: string
  title: string
  description: string
}) => (
  <li className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/60">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
      {icon}
    </span>
    <span className="min-w-0 font-sarabun">
      <span className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100">
        {number}. {title}
      </span>
      <span className="mt-0.5 block text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">{description}</span>
    </span>
  </li>
)

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

type PricingPanelProps = {
  isThai: boolean
  offers: OfferTypeCode[]
  currency: AppCurrency
  onCurrencyChange: (value: AppCurrency) => void
  priceOnRequest: boolean
  onPriceOnRequestChange: (value: boolean) => void
  priceNegotiable: boolean
  onPriceNegotiableChange: (value: boolean) => void
  hasSale: boolean
  hasRent: boolean
  hasTransfer: boolean
  hasEventBooking: boolean
  isMonthlyHotel: boolean
  salePrice: string
  onSalePriceChange: (value: string) => void
  rentPriceMonthly: string
  onRentPriceMonthlyChange: (value: string) => void
  rentPriceDaily: string
  onRentPriceDailyChange: (value: string) => void
  keyMoneyAmount: string
  onKeyMoneyAmountChange: (value: string) => void
  eventBookingPrice: string
  onEventBookingPriceChange: (value: string) => void
  serviceFeeMonthly: string
  onServiceFeeMonthlyChange: (value: string) => void
  minimumLeaseMonths: string
  onMinimumLeaseMonthsChange: (value: string) => void
}

const PricingPanel = ({
  isThai,
  offers,
  currency,
  onCurrencyChange,
  priceOnRequest,
  onPriceOnRequestChange,
  priceNegotiable,
  onPriceNegotiableChange,
  hasSale,
  hasRent,
  hasTransfer,
  hasEventBooking,
  isMonthlyHotel,
  salePrice,
  onSalePriceChange,
  rentPriceMonthly,
  onRentPriceMonthlyChange,
  rentPriceDaily,
  onRentPriceDailyChange,
  keyMoneyAmount,
  onKeyMoneyAmountChange,
  eventBookingPrice,
  onEventBookingPriceChange,
  serviceFeeMonthly,
  onServiceFeeMonthlyChange,
  minimumLeaseMonths,
  onMinimumLeaseMonthsChange,
}: PricingPanelProps) => {
  const symbol = currency === 'USD' ? '$' : '฿'
  const currencyUnit = currency === 'USD' ? 'USD' : isThai ? 'บาท' : 'THB'
  const monthlyUnit = `${currencyUnit}/${isThai ? 'เดือน' : 'month'}`

  return (
    <section className="overflow-hidden rounded-[30px] border border-orange-200 bg-white shadow-[0_18px_50px_-32px_rgba(234,88,12,0.45)] dark:border-orange-900/60 dark:bg-neutral-900">
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white p-5 sm:p-7 dark:border-orange-950 dark:from-orange-950/35 dark:via-neutral-900 dark:to-neutral-900">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
            <BanknotesIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
              {isThai ? 'ราคาและเงื่อนไข' : 'Price & terms'}
            </h2>
            <p className="mt-1 font-sarabun text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {isThai
                ? 'ระบุราคาให้ตรงกับรูปแบบประกาศ ผู้สนใจจะตัดสินใจและติดต่อได้ง่ายขึ้น'
                : 'Add prices for each listing option so customers can decide and contact you more easily.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {offers.map((offer) => (
                <span
                  key={offer}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 font-sarabun text-xs font-medium text-orange-800 dark:border-orange-900 dark:bg-neutral-900 dark:text-orange-300"
                >
                  <CheckCircleIcon className="size-3.5" />
                  {isThai ? getOfferType(offer)?.nameTh || offer : getOfferType(offer)?.nameEn || offer}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'สกุลเงินของประกาศ' : 'Listing currency'}
              </h3>
              <p className="mt-1 font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                {isThai
                  ? 'ใช้กับราคาทุกช่องในประกาศนี้ โดยไม่แปลงตัวเลขอัตโนมัติ'
                  : 'Applies to every price below; amounts are not converted automatically.'}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
            {[
              { code: 'THB' as const, symbol: '฿', label: isThai ? 'บาทไทย' : 'Thai baht' },
              { code: 'USD' as const, symbol: '$', label: isThai ? 'ดอลลาร์สหรัฐ' : 'US dollar' },
            ].map((option) => {
              const isSelected = currency === option.code
              return (
                <button
                  key={option.code}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onCurrencyChange(option.code)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 text-orange-950 ring-1 ring-orange-500 dark:bg-orange-950/35 dark:text-orange-100'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200'
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                    }`}
                  >
                    {option.symbol}
                  </span>
                  <span className="min-w-0 font-sarabun">
                    <span className="block text-sm font-semibold">{option.code}</span>
                    <span className="block truncate text-xs opacity-70">{option.label}</span>
                  </span>
                  {isSelected ? <CheckCircleIcon className="ms-auto size-5 shrink-0 text-orange-600" /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-6 dark:border-neutral-800">
          <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {isThai ? 'ต้องการแสดงราคาแบบไหน' : 'How would you like to show the price?'}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={!priceOnRequest}
              onClick={() => onPriceOnRequestChange(false)}
              className={`flex min-h-20 items-start gap-3 rounded-2xl border p-4 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                !priceOnRequest
                  ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/35'
                  : 'border-neutral-200 bg-white hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-950'
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${!priceOnRequest ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'}`}
              >
                <BanknotesIcon className="size-5" />
              </span>
              <span className="min-w-0 font-sarabun">
                <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'ระบุราคา' : 'Enter a price'}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isThai ? 'กรอกตัวเลขให้ผู้สนใจเห็นได้ทันที' : 'Show the amount to customers immediately.'}
                </span>
              </span>
              {!priceOnRequest ? <CheckCircleIcon className="ms-auto size-5 shrink-0 text-orange-600" /> : null}
            </button>
            <button
              type="button"
              aria-pressed={priceOnRequest}
              onClick={() => onPriceOnRequestChange(true)}
              className={`flex min-h-20 items-start gap-3 rounded-2xl border p-4 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                priceOnRequest
                  ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/35'
                  : 'border-neutral-200 bg-white hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-950'
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${priceOnRequest ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'}`}
              >
                <ChatBubbleLeftRightIcon className="size-5" />
              </span>
              <span className="min-w-0 font-sarabun">
                <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'ไม่ระบุราคา' : 'Price on request'}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isThai ? 'แสดงให้ผู้สนใจสอบถามราคาโดยตรง' : 'Ask customers to contact you for the price.'}
                </span>
              </span>
              {priceOnRequest ? <CheckCircleIcon className="ms-auto size-5 shrink-0 text-orange-600" /> : null}
            </button>
          </div>
        </div>

        {priceOnRequest ? (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900/70 dark:bg-orange-950/25">
            <ChatBubbleLeftRightIcon className="mt-0.5 size-5 shrink-0 text-orange-600" />
            <p className="font-sarabun text-sm leading-6 text-orange-950 dark:text-orange-100">
              {isThai
                ? 'หน้าประกาศจะแสดง “สอบถามราคา” และระบบจะไม่นำตัวเลขราคาเดิมไปบันทึก'
                : 'The listing will show “Price on request”, and previously entered amounts will not be saved.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 border-t border-neutral-100 pt-6 dark:border-neutral-800">
            {hasSale ? (
              <PricingGroup
                icon={<BanknotesIcon className="size-5" />}
                title={isThai ? 'ราคาขาย' : 'Sale price'}
                description={isThai ? 'ราคาขายรวมของทรัพย์' : 'Total asking price for the property'}
              >
                <FormItem label={isThai ? 'ราคาขายรวม' : 'Total sale price'}>
                  <PriceInput
                    name="salePrice"
                    value={salePrice}
                    onChange={onSalePriceChange}
                    suffix={currencyUnit}
                    symbol={symbol}
                    placeholder={currency === 'THB' ? '3,500,000' : '100,000'}
                    required
                  />
                </FormItem>
              </PricingGroup>
            ) : null}

            {hasRent ? (
              <PricingGroup
                icon={<CalendarDaysIcon className="size-5" />}
                title={
                  offers.includes('sublease')
                    ? isThai
                      ? 'ค่าเช่าช่วง'
                      : 'Sublease price'
                    : isThai
                      ? 'ค่าเช่า'
                      : 'Rental price'
                }
                description={isThai ? 'ค่าเช่า ระยะสัญญา และค่าใช้จ่ายประจำ' : 'Rent, lease term, and recurring fees'}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormItem label={isThai ? 'ค่าเช่ารายเดือน' : 'Monthly rent'}>
                    <PriceInput
                      name="rentPriceMonthly"
                      value={rentPriceMonthly}
                      onChange={onRentPriceMonthlyChange}
                      suffix={monthlyUnit}
                      symbol={symbol}
                      placeholder={currency === 'THB' ? '15,000' : '450'}
                      required
                    />
                  </FormItem>
                  {isMonthlyHotel ? (
                    <FormItem label={isThai ? 'ราคารายวัน (ไม่บังคับ)' : 'Daily rate (optional)'}>
                      <PriceInput
                        name="rentPriceDaily"
                        value={rentPriceDaily}
                        onChange={onRentPriceDailyChange}
                        suffix={`${currencyUnit}/${isThai ? 'คืน' : 'night'}`}
                        symbol={symbol}
                        placeholder={currency === 'THB' ? '1,200' : '35'}
                      />
                    </FormItem>
                  ) : null}
                  <FormItem label={isThai ? 'ระยะสัญญาขั้นต่ำ' : 'Minimum lease'}>
                    <Select
                      name="minimumLeaseMonths"
                      value={minimumLeaseMonths}
                      onChange={(event) => onMinimumLeaseMonthsChange(event.target.value)}
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
                      onChange={onServiceFeeMonthlyChange}
                      suffix={monthlyUnit}
                      symbol={symbol}
                      placeholder={currency === 'THB' ? '1,500' : '45'}
                    />
                  </FormItem>
                </div>
              </PricingGroup>
            ) : null}

            {hasTransfer ? (
              <PricingGroup
                icon={<ArrowPathRoundedSquareIcon className="size-5" />}
                title={isThai ? 'ค่าเซ้งหรือค่าโอนสิทธิ' : 'Transfer or key money'}
                description={
                  isThai
                    ? 'ระบุเงินก้อนและค่าเช่าที่ผู้รับช่วงต้องจ่ายต่อ'
                    : 'Upfront transfer price and any ongoing rent'
                }
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormItem label={isThai ? 'ราคาเซ้ง / ค่าโอนสิทธิ' : 'Transfer price'}>
                    <PriceInput
                      name="keyMoneyAmount"
                      value={keyMoneyAmount}
                      onChange={onKeyMoneyAmountChange}
                      suffix={currencyUnit}
                      symbol={symbol}
                      placeholder={currency === 'THB' ? '500,000' : '15,000'}
                      required
                    />
                  </FormItem>
                  {!hasRent ? (
                    <>
                      <FormItem
                        label={isThai ? 'ค่าเช่าที่ต้องจ่ายต่อเดือน (ไม่บังคับ)' : 'Ongoing monthly rent (optional)'}
                      >
                        <PriceInput
                          name="rentPriceMonthly"
                          value={rentPriceMonthly}
                          onChange={onRentPriceMonthlyChange}
                          suffix={monthlyUnit}
                          symbol={symbol}
                          placeholder={currency === 'THB' ? '20,000' : '600'}
                        />
                      </FormItem>
                      <FormItem label={isThai ? 'ระยะสัญญาที่เหลือ / ขั้นต่ำ' : 'Remaining / minimum lease'}>
                        <Select
                          name="minimumLeaseMonths"
                          value={minimumLeaseMonths}
                          onChange={(event) => onMinimumLeaseMonthsChange(event.target.value)}
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
                          onChange={onServiceFeeMonthlyChange}
                          suffix={monthlyUnit}
                          symbol={symbol}
                          placeholder={currency === 'THB' ? '1,500' : '45'}
                        />
                      </FormItem>
                    </>
                  ) : null}
                </div>
              </PricingGroup>
            ) : null}

            {hasEventBooking ? (
              <PricingGroup
                icon={<CalendarDaysIcon className="size-5" />}
                title={isThai ? 'ราคาพื้นที่ชั่วคราว' : 'Temporary space price'}
                description={
                  isThai ? 'ราคาต่อหนึ่งรอบงานหรือช่วงเวลาที่ตกลงกัน' : 'Price per event or agreed booking period'
                }
              >
                <FormItem label={isThai ? 'ราคาต่อรอบงาน' : 'Price per event period'}>
                  <PriceInput
                    name="eventBookingPrice"
                    value={eventBookingPrice}
                    onChange={onEventBookingPriceChange}
                    suffix={`${currencyUnit}/${isThai ? 'รอบ' : 'period'}`}
                    symbol={symbol}
                    placeholder={currency === 'THB' ? '5,000' : '150'}
                    required
                  />
                </FormItem>
              </PricingGroup>
            ) : null}
          </div>
        )}

        <label
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
            priceOnRequest
              ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-55 dark:border-neutral-800 dark:bg-neutral-950'
              : priceNegotiable
                ? 'border-orange-400 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/25'
                : 'border-neutral-200 bg-white hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-950'
          }`}
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${priceNegotiable && !priceOnRequest ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'}`}
          >
            <ScaleIcon className="size-5" />
          </span>
          <span className="min-w-0 flex-1 font-sarabun">
            <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
              {isThai ? 'ต่อรองราคาได้' : 'Price is negotiable'}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {priceOnRequest
                ? isThai
                  ? 'ไม่จำเป็นเมื่อเลือกไม่ระบุราคา'
                  : 'Not needed when price is on request.'
                : isThai
                  ? 'เปิดไว้เมื่อคุณยืดหยุ่นเรื่องราคา'
                  : 'Turn this on when you are flexible on price.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={!priceOnRequest && priceNegotiable}
            disabled={priceOnRequest}
            onChange={(event) => onPriceNegotiableChange(event.target.checked)}
            className="peer sr-only"
          />
          <span className="relative h-7 w-12 shrink-0 rounded-full bg-neutral-300 transition peer-checked:bg-orange-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500 peer-disabled:opacity-60 after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 dark:bg-neutral-700" />
        </label>
      </div>
    </section>
  )
}

const PricingGroup = ({
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
  <section className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-950/60">
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
        {icon}
      </span>
      <div>
        <h3 className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">{title}</h3>
        <p className="mt-0.5 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </div>
    {children}
  </section>
)

const PriceInput = ({
  name,
  value,
  suffix,
  symbol,
  placeholder,
  required,
  onChange,
}: {
  name: string
  value: string
  suffix: string
  symbol: string
  placeholder?: string
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
      onChange={(event) => onChange(formatPriceInput(event.target.value))}
      inputMode="decimal"
      pattern="[0-9,]*(\.[0-9]{0,2})?"
      placeholder={placeholder || '0'}
      required={required}
      className="h-12 ps-9! pe-28!"
    />
    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-xs text-neutral-500">
      {suffix}
    </div>
  </div>
)

const formatPriceInput = (value: string) => {
  if (!value.trim()) return ''

  const normalized = value.replace(/[^0-9.]/g, '')
  const hasDecimal = normalized.includes('.')
  const [wholePart = '', ...fractionParts] = normalized.split('.')
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '')
  const groupedWhole = (normalizedWhole || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fraction = fractionParts.join('').slice(0, 2)

  return hasDecimal ? `${groupedWhole}.${fraction}` : groupedWhole
}

const CONTACT_ROLE_CODES: ContactRoleCode[] = [
  '',
  'owner',
  'owner_representative',
  'independent_broker',
  'agency_broker',
  'developer_investor_representative',
  'property_manager',
]

const CONTACT_AUTHORITY_CODES: ContactAuthorityCode[] = [
  '',
  'self',
  'property_owner',
  'brokerage_company',
  'developer_project',
  'investor_asset_holder',
  'co_broker',
  'property_management_company',
]

const asContactRoleCode = (value: string): ContactRoleCode =>
  CONTACT_ROLE_CODES.includes(value as ContactRoleCode) ? (value as ContactRoleCode) : ''

const asContactAuthorityCode = (value: string): ContactAuthorityCode =>
  CONTACT_AUTHORITY_CODES.includes(value as ContactAuthorityCode) ? (value as ContactAuthorityCode) : ''

const defaultAuthorityForRole = (role: ContactRoleCode): ContactAuthorityCode => {
  switch (role) {
    case 'owner':
      return 'self'
    case 'owner_representative':
      return 'property_owner'
    case 'agency_broker':
      return 'brokerage_company'
    case 'developer_investor_representative':
      return 'developer_project'
    case 'property_manager':
      return 'property_management_company'
    default:
      return ''
  }
}

const organizationRequired = (role: ContactRoleCode) =>
  role === 'agency_broker' || role === 'developer_investor_representative'

const verificationGuidance = (role: ContactRoleCode, isThai: boolean) => {
  switch (role) {
    case 'owner':
      return isThai
        ? 'การยืนยันระดับสูงสุดควรตรวจตัวตนและหลักฐานการถือครองทรัพย์'
        : 'Full verification should check identity and proof of property ownership.'
    case 'owner_representative':
      return isThai
        ? 'ควรตรวจตัวตน หนังสือมอบอำนาจ และหลักฐานของเจ้าของทรัพย์'
        : 'Identity, owner authorization, and ownership evidence should be checked.'
    case 'independent_broker':
      return isThai
        ? 'ควรตรวจตัวตน พร้อมหนังสือยินยอมหรือข้อตกลงนายหน้าจากแหล่งสิทธิที่ระบุ'
        : 'Identity and the owner or source authorization to market the property should be checked.'
    case 'agency_broker':
      return isThai
        ? 'ควรตรวจตัวตน การสังกัดบริษัท และสิทธิของบริษัทในการทำตลาดทรัพย์นี้'
        : 'Identity, agency membership, and the agency’s authority for this property should be checked.'
    case 'developer_investor_representative':
      return isThai
        ? 'ควรตรวจตัวตน การสังกัดองค์กร และสิทธิของโครงการหรือนักลงทุนที่มอบหมายให้ลงประกาศ'
        : 'Identity, organization membership, and the developer or investor mandate should be checked.'
    case 'property_manager':
      return isThai
        ? 'ควรตรวจตัวตนและสัญญาหรือหนังสือแต่งตั้งให้บริหารทรัพย์'
        : 'Identity and the property management appointment or agreement should be checked.'
    default:
      return isThai
        ? 'เลือกบทบาทก่อน ระบบจะแนะนำหลักฐานที่เหมาะกับความสัมพันธ์ของคุณกับทรัพย์'
        : 'Select a role to see which evidence matches your relationship to the property.'
  }
}

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
