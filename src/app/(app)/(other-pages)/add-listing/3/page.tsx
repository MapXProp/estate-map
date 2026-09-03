'use client'

import {
  initialListingMediaProgress,
  useListingFlowProgress,
} from '@/components/add-listing/ListingFlowProgressContext'
import { usePreferences, type AppCurrency } from '@/components/preferences/PreferencesProvider'
import { getOfferType, type OfferTypeCode } from '@/data/propertyTaxonomy'
import { getApiBaseUrl, getStoredUser } from '@/lib/auth'
import { loadListingContactProfile } from '@/lib/listingContactProfile'
import {
  createListingSubmissionKey,
  getListingDraft,
  getListingDraftSummary,
  LISTING_SUBMISSION_RESULT_KEY,
  saveListingStep,
  type ListingDraft,
  type ListingDraftValue,
} from '@/lib/listingDraft'
import { showListingFieldError, validateListingForm } from '@/lib/listingFormValidation'
import {
  consumeListingPublishValidationIssue,
  listingValidationMessage,
  storeListingPublishValidationIssue,
  validateListingDraftForPublish,
} from '@/lib/listingPublishValidation'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import {
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  HomeModernIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  PhotoIcon,
  ScaleIcon,
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
  const { pendingMedia, setPendingMedia, setMediaProgress } = useListingFlowProgress()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [offers, setOffers] = useState<OfferTypeCode[]>(['rent'])
  const [salePrice, setSalePrice] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [rentPriceDaily, setRentPriceDaily] = useState('')
  const [temporarySpacePrice, setTemporarySpacePrice] = useState('')
  const [temporarySpaceDurationDays, setTemporarySpaceDurationDays] = useState('')
  const [keyMoneyAmount, setKeyMoneyAmount] = useState('')
  const [serviceFeeMonthly, setServiceFeeMonthly] = useState('')
  const [minimumLeaseMonths, setMinimumLeaseMonths] = useState('')
  const [priceOnRequest, setPriceOnRequest] = useState(false)
  const [priceNegotiable, setPriceNegotiable] = useState(false)
  const [currency, setCurrency] = useState<AppCurrency>('THB')
  const [contactRoleCode, setContactRoleCode] = useState<ContactRoleCode>('')
  const [contactAuthorityCode, setContactAuthorityCode] = useState<ContactAuthorityCode>('')
  const [contactOrganizationName, setContactOrganizationName] = useState('')
  const [contactOrganizationRegistrationNo, setContactOrganizationRegistrationNo] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactPhoneSecondary, setContactPhoneSecondary] = useState('')
  const [lineId, setLineId] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [photos, setPhotos] = useState<File[]>(() => pendingMedia.photos)
  const [videos, setVideos] = useState<File[]>(() => pendingMedia.videos)
  const [panoramas, setPanoramas] = useState<File[]>(() => pendingMedia.panoramas)
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([])
  const [uploadedPanoramaUrls, setUploadedPanoramaUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [publishValidationError, setPublishValidationError] = useState('')
  const uploadLockRef = useRef(false)
  const initialPreferredCurrencyRef = useRef(preferredCurrency)

  useEffect(() => {
    router.prefetch('/add-listing/4')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedOffers = readValues(savedDraft['offerTypes[]']).filter(isOfferTypeCode)
      const normalizedOffers = savedOffers.length ? savedOffers : offersFromLegacy(readText(savedDraft.listing_type))
      setDraft(savedDraft)
      setOffers(normalizedOffers)
      setSalePrice(formatPriceInput(readText(savedDraft.salePrice)))
      setRentPriceMonthly(formatPriceInput(readText(savedDraft.rentPriceMonthly)))
      setRentPriceDaily(formatPriceInput(readText(savedDraft.rentPriceDaily)))
      setTemporarySpacePrice(formatPriceInput(readText(savedDraft.temporarySpacePrice)))
      setTemporarySpaceDurationDays(readText(savedDraft.temporarySpaceDurationDays))
      setKeyMoneyAmount(formatPriceInput(readText(savedDraft.keyMoneyAmount)))
      setServiceFeeMonthly(formatPriceInput(readText(savedDraft.serviceFeeMonthly)))
      setMinimumLeaseMonths(readText(savedDraft.minimumLeaseMonths))
      const savedPriceOnRequest = readText(savedDraft.priceOnRequest) === 'yes'
      const savedCurrency = readText(savedDraft.currency)
      const contactOrganizerOnly = normalizedOffers.includes('contact_organizer')
      const savedHasEventBooth = [
        readText(savedDraft.space_type_code),
        ...readValues(savedDraft['spaceTypeCodes[]']),
      ].includes('event_booth')
      setPriceOnRequest(savedPriceOnRequest || contactOrganizerOnly)
      setPriceNegotiable(
        !contactOrganizerOnly &&
          (!savedPriceOnRequest || savedHasEventBooth) &&
          readText(savedDraft.priceNegotiable) === 'yes'
      )
      setCurrency(
        savedCurrency === 'THB' || savedCurrency === 'USD' ? savedCurrency : initialPreferredCurrencyRef.current
      )
      setContactRoleCode(asContactRoleCode(readText(savedDraft.contactRoleCode)))
      setContactAuthorityCode(asContactAuthorityCode(readText(savedDraft.contactAuthorityCode)))
      setContactOrganizationName(readText(savedDraft.contactOrganizationName))
      setContactOrganizationRegistrationNo(readText(savedDraft.contactOrganizationRegistrationNo))
      const storedUser = getStoredUser()
      const accountName = [storedUser?.name, storedUser?.surname].filter(Boolean).join(' ').trim()
      setContactName(readText(savedDraft.contactName) || accountName)
      setContactPhone(readText(savedDraft.contactPhone))
      setContactPhoneSecondary(readText(savedDraft.contactPhoneSecondary))
      setLineId(readText(savedDraft.lineId))
      setInstagramHandle(readText(savedDraft.instagramHandle))
      setContactEmail(readText(savedDraft.contactEmail) || storedUser?.email || '')
      setUploadedPhotoUrls(readValues(savedDraft['listingPhotoUrls[]']))
      setUploadedVideoUrls(readValues(savedDraft['listingVideoUrls[]']))
      setUploadedPanoramaUrls(readValues(savedDraft['listingPanoramaUrls[]']))

      void loadListingContactProfile()
        .then((profile) => {
          if (!profile) return
          setContactRoleCode((current) => current || asContactRoleCode(profile.role_code))
          setContactAuthorityCode((current) => current || asContactAuthorityCode(profile.authority_source_code))
          setContactOrganizationName((current) => current || profile.organization_name)
          setContactOrganizationRegistrationNo((current) => current || profile.organization_registration_no)
          setContactName((current) => current || profile.contact_name || accountName)
          setContactPhone((current) => current || profile.contact_phone)
          setContactPhoneSecondary((current) => current || profile.contact_phone_secondary)
          setLineId((current) => current || profile.line_id)
          setInstagramHandle((current) => current || profile.instagram_handle)
          setContactEmail((current) => current || profile.contact_email || storedUser?.email || '')
        })
        .catch(() => undefined)
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  useEffect(() => {
    if (!draft) return
    const validationIssue = consumeListingPublishValidationIssue()
    if (!validationIssue || validationIssue.step !== 3) return

    const message = listingValidationMessage(validationIssue, locale)
    const frame = window.requestAnimationFrame(() => {
      setPublishValidationError(message)
      const shown = validationIssue.fieldName
        ? showListingFieldError({ fieldName: validationIssue.fieldName, message, isThai })
        : false
      if (shown) return

      const form = document.getElementById('add-listing-form')
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [draft, isThai, locale])

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
    const frame = requestAnimationFrame(() => {
      setMediaProgress({
        ...initialListingMediaProgress,
        pendingCount: photos.length + videos.length + panoramas.length,
        uploadedCount: uploadedPhotoUrls.length + uploadedVideoUrls.length + uploadedPanoramaUrls.length,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [
    panoramas.length,
    photos.length,
    setMediaProgress,
    uploadedPanoramaUrls.length,
    uploadedPhotoUrls.length,
    uploadedVideoUrls.length,
    videos.length,
  ])

  useEffect(() => {
    setPendingMedia({ photos, videos, panoramas })
  }, [panoramas, photos, setPendingMedia, videos])

  const hasSale = offers.includes('sale')
  const hasRent = offers.includes('rent') || offers.includes('sublease')
  const hasTransfer = offers.includes('business_transfer')
  const hasContactOrganizer = offers.includes('contact_organizer')
  const isTemporarySpace = [readText(draft?.space_type_code), ...readValues(draft?.['spaceTypeCodes[]'])].includes(
    'event_booth'
  )
  const effectivePriceOnRequest = hasContactOrganizer || (!isTemporarySpace && priceOnRequest)
  const isMonthlyHotel = readText(draft?.property_type_code) === 'monthly_hotel'
  const listingSummary = useMemo(() => (draft ? getListingDraftSummary(locale) : null), [draft, locale])
  const firstStepSummary = listingSummary
    ? [listingSummary.discoveryChannel, listingSummary.propertyType, listingSummary.businessSpaceType]
        .filter(Boolean)
        .join(' · ')
    : ''
  const secondStepSummary = draft ? buildSecondStepSummary(draft, listingSummary?.location || '', isThai) : ''

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'))
    setPhotos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_PHOTOS - uploadedPhotoUrls.length)))
    event.target.value = ''
  }

  const handleVideos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) =>
      ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)
    )
    setVideos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_VIDEOS - uploadedVideoUrls.length)))
    event.target.value = ''
  }

  const handlePanoramas = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'))
    setPanoramas((current) =>
      appendUniqueFiles(current, selected, Math.max(0, MAX_PANORAMAS - uploadedPanoramaUrls.length))
    )
    event.target.value = ''
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
    setPublishValidationError('')

    if (effectivePriceOnRequest || !hasSale) formData.set('salePrice', '')
    if (effectivePriceOnRequest || isTemporarySpace || (!hasRent && !hasTransfer)) formData.set('rentPriceMonthly', '')
    if (effectivePriceOnRequest || !isMonthlyHotel) formData.set('rentPriceDaily', '')
    if (effectivePriceOnRequest || !hasTransfer) formData.set('keyMoneyAmount', '')
    formData.set('eventBookingPrice', '')
    if (effectivePriceOnRequest || !isTemporarySpace || !hasRent) {
      formData.set('temporarySpacePrice', '')
      formData.set('temporarySpaceDurationDays', '')
    }
    if (effectivePriceOnRequest || (!hasRent && !hasTransfer)) formData.set('serviceFeeMonthly', '')
    if (!hasRent && !hasTransfer) formData.set('minimumLeaseMonths', '')
    formData.set('priceOnRequest', effectivePriceOnRequest ? 'yes' : '')
    formData.set('priceNegotiable', !effectivePriceOnRequest && priceNegotiable ? 'yes' : '')
    formData.set('currency', currency)
    formData.set('contactRoleCode', contactRoleCode)
    formData.set('contactAuthorityCode', contactRoleCode === 'owner' ? 'self' : contactAuthorityCode)
    formData.set('contactOrganizationName', contactOrganizationName.trim())
    formData.set(
      'contactOrganizationRegistrationNo',
      contactOrganizationName.trim() ? contactOrganizationRegistrationNo.trim() : ''
    )
    formData.set('contactName', contactName.trim())
    formData.set('contactPhone', contactPhone.trim())
    formData.set('contactPhoneSecondary', contactPhoneSecondary.trim())
    formData.set('lineId', lineId.trim())
    formData.set('instagramHandle', instagramHandle.trim())
    formData.set('contactEmail', contactEmail.trim())
    formData.set('selectedPhotoCount', String(uploadedPhotoUrls.length + photos.length))
    formData.set('selectedVideoCount', String(uploadedVideoUrls.length + videos.length))
    formData.set('selectedPanoramaCount', String(uploadedPanoramaUrls.length + panoramas.length))
    replaceFormDataValues(formData, 'listingPhotoUrls[]', uploadedPhotoUrls)
    replaceFormDataValues(formData, 'listingVideoUrls[]', uploadedVideoUrls)
    replaceFormDataValues(formData, 'listingPanoramaUrls[]', uploadedPanoramaUrls)
    formData.set('submissionKey', readText(draft?.submissionKey) || createListingSubmissionKey())

    // Save the current page before the final gate so validation always sees a
    // single fresh snapshot covering steps 1-3. No upload or API write starts
    // until this complete-draft check passes.
    const validationDraft = saveListingStep(3, formData, { resumeStep: 3 })
    const validationIssue = validateListingDraftForPublish(validationDraft)
    if (validationIssue) {
      const message = listingValidationMessage(validationIssue, locale)
      if (validationIssue.step < 3) {
        storeListingPublishValidationIssue(validationIssue)
        router.push(`/add-listing/${validationIssue.step}`)
        return
      }

      setPublishValidationError(message)
      validateListingForm({ isThai })
      if (validationIssue.fieldName) {
        showListingFieldError({ fieldName: validationIssue.fieldName, message, isThai })
      }
      return
    }
    if (!validateListingForm({ isThai })) return

    uploadLockRef.current = true
    setIsUploading(true)
    const pendingMediaTotal = photos.length + videos.length + panoramas.length

    setMediaProgress({
      phase: 'saving',
      pendingCount: pendingMediaTotal,
      uploadedCount: uploadedPhotoUrls.length + uploadedVideoUrls.length + uploadedPanoramaUrls.length,
      completedCount: 0,
      totalCount: pendingMediaTotal,
      currentFileName: '',
    })

    saveListingStep(3, formData)
    setPendingMedia({ photos, videos, panoramas })
    sessionStorage.removeItem(LISTING_SUBMISSION_RESULT_KEY)
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
          {isThai ? 'เพิ่มข้อมูลสุดท้ายก่อนลงประกาศ' : 'Add the final details before publishing'}
        </h1>
      </div>

      <section
        aria-label={isThai ? 'สรุปข้อมูลจากขั้นที่ 1 และ 2' : 'Summary from steps 1 and 2'}
        className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <SummaryRow
          icon={<HomeModernIcon className="size-5" />}
          text={firstStepSummary || (isThai ? 'ยังไม่ได้เลือกประเภททรัพย์' : 'Property type not selected')}
        />
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <SummaryRow
            icon={<MapPinIcon className="size-5" />}
            text={secondStepSummary || (isThai ? 'ยังไม่ได้ระบุรายละเอียดและทำเล' : 'Details and location not added')}
          />
        </div>
      </section>

      {publishValidationError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 font-sarabun text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          <ExclamationCircleIcon className="mt-0.5 size-5 shrink-0" />
          <span>{publishValidationError}</span>
        </div>
      ) : null}

      <Form
        id="add-listing-form"
        action={handleSubmitForm}
        noValidate
        aria-busy={isUploading}
        className="space-y-6"
        onInput={() => {
          if (publishValidationError) setPublishValidationError('')
        }}
      >
        <PricingPanel
          isThai={isThai}
          offers={offers}
          currency={currency}
          onCurrencyChange={setCurrency}
          priceOnRequest={effectivePriceOnRequest}
          onPriceOnRequestChange={(value) => {
            setPriceOnRequest(value)
            if (value) setPriceNegotiable(false)
          }}
          priceNegotiable={priceNegotiable}
          onPriceNegotiableChange={setPriceNegotiable}
          hasSale={hasSale}
          hasRent={hasRent}
          hasTransfer={hasTransfer}
          hasContactOrganizer={hasContactOrganizer}
          isTemporarySpace={isTemporarySpace}
          isMonthlyHotel={isMonthlyHotel}
          salePrice={salePrice}
          onSalePriceChange={setSalePrice}
          rentPriceMonthly={rentPriceMonthly}
          onRentPriceMonthlyChange={setRentPriceMonthly}
          rentPriceDaily={rentPriceDaily}
          onRentPriceDailyChange={setRentPriceDaily}
          temporarySpacePrice={temporarySpacePrice}
          onTemporarySpacePriceChange={setTemporarySpacePrice}
          temporarySpaceDurationDays={temporarySpaceDurationDays}
          onTemporarySpaceDurationDaysChange={setTemporarySpaceDurationDays}
          keyMoneyAmount={keyMoneyAmount}
          onKeyMoneyAmountChange={setKeyMoneyAmount}
          serviceFeeMonthly={serviceFeeMonthly}
          onServiceFeeMonthlyChange={setServiceFeeMonthly}
          minimumLeaseMonths={minimumLeaseMonths}
          onMinimumLeaseMonthsChange={setMinimumLeaseMonths}
        />

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
          title={isThai ? 'วิดีโอของทรัพย์ (ถ้ามี)' : 'Property videos (if any)'}
        >
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
            <div className="mt-4 grid grid-cols-2 gap-3 min-[744px]:grid-cols-4">
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
                    className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-md ring-1 ring-black/10 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={isThai ? `ลบวิดีโอที่ ${index + 1}` : `Remove video ${index + 1}`}
                  >
                    <XMarkIcon className="size-4" />
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
              <div className="mt-4 grid grid-cols-2 gap-3 min-[744px]:grid-cols-4">
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
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <IdentificationIcon className="size-5" />
              </span>
              <div>
                <h3 className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'คุณติดต่อในฐานะใคร' : 'Who are you representing?'}
                </h3>
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
                    ? 'เลขทะเบียนนิติบุคคล (ถ้ามี · ไม่แสดงสาธารณะ)'
                    : 'Company registration no. (if any · private)'
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
          </div>

          <div className="mt-6 grid gap-5 border-t border-neutral-100 pt-6 sm:grid-cols-2 dark:border-neutral-800">
            <FormItem label={isThai ? 'ชื่อผู้ติดต่อ' : 'Contact name'}>
              <Input
                name="contactName"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                autoComplete="name"
                placeholder={isThai ? 'ชื่อเจ้าของหรือผู้ดูแล' : 'Owner or property manager'}
                required
              />
            </FormItem>
            <FormItem label={isThai ? 'เบอร์โทรศัพท์' : 'Phone number'}>
              <Input
                name="contactPhone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="08x-xxx-xxxx"
                required
              />
            </FormItem>
            <FormItem label={isThai ? 'เบอร์โทรสำรอง (ถ้ามี)' : 'Backup phone (if any)'}>
              <Input
                name="contactPhoneSecondary"
                value={contactPhoneSecondary}
                onChange={(event) => setContactPhoneSecondary(event.target.value)}
                inputMode="tel"
                placeholder="08x-xxx-xxxx"
              />
            </FormItem>
            <FormItem label={isThai ? 'LINE ID (ถ้ามี)' : 'LINE ID (if any)'}>
              <Input
                name="lineId"
                value={lineId}
                onChange={(event) => setLineId(event.target.value)}
                placeholder="Line ID"
              />
            </FormItem>
            <FormItem label={isThai ? 'Instagram (ถ้ามี)' : 'Instagram (if any)'}>
              <Input
                name="instagramHandle"
                value={instagramHandle}
                onChange={(event) => setInstagramHandle(event.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="@username"
              />
            </FormItem>
            <FormItem label={isThai ? 'อีเมล (ถ้ามี)' : 'Email (if any)'}>
              <Input
                name="contactEmail"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                type="email"
                autoComplete="email"
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
    <div className="flex items-center gap-3">
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

const SummaryRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:text-emerald-300 dark:ring-neutral-700">
      {icon}
    </span>
    <p className="min-w-0 font-sarabun text-sm leading-6 font-semibold text-neutral-900 dark:text-neutral-100">
      {text}
    </p>
  </div>
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
  hasContactOrganizer: boolean
  isTemporarySpace: boolean
  isMonthlyHotel: boolean
  salePrice: string
  onSalePriceChange: (value: string) => void
  rentPriceMonthly: string
  onRentPriceMonthlyChange: (value: string) => void
  rentPriceDaily: string
  onRentPriceDailyChange: (value: string) => void
  temporarySpacePrice: string
  onTemporarySpacePriceChange: (value: string) => void
  temporarySpaceDurationDays: string
  onTemporarySpaceDurationDaysChange: (value: string) => void
  keyMoneyAmount: string
  onKeyMoneyAmountChange: (value: string) => void
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
  hasContactOrganizer,
  isTemporarySpace,
  isMonthlyHotel,
  salePrice,
  onSalePriceChange,
  rentPriceMonthly,
  onRentPriceMonthlyChange,
  rentPriceDaily,
  onRentPriceDailyChange,
  temporarySpacePrice,
  onTemporarySpacePriceChange,
  temporarySpaceDurationDays,
  onTemporarySpaceDurationDaysChange,
  keyMoneyAmount,
  onKeyMoneyAmountChange,
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
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-white to-white px-5 py-4 sm:px-7 sm:py-5 dark:border-orange-950 dark:from-orange-950/35 dark:via-neutral-900 dark:to-neutral-900">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
            <BanknotesIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-sarabun text-xl font-semibold text-neutral-950 dark:text-white">
              {isThai ? 'ราคาและเงื่อนไข' : 'Price & terms'}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
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
        {!hasContactOrganizer ? (
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {isThai ? 'สกุลเงินของประกาศ' : 'Listing currency'}
                </h3>
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
        ) : null}

        {!hasContactOrganizer && !isTemporarySpace ? (
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
        ) : null}

        {hasContactOrganizer ? (
          <div className="flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/30">
            <ChatBubbleLeftRightIcon className="mt-0.5 size-6 shrink-0 text-orange-600" />
            <div className="font-sarabun">
              <p className="font-semibold text-orange-950 dark:text-orange-100">
                {isThai ? 'ติดต่อผู้จัดงานเพื่อสอบถามราคา' : 'Contact the organizer for pricing'}
              </p>
              <p className="mt-1 text-sm leading-6 text-orange-800 dark:text-orange-200">
                {isThai
                  ? 'พื้นที่ชั่วคราวจะไม่เก็บหรือแสดงราคาเช่า ผู้สนใจจะติดต่อคุณหรือผู้จัดงานโดยตรง'
                  : 'Temporary-space listings do not store or display a rental price. Interested customers contact you or the organizer directly.'}
              </p>
            </div>
          </div>
        ) : priceOnRequest ? (
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
              <PricingGroup icon={<BanknotesIcon className="size-5" />} title={isThai ? 'ราคาขาย' : 'Sale price'}>
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
                  isTemporarySpace
                    ? offers.includes('sublease')
                      ? isThai
                        ? 'ค่าเช่าช่วงพื้นที่ชั่วคราว'
                        : 'Temporary-space sublease'
                      : isThai
                        ? 'ค่าเช่าพื้นที่ชั่วคราว'
                        : 'Temporary-space rent'
                    : offers.includes('sublease')
                      ? isThai
                        ? 'ค่าเช่าช่วง'
                        : 'Sublease price'
                      : isThai
                        ? 'ค่าเช่า'
                        : 'Rental price'
                }
              >
                {isTemporarySpace ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormItem label={isThai ? 'ค่าเช่าตายตัว' : 'Fixed rental price'}>
                      <PriceInput
                        name="temporarySpacePrice"
                        value={temporarySpacePrice}
                        onChange={onTemporarySpacePriceChange}
                        suffix={currencyUnit}
                        symbol={symbol}
                        placeholder={currency === 'THB' ? '5,000' : '150'}
                        required
                      />
                    </FormItem>
                    <FormItem label={isThai ? 'ระยะเวลาที่ได้รับ (วัน)' : 'Included duration (days)'}>
                      <Input
                        name="temporarySpaceDurationDays"
                        value={temporarySpaceDurationDays}
                        onChange={(event) => onTemporarySpaceDurationDaysChange(event.target.value)}
                        inputMode="numeric"
                        pattern="[1-9][0-9]*"
                        placeholder="3"
                        className="h-12 rounded-2xl"
                        required
                      />
                    </FormItem>
                    <p className="font-sarabun text-xs leading-5 text-neutral-500 sm:col-span-2 dark:text-neutral-400">
                      {isThai ? 'ตัวอย่าง: 5,000 บาท สำหรับ 3 วัน' : 'Example: 5,000 THB for 3 days.'}
                    </p>
                  </div>
                ) : (
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
                      <FormItem label={isThai ? 'ราคารายวัน (ถ้ามี)' : 'Daily rate (if any)'}>
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
                    <FormItem label={isThai ? 'ค่าส่วนกลางต่อเดือน (ถ้ามี)' : 'Monthly service fee (if any)'}>
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
                )}
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
                  {!hasRent && !isTemporarySpace ? (
                    <>
                      <FormItem label={isThai ? 'ค่าเช่าที่ต้องจ่ายต่อเดือน (ถ้ามี)' : 'Ongoing monthly rent (if any)'}>
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
                      <FormItem label={isThai ? 'ค่าส่วนกลางต่อเดือน (ถ้ามี)' : 'Monthly service fee (if any)'}>
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
          </div>
        )}

        {!hasContactOrganizer ? (
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
        ) : null}
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
  description?: string
  children: React.ReactNode
}) => (
  <section className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-950/60">
    <div className={`mb-5 flex gap-3 ${description ? 'items-start' : 'items-center'}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
        {icon}
      </span>
      <div>
        <h3 className="font-sarabun text-base font-semibold text-neutral-950 dark:text-white">{title}</h3>
        {description ? (
          <p className="mt-0.5 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">{description}</p>
        ) : null}
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

const buildSecondStepSummary = (draft: ListingDraft, location: string, isThai: boolean) => {
  const landArea = readText(draft.landAreaSqm)
  const usableArea = readText(draft.usableAreaSqm || draft.acreage)
  const bedrooms = readText(draft.Bedroom)
  const bathrooms = readText(draft.Bathroom)
  const parking = readText(draft.Parking)
  const floor = readText(draft.floorNo)
  const facts = [
    readText(draft.placeName),
    location,
    landArea
      ? `${isThai ? 'ที่ดิน' : 'Land'} ${formatSummaryNumber(landArea, isThai)} ${isThai ? 'ตร.ม.' : 'sq.m.'}`
      : usableArea
        ? `${isThai ? 'พื้นที่ใช้สอย' : 'Usable area'} ${formatSummaryNumber(usableArea, isThai)} ${isThai ? 'ตร.ม.' : 'sq.m.'}`
        : '',
    bedrooms ? `${formatSummaryNumber(bedrooms, isThai)} ${isThai ? 'ห้องนอน' : 'bedrooms'}` : '',
    bathrooms ? `${formatSummaryNumber(bathrooms, isThai)} ${isThai ? 'ห้องน้ำ' : 'bathrooms'}` : '',
    parking ? `${formatSummaryNumber(parking, isThai)} ${isThai ? 'ที่จอดรถ' : 'parking spaces'}` : '',
    floor ? `${isThai ? 'ชั้น' : 'Floor'} ${formatSummaryNumber(floor, isThai)}` : '',
  ]

  return facts.filter((value, index, all) => Boolean(value) && all.indexOf(value) === index).join(' · ')
}

const formatSummaryNumber = (value: string, isThai: boolean) => {
  const parsed = Number(value.replaceAll(',', ''))
  return Number.isFinite(parsed)
    ? parsed.toLocaleString(isThai ? 'th-TH' : 'en-US', { maximumFractionDigits: 2 })
    : value
}

const readText = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraftValue | undefined) => (value ? (Array.isArray(value) ? value : [value]) : [])
const resolveListingMediaUrl = (value: string) => (value.startsWith('/') ? `${getApiBaseUrl()}${value}` : value)
const isOfferTypeCode = (value: string): value is OfferTypeCode =>
  ['sale', 'rent', 'sublease', 'business_transfer', 'contact_organizer'].includes(value)
const offersFromLegacy = (value: string): OfferTypeCode[] => {
  if (value === 'sale_and_rent') return ['sale', 'rent']
  if (value === 'event_booking') return ['contact_organizer']
  return isOfferTypeCode(value) ? [value] : ['rent']
}
export default Page
