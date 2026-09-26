'use client'

import { useListingStepAnalytics } from '@/hooks/useListingStepAnalytics'

import EventDetailsPanel, { type EventRoundDraft } from '@/components/add-listing/EventDetailsPanel'
import {
  initialListingMediaProgress,
  useListingFlowProgress,
} from '@/components/add-listing/ListingFlowProgressContext'
import ListingMediaGrid from '@/components/add-listing/ListingMediaGrid'
import ListingMediaUpload from '@/components/add-listing/ListingMediaUpload'
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
import { listingMediaFileIssue } from '@/lib/listingMediaFormats'
import {
  listingMediaFileToken,
  listingMediaURLFromToken,
  listingMediaURLsFromOrder,
  moveListingMedia,
  normalizeListingMediaOrder,
} from '@/lib/listingMediaOrder'
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
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import FormItem from '../FormItem'

const MAX_PHOTOS = 10
const MAX_VIDEOS = 4
const MAX_PANORAMAS = 4

type RetailPriceUnit = 'day' | 'week' | 'month' | 'event_period'

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
  useListingStepAnalytics(3, Boolean(draft))
  const [offers, setOffers] = useState<OfferTypeCode[]>(['rent'])
  const [salePrice, setSalePrice] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [rentPriceDaily, setRentPriceDaily] = useState('')
  const [temporarySpacePrice, setTemporarySpacePrice] = useState('')
  const [temporarySpacePriceUnit, setTemporarySpacePriceUnit] = useState<RetailPriceUnit>('month')
  const [depositAmount, setDepositAmount] = useState('')
  const [advanceRentAmount, setAdvanceRentAmount] = useState('')
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
  const contactNameEdited = useRef(false)
  const contactEmailEdited = useRef(false)
  const [contactPhone, setContactPhone] = useState('')
  const [contactPhoneSecondary, setContactPhoneSecondary] = useState('')
  const [lineId, setLineId] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventVenueName, setEventVenueName] = useState('')
  const [eventVenueFloor, setEventVenueFloor] = useState('')
  const [eventRounds, setEventRounds] = useState<EventRoundDraft[]>([{ id: 'event-round-0', startsOn: '', endsOn: '' }])
  const [photos, setPhotos] = useState<File[]>(() => pendingMedia.photos)
  const [videos, setVideos] = useState<File[]>(() => pendingMedia.videos)
  const [panoramas, setPanoramas] = useState<File[]>(() => pendingMedia.panoramas)
  const [floorPlans, setFloorPlans] = useState<File[]>(() => pendingMedia.floorPlans)
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
  const [photoOrder, setPhotoOrder] = useState<string[]>([])
  const [videoOrder, setVideoOrder] = useState<string[]>([])
  const [panoramaOrder, setPanoramaOrder] = useState<string[]>([])
  const [uploadedVideoUrls, setUploadedVideoUrls] = useState<string[]>([])
  const [uploadedPanoramaUrls, setUploadedPanoramaUrls] = useState<string[]>([])
  const [uploadedFloorPlanUrl, setUploadedFloorPlanUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [mediaSelectionErrors, setMediaSelectionErrors] = useState<Partial<Record<'image' | 'video' | '360', string>>>(
    {}
  )
  const [publishValidationError, setPublishValidationError] = useState('')
  const uploadLockRef = useRef(false)
  const initialPreferredCurrencyRef = useRef(preferredCurrency)

  useEffect(() => {
    router.prefetch('/add-listing/4')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedOfferValues = readValues(savedDraft['offerTypes[]'])
      const savedOffers = savedOfferValues.filter(isOfferTypeCode)
      const normalizedOffers = savedOffers.length ? savedOffers : offersFromLegacy(readText(savedDraft.listing_type))
      const legacyContactOrganizer =
        savedOfferValues.includes('contact_organizer') || readText(savedDraft.listing_type) === 'contact_organizer'
      setDraft(savedDraft)
      setOffers(normalizedOffers)
      setSalePrice(formatPriceInput(readText(savedDraft.salePrice)))
      setRentPriceMonthly(formatPriceInput(readText(savedDraft.rentPriceMonthly)))
      setRentPriceDaily(formatPriceInput(readText(savedDraft.rentPriceDaily)))
      const savedSpaceTypes = [readText(savedDraft.space_type_code), ...readValues(savedDraft['spaceTypeCodes[]'])]
      const savedIsTemporarySpace = savedSpaceTypes.includes('event_booth')
      const savedRetailPriceUnit = readText(savedDraft.retailPriceUnit) || readText(savedDraft.price_unit)
      const allowedRetailPriceUnits: RetailPriceUnit[] = savedIsTemporarySpace
        ? ['day', 'week', 'month', 'event_period']
        : ['day', 'week', 'month']
      setTemporarySpacePrice(
        formatPriceInput(
          readText(savedDraft.retailRentPrice) ||
            readText(savedDraft.temporarySpacePrice) ||
            readText(savedDraft.rentPriceMonthly)
        )
      )
      setTemporarySpacePriceUnit(
        allowedRetailPriceUnits.includes(savedRetailPriceUnit as RetailPriceUnit)
          ? (savedRetailPriceUnit as RetailPriceUnit)
          : savedIsTemporarySpace
            ? 'event_period'
            : 'month'
      )
      setDepositAmount(formatPriceInput(readText(savedDraft.depositAmount)))
      setAdvanceRentAmount(formatPriceInput(readText(savedDraft.advanceRentAmount)))
      setKeyMoneyAmount(formatPriceInput(readText(savedDraft.keyMoneyAmount)))
      setServiceFeeMonthly(formatPriceInput(readText(savedDraft.serviceFeeMonthly)))
      setMinimumLeaseMonths(readText(savedDraft.minimumLeaseMonths))
      const savedPriceOnRequest = readText(savedDraft.priceOnRequest) === 'yes'
      const savedCurrency = readText(savedDraft.currency)
      setPriceOnRequest(savedPriceOnRequest || legacyContactOrganizer)
      setPriceNegotiable(
        !savedPriceOnRequest && !legacyContactOrganizer && readText(savedDraft.priceNegotiable) === 'yes'
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
      setContactName('contactName' in savedDraft ? readText(savedDraft.contactName) : accountName)
      setContactPhone(readText(savedDraft.contactPhone))
      setContactPhoneSecondary(readText(savedDraft.contactPhoneSecondary))
      setLineId(readText(savedDraft.lineId))
      setInstagramHandle(readText(savedDraft.instagramHandle))
      setContactEmail('contactEmail' in savedDraft ? readText(savedDraft.contactEmail) : storedUser?.email || '')
      setEventName(readText(savedDraft.eventName))
      setEventVenueName(readText(savedDraft.eventVenueName) || readText(savedDraft.placeName))
      setEventVenueFloor(readText(savedDraft.eventVenueFloor))
      const savedRoundStarts = readValues(savedDraft['eventRoundStarts[]'])
      const savedRoundEnds = readValues(savedDraft['eventRoundEnds[]'])
      const savedRoundCount = Math.max(savedRoundStarts.length, savedRoundEnds.length)
      setEventRounds(
        savedRoundCount
          ? Array.from({ length: savedRoundCount }, (_, index) => ({
              id: `event-round-loaded-${index}`,
              startsOn: savedRoundStarts[index] || '',
              endsOn: savedRoundEnds[index] || '',
            }))
          : [{ id: 'event-round-0', startsOn: '', endsOn: '' }]
      )
      setUploadedPhotoUrls(readValues(savedDraft['listingPhotoUrls[]']))
      setPhotoOrder(readValues(savedDraft['listingPhotoOrder[]']))
      setVideoOrder(readValues(savedDraft['listingVideoOrder[]']))
      setPanoramaOrder(readValues(savedDraft['listingPanoramaOrder[]']))
      setUploadedVideoUrls(readValues(savedDraft['listingVideoUrls[]']))
      setUploadedPanoramaUrls(readValues(savedDraft['listingPanoramaUrls[]']))
      setUploadedFloorPlanUrl(readText(savedDraft.eventFloorPlanUrl))

      void loadListingContactProfile()
        .then((profile) => {
          if (!profile) return
          setContactRoleCode((current) => current || asContactRoleCode(profile.role_code))
          setContactAuthorityCode((current) => current || asContactAuthorityCode(profile.authority_source_code))
          setContactOrganizationName((current) => current || profile.organization_name)
          setContactOrganizationRegistrationNo((current) => current || profile.organization_registration_no)
          setContactName((current) =>
            'contactName' in savedDraft || contactNameEdited.current ? current : profile.contact_name || accountName
          )
          setContactPhone((current) => current || profile.contact_phone)
          setContactPhoneSecondary((current) => current || profile.contact_phone_secondary)
          setLineId((current) => current || profile.line_id)
          setInstagramHandle((current) => current || profile.instagram_handle)
          setContactEmail((current) =>
            'contactEmail' in savedDraft || contactEmailEdited.current ? current : profile.contact_email
          )
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

  const hasSale = offers.includes('sale')
  const hasRent = offers.includes('rent') || offers.includes('sublease')
  const hasTransfer = offers.includes('business_transfer')
  const isRetailSpace = readText(draft?.property_type_code) === 'retail_space'
  const isTemporarySpace = [readText(draft?.space_type_code), ...readValues(draft?.['spaceTypeCodes[]'])].includes(
    'event_booth'
  )
  const effectiveFloorPlans = useMemo(() => (isTemporarySpace ? floorPlans : []), [floorPlans, isTemporarySpace])
  const effectiveUploadedFloorPlanUrl = isTemporarySpace ? uploadedFloorPlanUrl : ''

  const previewUrls = useMemo(() => photos.map((photo) => URL.createObjectURL(photo)), [photos])
  const normalizedPhotoOrder = useMemo(
    () => normalizeListingMediaOrder(photoOrder, uploadedPhotoUrls, photos),
    [photoOrder, photos, uploadedPhotoUrls]
  )
  const orderedPhotoPreviews = useMemo(
    () =>
      normalizedPhotoOrder.flatMap((token) => {
        const uploadedURL = listingMediaURLFromToken(token)
        if (uploadedURL) return [{ token, url: resolveListingMediaUrl(uploadedURL) }]

        const pendingIndex = photos.findIndex((photo) => listingMediaFileToken(photo) === token)
        return pendingIndex >= 0 && previewUrls[pendingIndex]
          ? [{ token, url: previewUrls[pendingIndex], pending: true }]
          : []
      }),
    [normalizedPhotoOrder, photos, previewUrls]
  )
  const videoPreviewUrls = useMemo(() => videos.map((video) => URL.createObjectURL(video)), [videos])
  const panoramaPreviewUrls = useMemo(() => panoramas.map((panorama) => URL.createObjectURL(panorama)), [panoramas])
  const normalizedVideoOrder = useMemo(
    () => normalizeListingMediaOrder(videoOrder, uploadedVideoUrls, videos),
    [videoOrder, uploadedVideoUrls, videos]
  )
  const normalizedPanoramaOrder = useMemo(
    () => normalizeListingMediaOrder(panoramaOrder, uploadedPanoramaUrls, panoramas),
    [panoramaOrder, uploadedPanoramaUrls, panoramas]
  )
  const orderedVideoPreviews = mediaPreviews(normalizedVideoOrder, videos, videoPreviewUrls)
  const orderedPanoramaPreviews = mediaPreviews(normalizedPanoramaOrder, panoramas, panoramaPreviewUrls)
  const pendingFloorPlanPreviewUrl = useMemo(
    () => (isTemporarySpace && floorPlans[0] ? URL.createObjectURL(floorPlans[0]) : ''),
    [floorPlans, isTemporarySpace]
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

  useEffect(() => {
    return () => {
      if (pendingFloorPlanPreviewUrl) URL.revokeObjectURL(pendingFloorPlanPreviewUrl)
    }
  }, [pendingFloorPlanPreviewUrl])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMediaProgress({
        ...initialListingMediaProgress,
        pendingCount: photos.length + videos.length + panoramas.length + effectiveFloorPlans.length,
        uploadedCount:
          uploadedPhotoUrls.length +
          uploadedVideoUrls.length +
          uploadedPanoramaUrls.length +
          (effectiveUploadedFloorPlanUrl ? 1 : 0),
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [
    panoramas.length,
    photos.length,
    effectiveFloorPlans.length,
    setMediaProgress,
    effectiveUploadedFloorPlanUrl,
    uploadedPanoramaUrls.length,
    uploadedPhotoUrls.length,
    uploadedVideoUrls.length,
    videos.length,
  ])

  useEffect(() => {
    setPendingMedia({ photos, videos, panoramas, floorPlans: effectiveFloorPlans })
  }, [effectiveFloorPlans, panoramas, photos, setPendingMedia, videos])

  const effectivePriceOnRequest = priceOnRequest
  const isMonthlyHotel = readText(draft?.property_type_code) === 'monthly_hotel'
  const listingSummary = useMemo(() => (draft ? getListingDraftSummary(locale) : null), [draft, locale])
  const firstStepSummary = listingSummary
    ? [listingSummary.discoveryChannel, listingSummary.propertyType, listingSummary.businessSpaceType]
        .filter(Boolean)
        .join(' · ')
    : ''
  const secondStepSummary = draft ? buildSecondStepSummary(draft, listingSummary?.location || '', isThai) : ''

  const selectMediaFiles = (event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'video' | '360') => {
    const files = Array.from(event.target.files || [])
    const invalid = files.filter((file) => listingMediaFileIssue(file, kind))
    const first = invalid[0]
    const reason = first ? listingMediaFileIssue(first, kind) : null
    setMediaSelectionErrors((current) => ({
      ...current,
      [kind]: first
        ? isThai
          ? `${first.name}${invalid.length > 1 ? ` และอีก ${invalid.length - 1} ไฟล์` : ''}: ${reason === 'file_too_large' ? 'ไฟล์ว่างหรือใหญ่เกินขนาดที่รองรับ' : 'ยังไม่รองรับไฟล์ประเภทนี้'} เลือกไฟล์ใหม่ได้เลย`
          : `${first.name}${invalid.length > 1 ? ` and ${invalid.length - 1} more` : ''}: ${reason === 'file_too_large' ? 'empty or too large' : 'unsupported format'}. Choose another file.`
        : '',
    }))
    return files.filter((file) => !listingMediaFileIssue(file, kind))
  }

  const handlePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = selectMediaFiles(event, 'image')
    setPhotos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_PHOTOS - uploadedPhotoUrls.length)))
    event.target.value = ''
  }

  const handleVideos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = selectMediaFiles(event, 'video')
    setVideos((current) => appendUniqueFiles(current, selected, Math.max(0, MAX_VIDEOS - uploadedVideoUrls.length)))
    event.target.value = ''
  }

  const handlePanoramas = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = selectMediaFiles(event, '360')
    setPanoramas((current) =>
      appendUniqueFiles(current, selected, Math.max(0, MAX_PANORAMAS - uploadedPanoramaUrls.length))
    )
    event.target.value = ''
  }

  const handleFloorPlan = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).find((file) => file.type.startsWith('image/'))
    if (selected) {
      setFloorPlans([selected])
      setUploadedFloorPlanUrl('')
    }
    event.target.value = ''
  }

  const handleEventRoundChange = (id: string, field: 'startsOn' | 'endsOn', value: string) => {
    setEventRounds((current) => current.map((round) => (round.id === id ? { ...round, [field]: value } : round)))
  }

  const addEventRound = () => {
    setEventRounds((current) => [
      ...current,
      { id: `event-round-${Date.now()}-${current.length}`, startsOn: '', endsOn: '' },
    ])
  }

  const removeEventRound = (id: string) => {
    setEventRounds((current) => (current.length > 1 ? current.filter((round) => round.id !== id) : current))
  }

  const removePhoto = (index: number) => {
    const token = normalizedPhotoOrder[index]
    if (!token) return

    const uploadedURL = listingMediaURLFromToken(token)
    if (uploadedURL) {
      setUploadedPhotoUrls((current) => current.filter((url) => url !== uploadedURL))
    } else {
      setPhotos((current) => current.filter((photo) => listingMediaFileToken(photo) !== token))
    }
    setPhotoOrder((current) => current.filter((item) => item !== token))
  }

  const movePhotoTo = (fromIndex: number, toIndex: number) => {
    setPhotoOrder(moveListingMedia(normalizedPhotoOrder, fromIndex, toIndex))
  }

  const removeVideo = (index: number) => {
    const token = normalizedVideoOrder[index]
    if (!token) return
    const url = listingMediaURLFromToken(token)
    if (url) setUploadedVideoUrls((current) => current.filter((item) => item !== url))
    else setVideos((current) => current.filter((file) => listingMediaFileToken(file) !== token))
    setVideoOrder(normalizedVideoOrder.filter((item) => item !== token))
  }

  const removePanorama = (index: number) => {
    const token = normalizedPanoramaOrder[index]
    if (!token) return
    const url = listingMediaURLFromToken(token)
    if (url) setUploadedPanoramaUrls((current) => current.filter((item) => item !== url))
    else setPanoramas((current) => current.filter((file) => listingMediaFileToken(file) !== token))
    setPanoramaOrder(normalizedPanoramaOrder.filter((item) => item !== token))
  }

  const removeFloorPlan = () => {
    setFloorPlans([])
    setUploadedFloorPlanUrl('')
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (uploadLockRef.current) return
    setPublishValidationError('')

    if (effectivePriceOnRequest || !hasSale) formData.set('salePrice', '')
    if (effectivePriceOnRequest || isRetailSpace || (!hasRent && !hasTransfer)) formData.set('rentPriceMonthly', '')
    if (effectivePriceOnRequest || !isMonthlyHotel) formData.set('rentPriceDaily', '')
    if (effectivePriceOnRequest || !hasTransfer) formData.set('keyMoneyAmount', '')
    formData.set('eventBookingPrice', '')
    if (effectivePriceOnRequest || !isRetailSpace || !hasRent) {
      formData.set('retailRentPrice', '')
      formData.set('retailPriceUnit', '')
      formData.set('depositAmount', '')
      formData.set('advanceRentAmount', '')
      formData.set('temporarySpacePrice', '')
      formData.set('temporarySpacePriceUnit', '')
    } else {
      formData.set('retailPriceUnit', temporarySpacePriceUnit)
    }
    formData.set('temporarySpacePrice', '')
    formData.set('temporarySpacePriceUnit', '')
    formData.set('temporarySpaceDurationDays', '')
    if (effectivePriceOnRequest || (!hasRent && !hasTransfer)) formData.set('serviceFeeMonthly', '')
    if ((!hasRent && !hasTransfer) || (effectivePriceOnRequest && isRetailSpace)) {
      formData.set('minimumLeaseMonths', '')
    }
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
    if (isTemporarySpace) {
      formData.set('eventName', eventName.trim())
      formData.set('eventVenueName', eventVenueName.trim())
      formData.set('eventVenueFloor', eventVenueFloor.trim())
      replaceFormDataValues(
        formData,
        'eventRoundStarts[]',
        eventRounds.map((round) => round.startsOn)
      )
      replaceFormDataValues(
        formData,
        'eventRoundEnds[]',
        eventRounds.map((round) => round.endsOn)
      )
      formData.set('eventFloorPlanUrl', uploadedFloorPlanUrl)
      formData.set('selectedFloorPlanCount', floorPlans.length > 0 || uploadedFloorPlanUrl ? '1' : '0')
    } else {
      formData.set('eventName', '')
      formData.set('eventVenueName', '')
      formData.set('eventVenueFloor', '')
      replaceFormDataValues(formData, 'eventRoundStarts[]', [])
      replaceFormDataValues(formData, 'eventRoundEnds[]', [])
      formData.set('eventFloorPlanUrl', '')
      formData.set('selectedFloorPlanCount', '0')
    }
    formData.set('selectedPhotoCount', String(uploadedPhotoUrls.length + photos.length))
    formData.set('selectedVideoCount', String(uploadedVideoUrls.length + videos.length))
    formData.set('selectedPanoramaCount', String(uploadedPanoramaUrls.length + panoramas.length))
    replaceFormDataValues(formData, 'listingPhotoUrls[]', listingMediaURLsFromOrder(normalizedPhotoOrder))
    replaceFormDataValues(formData, 'listingPhotoOrder[]', normalizedPhotoOrder)
    replaceFormDataValues(formData, 'listingVideoUrls[]', listingMediaURLsFromOrder(normalizedVideoOrder))
    replaceFormDataValues(formData, 'listingVideoOrder[]', normalizedVideoOrder)
    replaceFormDataValues(formData, 'listingPanoramaUrls[]', listingMediaURLsFromOrder(normalizedPanoramaOrder))
    replaceFormDataValues(formData, 'listingPanoramaOrder[]', normalizedPanoramaOrder)
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
    const pendingMediaTotal = photos.length + videos.length + panoramas.length + effectiveFloorPlans.length

    setMediaProgress({
      phase: 'saving',
      pendingCount: pendingMediaTotal,
      uploadedCount: uploadedPhotoUrls.length + uploadedVideoUrls.length + uploadedPanoramaUrls.length,
      completedCount: 0,
      totalCount: pendingMediaTotal,
      currentFileName: '',
    })

    saveListingStep(3, formData)
    setPendingMedia({ photos, videos, panoramas, floorPlans: effectiveFloorPlans })
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
        {(
          [
            ['listingPhotoOrder[]', normalizedPhotoOrder],
            ['listingVideoOrder[]', normalizedVideoOrder],
            ['listingPanoramaOrder[]', normalizedPanoramaOrder],
            ['listingPhotoUrls[]', listingMediaURLsFromOrder(normalizedPhotoOrder)],
            ['listingVideoUrls[]', listingMediaURLsFromOrder(normalizedVideoOrder)],
            ['listingPanoramaUrls[]', listingMediaURLsFromOrder(normalizedPanoramaOrder)],
          ] as [string, string[]][]
        ).map(([name, values]) =>
          (values.length ? values : ['']).map((value, index) => (
            <input key={name + '-' + index} type="hidden" name={name} value={value} />
          ))
        )}
        <input type="hidden" name="selectedPhotoCount" value={photoCount} />
        <input type="hidden" name="selectedVideoCount" value={videoCount} />
        <input type="hidden" name="selectedPanoramaCount" value={panoramaCount} />
        {isTemporarySpace ? (
          <EventDetailsPanel
            isThai={isThai}
            eventName={eventName}
            onEventNameChange={setEventName}
            venueName={eventVenueName}
            onVenueNameChange={setEventVenueName}
            venueFloor={eventVenueFloor}
            onVenueFloorChange={setEventVenueFloor}
            rounds={eventRounds}
            onRoundChange={handleEventRoundChange}
            onAddRound={addEventRound}
            onRemoveRound={removeEventRound}
            floorPlanPreviewUrl={
              pendingFloorPlanPreviewUrl || (uploadedFloorPlanUrl ? resolveListingMediaUrl(uploadedFloorPlanUrl) : '')
            }
            floorPlanFileName={floorPlans[0]?.name || ''}
            onFloorPlanChange={handleFloorPlan}
            onRemoveFloorPlan={removeFloorPlan}
            disabled={isUploading}
          />
        ) : null}

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
          isRetailSpace={isRetailSpace}
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
          temporarySpacePriceUnit={temporarySpacePriceUnit}
          onTemporarySpacePriceUnitChange={setTemporarySpacePriceUnit}
          depositAmount={depositAmount}
          onDepositAmountChange={setDepositAmount}
          advanceRentAmount={advanceRentAmount}
          onAdvanceRentAmountChange={setAdvanceRentAmount}
          keyMoneyAmount={keyMoneyAmount}
          onKeyMoneyAmountChange={setKeyMoneyAmount}
          serviceFeeMonthly={serviceFeeMonthly}
          onServiceFeeMonthlyChange={setServiceFeeMonthly}
          minimumLeaseMonths={minimumLeaseMonths}
          onMinimumLeaseMonthsChange={setMinimumLeaseMonths}
        />

        <SectionCard icon={<PhotoIcon className="size-5" />} title={isThai ? 'รูปภาพของทรัพย์' : 'Property photos'}>
          <ListingMediaUpload
            kind="photo"
            count={photoCount}
            limit={MAX_PHOTOS}
            isThai={isThai}
            disabled={isUploading}
            onChange={handlePhotos}
            error={mediaSelectionErrors.image}
          />
          <ListingMediaGrid
            kind="photo"
            items={orderedPhotoPreviews}
            isThai={isThai}
            disabled={isUploading}
            publisherName={contactName}
            onMove={movePhotoTo}
            onRemove={removePhoto}
          />
        </SectionCard>

        <SectionCard
          icon={<VideoCameraIcon className="size-5" />}
          title={isThai ? 'วิดีโอของทรัพย์ (ถ้ามี)' : 'Property videos (if any)'}
        >
          <ListingMediaUpload
            kind="video"
            count={videoCount}
            limit={MAX_VIDEOS}
            isThai={isThai}
            disabled={isUploading}
            onChange={handleVideos}
            error={mediaSelectionErrors.video}
          />
          <ListingMediaGrid
            kind="video"
            items={orderedVideoPreviews}
            isThai={isThai}
            disabled={isUploading}
            onMove={(from, to) => setVideoOrder(moveListingMedia(normalizedVideoOrder, from, to))}
            onRemove={removeVideo}
          />
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
            <ListingMediaUpload
              kind="panorama"
              count={panoramaCount}
              limit={MAX_PANORAMAS}
              isThai={isThai}
              disabled={isUploading}
              onChange={handlePanoramas}
              error={mediaSelectionErrors['360']}
            />
            <ListingMediaGrid
              kind="panorama"
              items={orderedPanoramaPreviews}
              isThai={isThai}
              disabled={isUploading}
              onMove={(from, to) => setPanoramaOrder(moveListingMedia(normalizedPanoramaOrder, from, to))}
              onRemove={removePanorama}
            />
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
                onChange={(event) => {
                  contactNameEdited.current = true
                  setContactName(event.target.value)
                }}
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
                onChange={(event) => {
                  contactEmailEdited.current = true
                  setContactEmail(event.target.value)
                }}
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
    <div className="mt-4 sm:mt-6">{children}</div>
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
  isRetailSpace: boolean
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
  temporarySpacePriceUnit: RetailPriceUnit
  onTemporarySpacePriceUnitChange: (value: RetailPriceUnit) => void
  depositAmount: string
  onDepositAmountChange: (value: string) => void
  advanceRentAmount: string
  onAdvanceRentAmountChange: (value: string) => void
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
  isRetailSpace,
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
  temporarySpacePriceUnit,
  onTemporarySpacePriceUnitChange,
  depositAmount,
  onDepositAmountChange,
  advanceRentAmount,
  onAdvanceRentAmountChange,
  keyMoneyAmount,
  onKeyMoneyAmountChange,
  serviceFeeMonthly,
  onServiceFeeMonthlyChange,
  minimumLeaseMonths,
  onMinimumLeaseMonthsChange,
}: PricingPanelProps) => {
  const symbol = currency === 'USD' ? '$' : ''
  const currencyUnit = currency === 'USD' ? 'USD' : isThai ? 'บาท' : 'THB'
  const monthlyUnit = `${currencyUnit}/${isThai ? 'เดือน' : 'month'}`
  const retailPriceOptions: Array<{
    value: RetailPriceUnit
    titleTh: string
    titleEn: string
  }> = [
    {
      value: 'day',
      titleTh: 'รายวัน',
      titleEn: 'Daily',
    },
    {
      value: 'week',
      titleTh: 'รายสัปดาห์',
      titleEn: 'Weekly',
    },
    {
      value: 'month',
      titleTh: 'รายเดือน',
      titleEn: 'Monthly',
    },
    ...(isTemporarySpace
      ? [
          {
            value: 'event_period' as const,
            titleTh: 'รวมทั้งงาน',
            titleEn: 'Whole event',
          },
        ]
      : []),
  ]
  const retailUnitLabel =
    temporarySpacePriceUnit === 'day'
      ? isThai
        ? 'วัน'
        : 'day'
      : temporarySpacePriceUnit === 'week'
        ? isThai
          ? 'สัปดาห์'
          : 'week'
        : temporarySpacePriceUnit === 'month'
          ? isThai
            ? 'เดือน'
            : 'month'
          : isThai
            ? 'งาน'
            : 'event'

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
              { code: 'THB' as const, symbol: 'บาท', label: isThai ? 'บาทไทย' : 'Thai baht' },
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
                  {isTemporarySpace
                    ? isThai
                      ? 'ไม่ระบุราคา — ติดต่อผู้จัดงาน'
                      : 'No price — contact organizer'
                    : isThai
                      ? 'ไม่ระบุราคา'
                      : 'Price on request'}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isTemporarySpace
                    ? isThai
                      ? 'ให้ผู้สนใจติดต่อผู้จัดงานหรือผู้ลงประกาศเพื่อรับราคาโดยตรง'
                      : 'Ask customers to contact the organizer or listing owner for the price.'
                    : isThai
                      ? 'แสดงให้ผู้สนใจสอบถามราคาโดยตรง'
                      : 'Ask customers to contact you for the price.'}
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
              {isTemporarySpace
                ? isThai
                  ? 'หน้าประกาศจะแสดง “ติดต่อผู้จัดงาน” และระบบจะไม่บันทึกตัวเลขราคาเดิม'
                  : 'The listing will show “Contact organizer”, and previously entered amounts will not be saved.'
                : isThai
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
                  isRetailSpace
                    ? offers.includes('sublease')
                      ? isThai
                        ? 'ค่าเช่าช่วงพื้นที่ค้าขาย'
                        : 'Retail-space sublease'
                      : isThai
                        ? 'ค่าเช่าพื้นที่ค้าขาย'
                        : 'Retail-space rent'
                    : offers.includes('sublease')
                      ? isThai
                        ? 'ค่าเช่าช่วง'
                        : 'Sublease price'
                      : isThai
                        ? 'ค่าเช่า'
                        : 'Rental price'
                }
              >
                {isRetailSpace ? (
                  <div className="space-y-5">
                    <input type="hidden" name="retailPriceUnit" value={temporarySpacePriceUnit} />
                    <div>
                      <p className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {isThai ? 'คิดค่าเช่าแบบไหน?' : 'How is the rent calculated?'}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup">
                        {retailPriceOptions.map((option) => {
                          const selected = temporarySpacePriceUnit === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => onTemporarySpacePriceUnitChange(option.value)}
                              className={`flex min-h-16 items-center gap-3 rounded-2xl border p-4 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                                selected
                                  ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/35'
                                  : 'border-neutral-200 bg-white hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-950'
                              }`}
                            >
                              <span
                                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                                  selected ? 'border-orange-600 bg-orange-600 text-white' : 'border-neutral-300'
                                }`}
                              >
                                {selected ? <span className="size-2 rounded-full bg-white" /> : null}
                              </span>
                              <span className="min-w-0 font-sarabun">
                                <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                                  {isThai ? option.titleTh : option.titleEn}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <FormItem label={isThai ? `ค่าเช่าต่อ${retailUnitLabel}` : `Rent per ${retailUnitLabel}`}>
                      <PriceInput
                        name="retailRentPrice"
                        value={temporarySpacePrice}
                        onChange={onTemporarySpacePriceChange}
                        suffix={`${currencyUnit}/${retailUnitLabel}`}
                        symbol={symbol}
                        placeholder={
                          temporarySpacePriceUnit === 'day'
                            ? currency === 'THB'
                              ? '1,500'
                              : '45'
                            : temporarySpacePriceUnit === 'week'
                              ? currency === 'THB'
                                ? '5,000'
                                : '150'
                              : temporarySpacePriceUnit === 'month'
                                ? currency === 'THB'
                                  ? '15,000'
                                  : '450'
                                : currency === 'THB'
                                  ? '5,000'
                                  : '150'
                        }
                        required
                      />
                    </FormItem>
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50/70 px-4 py-3 font-sarabun dark:bg-orange-950/25">
                      <span className="text-xs text-neutral-600 dark:text-neutral-300">
                        {isThai ? 'ตัวอย่างที่ผู้สนใจจะเห็น' : 'What customers will see'}
                      </span>
                      <strong className="text-sm text-orange-700 dark:text-orange-300">
                        {symbol}
                        {temporarySpacePrice ||
                          (temporarySpacePriceUnit === 'day'
                            ? '1,500'
                            : temporarySpacePriceUnit === 'week'
                              ? '5,000'
                              : temporarySpacePriceUnit === 'month'
                                ? '15,000'
                                : '5,000')}{' '}
                        / {retailUnitLabel}
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 dark:border-neutral-700 dark:bg-neutral-900/70">
                      <div>
                        <h4 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {isThai ? 'ค่าแรกเข้าและเงื่อนไขสัญญา' : 'Upfront costs & contract terms'}
                        </h4>
                      </div>
                      <div className="mt-4 grid gap-5 sm:grid-cols-2">
                        <FormItem label={isThai ? 'ค่ามัดจำ (ถ้ามี)' : 'Security deposit (optional)'}>
                          <PriceInput
                            name="depositAmount"
                            value={depositAmount}
                            onChange={onDepositAmountChange}
                            suffix={currencyUnit}
                            symbol={symbol}
                            placeholder={currency === 'THB' ? '30,000' : '900'}
                          />
                        </FormItem>
                        <FormItem label={isThai ? 'ค่าเช่าล่วงหน้า (ถ้ามี)' : 'Advance rent (optional)'}>
                          <PriceInput
                            name="advanceRentAmount"
                            value={advanceRentAmount}
                            onChange={onAdvanceRentAmountChange}
                            suffix={currencyUnit}
                            symbol={symbol}
                            placeholder={currency === 'THB' ? '15,000' : '450'}
                          />
                        </FormItem>
                        <FormItem label={isThai ? 'สัญญาเช่าขั้นต่ำ' : 'Minimum contract'}>
                          <Select
                            name="minimumLeaseMonths"
                            value={minimumLeaseMonths}
                            onChange={(event) => onMinimumLeaseMonthsChange(event.target.value)}
                            className="[&_select]:h-12 [&_select]:rounded-2xl"
                          >
                            <option value="">{isThai ? 'ไม่มี / ไม่ระบุ' : 'None / not specified'}</option>
                            <option value="1">{isThai ? '1 เดือน' : '1 month'}</option>
                            <option value="2">{isThai ? '2 เดือน' : '2 months'}</option>
                            <option value="3">{isThai ? '3 เดือน' : '3 months'}</option>
                            <option value="6">{isThai ? '6 เดือน' : '6 months'}</option>
                            <option value="12">{isThai ? '1 ปี' : '1 year'}</option>
                            <option value="24">{isThai ? '2 ปี' : '2 years'}</option>
                            <option value="36">{isThai ? '3 ปี' : '3 years'}</option>
                          </Select>
                        </FormItem>
                        <FormItem
                          label={isThai ? 'ค่าส่วนกลาง / ค่าบริการต่อเดือน (ถ้ามี)' : 'Monthly service fee (optional)'}
                        >
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
                    </div>
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
  ['sale', 'rent', 'sublease', 'business_transfer'].includes(value)
const offersFromLegacy = (value: string): OfferTypeCode[] => {
  if (value === 'sale_and_rent') return ['sale', 'rent']
  if (value === 'event_booking' || value === 'contact_organizer') return ['rent']
  return isOfferTypeCode(value) ? [value] : ['rent']
}
export default Page

function mediaPreviews(order: string[], files: File[], previews: string[]) {
  return order.flatMap((token) => {
    const url = listingMediaURLFromToken(token)
    if (url) return [{ token, url: resolveListingMediaUrl(url) }]
    const index = files.findIndex((file) => listingMediaFileToken(file) === token)
    return index >= 0 && previews[index] ? [{ token, url: previews[index], pending: true }] : []
  })
}
