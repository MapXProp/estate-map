'use client'

import ListingAuthCheckpoint from '@/components/add-listing/ListingAuthCheckpoint'
import {
  initialListingMediaProgress,
  initialListingPendingMedia,
  useListingFlowProgress,
} from '@/components/add-listing/ListingFlowProgressContext'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import {
  discoveryChannels,
  getBusinessSpaceType,
  getDiscoveryChannel,
  getPropertyType,
  getPropertyTypesForDiscoveryChannel,
  listingScopes,
  mapUseCasesToLegacyUsage,
  normalizeLegacyPropertyType,
  offersToLegacyListingType,
  offerTypes,
  primaryBusinessSpaceTypeCodes,
  useCases,
  type AccommodationModelCode,
  type BusinessSpaceTypeCode,
  type DiscoveryChannelCode,
  type ListingScopeCode,
  type OfferTypeCode,
  type PropertyTypeCode,
  type UseCaseCode,
} from '@/data/propertyTaxonomy'
import { useAuth } from '@/hooks/useAuth'
import {
  clearCloudListingDraft,
  clearListingDraft,
  getListingDraft,
  LISTING_SUBMISSION_RESULT_KEY,
  resetListingDetailsForCategoryChange,
  saveListingDraftToCloud,
  saveListingStep,
  type ListingDraft,
  type ListingDraftValue,
} from '@/lib/listingDraft'
import { clearListingFormErrors, showListingFieldError, validateListingForm } from '@/lib/listingFormValidation'
import { consumeListingPublishValidationIssue, listingValidationMessage } from '@/lib/listingPublishValidation'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import Textarea from '@/shared/Textarea'
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import {
  BedDouble,
  Building,
  Building2,
  CalendarRange,
  DoorOpen,
  Factory,
  Hotel,
  House,
  LandPlot,
  Store,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import FormItem from '../FormItem'

const propertyTypeIcons = {
  detached_house: House,
  semi_detached_house: House,
  townhouse: Building,
  condo: Building2,
  apartment: Building2,
  dormitory: BedDouble,
  rental_room: DoorOpen,
  flat: Building,
  serviced_apartment: Building2,
  monthly_hotel: Hotel,
  shophouse: Store,
  home_office: Building2,
  office: Building2,
  retail_space: Store,
  warehouse: Warehouse,
  factory: Factory,
  hotel_resort: Hotel,
  land: LandPlot,
} satisfies Record<PropertyTypeCode, LucideIcon>

const businessSpaceTypeIcons = {
  standalone_shop: Store,
  market_stall: Store,
  mall_kiosk: Building2,
  mall_shop: Store,
  food_court_counter: Store,
  school_canteen: Store,
  office_canteen: Store,
  dormitory_shop: Store,
  street_food_space: Store,
  shophouse_ground_floor: Building,
  event_booth: CalendarRange,
} satisfies Record<(typeof primaryBusinessSpaceTypeCodes)[number], LucideIcon>

const primaryBusinessSpaceTypes = primaryBusinessSpaceTypeCodes.flatMap((code) => {
  const item = getBusinessSpaceType(code)
  return item ? [{ ...item, code }] : []
})

const discoveryChannelDescriptionsEn: Record<DiscoveryChannelCode, string> = {
  homes: 'Houses, condos, townhomes, shophouses and land',
  rooms: 'Rooms in shared properties, apartments, dorms, condos and long-term stays',
  business: 'Shophouses, retail spaces, offices, warehouses, factories, hotels and land',
}

const discoveryChannelVisuals = {
  homes: {
    Icon: House,
    selected: 'border-[#35B952] bg-[#F1FCF3] ring-1 ring-[#35B952] dark:border-[#68D27E] dark:bg-[#173520]',
    icon: 'bg-[#37A14F] text-white',
    check: 'text-[#17662E] dark:text-[#C9F0D1]',
    focus: 'focus-visible:outline-[#35B952]',
  },
  rooms: {
    Icon: BedDouble,
    selected: 'border-sky-500 bg-sky-50 ring-1 ring-sky-500 dark:bg-sky-950/30',
    icon: 'bg-sky-600 text-white',
    check: 'text-sky-700 dark:text-sky-300',
    focus: 'focus-visible:outline-sky-500',
  },
  business: {
    Icon: BuildingStorefrontIcon,
    selected: 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/30',
    icon: 'bg-orange-500 text-white',
    check: 'text-orange-700 dark:text-orange-300',
    focus: 'focus-visible:outline-orange-500',
  },
} satisfies Record<
  DiscoveryChannelCode,
  { Icon: React.ComponentType<{ className?: string }>; selected: string; icon: string; check: string; focus: string }
>

const Page = () => {
  const router = useRouter()
  const { setMediaProgress, setPendingMedia, setSubmittingStep } = useListingFlowProgress()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [selectedChannel, setSelectedChannel] = useState<DiscoveryChannelCode | ''>('')
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyTypeCode | ''>('')
  const [selectedScope, setSelectedScope] = useState<ListingScopeCode | ''>('')
  const [selectedUseCases, setSelectedUseCases] = useState<UseCaseCode[]>([])
  const [selectedOffers, setSelectedOffers] = useState<OfferTypeCode[]>([])
  const [businessSpaceTypes, setBusinessSpaceTypes] = useState<BusinessSpaceTypeCode[]>([])
  const [accommodationModel, setAccommodationModel] = useState<AccommodationModelCode | ''>('')
  const [title, setTitle] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [errorSection, setErrorSection] = useState<number | null>(null)
  const [authCheckpointOpen, setAuthCheckpointOpen] = useState(false)
  const submitLockRef = useRef(false)
  const [draftReady, setDraftReady] = useState(false)
  const { isAuthenticated, refresh } = useAuth()

  const propertyType = selectedPropertyType ? getPropertyType(selectedPropertyType) : undefined
  const selectedGroup = propertyType?.groupCode ?? ''
  const propertyTypesForChannel = useMemo(
    () => (selectedChannel ? getPropertyTypesForDiscoveryChannel(selectedChannel) : []),
    [selectedChannel]
  )
  const businessPropertyTypes = propertyTypesForChannel.filter((item) => item.code !== 'retail_space')
  const primaryBusinessSpaceType = businessSpaceTypes[0] ?? ''
  const hasEventBooth = businessSpaceTypes.includes('event_booth')
  const availableScopes = propertyType
    ? listingScopes.filter((scope) => propertyType.allowedScopes.includes(scope.code))
    : []
  const availableUseCases = propertyType
    ? useCases.filter((useCase) => propertyType.allowedUseCases.includes(useCase.code))
    : []
  const availableOffers = offerTypes.filter(
    (offer) => propertyType?.allowedOffers.includes(offer.code) && (hasEventBooth || offer.code !== 'contact_organizer')
  )
  const selectedChannelOption = selectedChannel ? getDiscoveryChannel(selectedChannel) : undefined
  const selectedChannelLabel = selectedChannelOption
    ? isThai
      ? selectedChannelOption.nameTh
      : selectedChannelOption.nameEn
    : ''
  const selectedBusinessSpaceLabels = businessSpaceTypes
    .map((code) => getBusinessSpaceType(code))
    .filter((item): item is NonNullable<ReturnType<typeof getBusinessSpaceType>> => Boolean(item))
    .map((item) => (isThai ? item.nameTh : item.nameEn))
  const apartmentModelLabel =
    selectedPropertyType === 'apartment' && accommodationModel
      ? accommodationModel === 'serviced'
        ? isThai
          ? 'เซอร์วิสอพาร์ตเมนต์'
          : 'Serviced apartment'
        : isThai
          ? 'อพาร์ตเมนต์ทั่วไป'
          : 'Standard apartment'
      : ''
  const propertySelectionLabel = propertyType
    ? [
        selectedBusinessSpaceLabels.length
          ? selectedBusinessSpaceLabels.join(', ')
          : isThai
            ? propertyType.nameTh
            : propertyType.nameEn,
        apartmentModelLabel,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const hasCompletePropertySelection = Boolean(
    propertyType &&
    (!propertyType.supportsBusinessSpaceType || businessSpaceTypes.length) &&
    (selectedPropertyType !== 'apartment' || accommodationModel)
  )
  const selectedOfferLabels = selectedOffers
    .map((code) => offerTypes.find((offer) => offer.code === code))
    .filter((item): item is (typeof offerTypes)[number] => Boolean(item))
    .map((item) => (isThai ? item.nameTh : item.nameEn))
  const listingOptionLabel =
    selectedChannel === 'rooms' && propertyType
      ? isThai
        ? 'ให้เช่ารายเดือน'
        : 'Monthly rental'
      : selectedOfferLabels.join(', ')
  const hasCompleteListingOption = Boolean(hasCompletePropertySelection && propertyType && listingOptionLabel)
  const showsRooms = selectedGroup === 'residential' || selectedGroup === 'mixed_use'
  const isLand = selectedPropertyType === 'land' || selectedGroup === 'land'
  const needsLandArea = [
    'detached_house',
    'semi_detached_house',
    'townhouse',
    'shophouse',
    'home_office',
    'warehouse',
    'factory',
    'hotel_resort',
  ].includes(selectedPropertyType)
  const isIndustrialBusiness = selectedChannel === 'business' && ['warehouse', 'factory'].includes(selectedPropertyType)
  const isHospitalityBusiness = selectedChannel === 'business' && selectedPropertyType === 'hotel_resort'
  const isMonthlyPortfolio = selectedChannel === 'rooms' && selectedScope === 'multi_unit'
  const showsBedrooms = showsRooms && !isMonthlyPortfolio
  const showsBathrooms = !isLand && !isHospitalityBusiness && !isMonthlyPortfolio
  const showsFloorNumber = !isLand && ['single_unit', 'space_slot'].includes(selectedScope)
  const showsTotalFloors = !isLand
  const showsFurnishing =
    !isLand && (selectedChannel !== 'business' || ['shophouse', 'home_office', 'office'].includes(selectedPropertyType))
  const coreDetailsTitle =
    isIndustrialBusiness || isHospitalityBusiness
      ? isThai
        ? 'พื้นที่อาคารและข้อมูลหลัก'
        : 'Building area & key details'
      : isThai
        ? 'ขนาดและข้อมูลหลัก'
        : 'Size & key details'
  const usableAreaLabel =
    isIndustrialBusiness || isHospitalityBusiness
      ? isThai
        ? 'พื้นที่อาคารรวม'
        : 'Total building area'
      : isThai
        ? 'พื้นที่ใช้สอย'
        : 'Usable area'
  const bathroomLabel = isIndustrialBusiness
    ? isThai
      ? 'ห้องน้ำพนักงาน'
      : 'Staff restrooms'
    : selectedChannel === 'business'
      ? isThai
        ? 'ห้องน้ำ / ห้องสุขา'
        : 'Bathrooms / restrooms'
      : isThai
        ? 'ห้องน้ำ'
        : 'Bathrooms'
  const parkingLabel = isIndustrialBusiness
    ? isThai
      ? 'ที่จอดรถ / ลานจอด'
      : 'Parking / vehicle yard'
    : isThai
      ? 'ที่จอดรถ'
      : 'Parking spaces'
  const coreDetailsDraft: ListingDraft = draftReady ? getListingDraft() : {}
  const coreDetailsKey = `${selectedChannel}:${selectedPropertyType}`

  const clearWizardError = () => {
    setError('')
    setErrorSection(null)
    clearListingFormErrors()
  }

  const showWizardError = (section: number, message: string, fieldName?: string) => {
    setError(message)
    setErrorSection(section)
    window.requestAnimationFrame(() => {
      if (fieldName && showListingFieldError({ fieldName, message, isThai })) return

      const target = document.getElementById(`listing-wizard-section-${section}`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const focusTarget = target?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')
      window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), 280)
    })
  }

  useEffect(() => {
    router.prefetch('/add-listing/2')
    submitLockRef.current = false
    setSubmittingStep(null)

    let cancelled = false
    const initializeDraft = async () => {
      const shouldStartNew = new URLSearchParams(window.location.search).get('new') === '1'
      if (shouldStartNew) {
        sessionStorage.removeItem(LISTING_SUBMISSION_RESULT_KEY)
        setPendingMedia(initialListingPendingMedia)
        setMediaProgress(initialListingMediaProgress)
        setSubmittingStep(null)
        submitLockRef.current = false
        clearListingDraft()
        await clearCloudListingDraft().catch(() => undefined)
        if (cancelled) return

        window.history.replaceState(window.history.state, '', '/add-listing/1')
        setSelectedChannel('')
        setSelectedPropertyType('')
        setSelectedScope('')
        setSelectedUseCases([])
        setSelectedOffers([])
        setBusinessSpaceTypes([])
        setAccommodationModel('')
        setTitle('')
        setPlaceName('')
        setDescription('')
        setError('')
        setErrorSection(null)
        clearListingFormErrors()
        setDraftReady(true)
        return
      }

      const draft = getListingDraft()
      const savedPropertyTypeCode = readDraftText(draft.property_type_code)
      const nextPropertyTypeCode = normalizeLegacyPropertyType(savedPropertyTypeCode)
      const nextPropertyType = savedPropertyTypeCode ? getPropertyType(nextPropertyTypeCode) : undefined
      setTitle(readDraftText(draft.listingTitle))
      setPlaceName(readDraftText(draft.placeName))
      setDescription(readDraftText(draft.listingDescription))

      if (!nextPropertyType) {
        setSelectedChannel('')
        setSelectedPropertyType('')
        setSelectedScope('')
        setSelectedUseCases([])
        setSelectedOffers([])
        setBusinessSpaceTypes([])
        setAccommodationModel('')
        setDraftReady(true)
        return
      }

      const savedUseCases = readDraftValues(draft['useCaseCodes[]']).filter((code): code is UseCaseCode =>
        nextPropertyType.allowedUseCases.includes(code as UseCaseCode)
      )
      const savedOffers = readDraftValues(draft['offerTypes[]']).filter((code): code is OfferTypeCode =>
        nextPropertyType.allowedOffers.includes(code as OfferTypeCode)
      )
      const savedScope = readDraftText(draft.listing_scope) as ListingScopeCode
      const nextChannel = resolveDiscoveryChannel(
        readDraftText(draft.discovery_channel_code),
        nextPropertyType.code,
        readDraftText(draft.usage_type)
      )

      setSelectedChannel(nextChannel)
      setSelectedPropertyType(nextPropertyType.code)
      const savedAccommodationModel = readDraftText(draft.accommodation_model)
      setAccommodationModel(
        nextPropertyType.code === 'apartment' &&
          (savedPropertyTypeCode === 'serviced_apartment' || savedAccommodationModel === 'serviced')
          ? 'serviced'
          : nextPropertyType.code === 'apartment'
            ? 'standard'
            : ''
      )
      setSelectedScope(nextPropertyType.allowedScopes.includes(savedScope) ? savedScope : nextPropertyType.defaultScope)
      setSelectedUseCases(
        savedUseCases.length
          ? savedUseCases
          : mapLegacyUsageToUseCases(draft.usage_type, nextPropertyType.defaultUseCases)
      )
      const savedPrimarySpaceType = getBusinessSpaceType(readDraftText(draft.space_type_code))?.code
      const savedBusinessSpaceTypes = [
        savedPrimarySpaceType,
        ...readDraftValues(draft['spaceTypeCodes[]']).map((code) => getBusinessSpaceType(code)?.code),
      ]
        .filter((code): code is BusinessSpaceTypeCode => Boolean(code))
        .filter((code, index, all) => all.indexOf(code) === index)
        .slice(0, 3)
      setSelectedOffers(
        nextChannel === 'rooms' ? ['rent'] : savedOffers.length ? savedOffers : offersFromLegacy(draft.listing_type)
      )
      setBusinessSpaceTypes(savedBusinessSpaceTypes)
      setDraftReady(true)
    }

    void initializeDraft()

    return () => {
      cancelled = true
    }
  }, [router, setMediaProgress, setPendingMedia, setSubmittingStep])

  useEffect(() => {
    if (!draftReady) return
    const validationIssue = consumeListingPublishValidationIssue()
    if (!validationIssue || validationIssue.step !== 1) return

    const message = listingValidationMessage(validationIssue, locale)
    const section = validationIssue.section || 1
    setError(message)
    setErrorSection(section)
    const frame = window.requestAnimationFrame(() => {
      if (
        validationIssue.fieldName &&
        showListingFieldError({ fieldName: validationIssue.fieldName, message, isThai })
      ) {
        return
      }

      const target = document.getElementById(`listing-wizard-section-${section}`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(
        () =>
          target
            ?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')
            ?.focus({ preventScroll: true }),
        280
      )
    })

    return () => window.cancelAnimationFrame(frame)
  }, [draftReady, isThai, locale])

  const selectChannel = (channelCode: DiscoveryChannelCode) => {
    const channel = getDiscoveryChannel(channelCode)
    if (!channel || channelCode === selectedChannel) return

    resetListingDetailsForCategoryChange(channelCode, '')
    setSelectedChannel(channelCode)
    setSelectedPropertyType('')
    setSelectedScope('')
    setSelectedUseCases([])
    setSelectedOffers([])
    setBusinessSpaceTypes([])
    setAccommodationModel('')
    clearWizardError()
  }

  const selectPropertyType = (propertyTypeCode: PropertyTypeCode) => {
    const nextPropertyType = getPropertyType(propertyTypeCode)
    if (!nextPropertyType || propertyTypeCode === selectedPropertyType) return

    resetListingDetailsForCategoryChange(selectedChannel, propertyTypeCode)
    setSelectedPropertyType(propertyTypeCode)
    setSelectedScope(nextPropertyType.defaultScope)
    setSelectedUseCases(nextPropertyType.defaultUseCases)
    setSelectedOffers(selectedChannel === 'rooms' ? ['rent'] : [])
    setBusinessSpaceTypes([])
    setAccommodationModel('')
    clearWizardError()
  }

  const toggleBusinessSpaceType = (spaceTypeCode: BusinessSpaceTypeCode) => {
    const retailSpace = getPropertyType('retail_space')
    if (!retailSpace) return

    const alreadySelected = businessSpaceTypes.includes(spaceTypeCode)
    if (!alreadySelected && businessSpaceTypes.length >= 2) {
      showWizardError(2, isThai ? 'เลือกได้สูงสุด 2 ลักษณะพื้นที่' : 'Choose up to 2 space types.')
      return
    }

    const nextSpaceTypes = alreadySelected
      ? businessSpaceTypes.filter((code) => code !== spaceTypeCode)
      : [...businessSpaceTypes, spaceTypeCode]
    const hasFoodSpace = nextSpaceTypes.some((code) =>
      ['food_court_counter', 'street_food_space', 'school_canteen', 'office_canteen'].includes(code)
    )
    const nextHasEventBooth = nextSpaceTypes.includes('event_booth')

    if (selectedPropertyType !== retailSpace.code) {
      resetListingDetailsForCategoryChange(selectedChannel, retailSpace.code)
    }
    setSelectedPropertyType(retailSpace.code)
    setSelectedScope(retailSpace.defaultScope)
    setSelectedUseCases((current) => {
      const compatible = current.filter((code) => retailSpace.allowedUseCases.includes(code))
      const withRetail: UseCaseCode[] = compatible.includes('retail') ? compatible : ['retail', ...compatible]
      if (hasFoodSpace && !withRetail.includes('food_service')) return [...withRetail, 'food_service']
      if (!hasFoodSpace) return withRetail.filter((code) => code !== 'food_service')
      return withRetail
    })
    setSelectedOffers((current) => {
      const compatible = current.filter((offer) => retailSpace.allowedOffers.includes(offer))
      if (nextHasEventBooth) return compatible
      return compatible.filter((offer) => offer !== 'contact_organizer')
    })
    setBusinessSpaceTypes(nextSpaceTypes)
    clearWizardError()
  }

  const toggleUseCase = (code: UseCaseCode) => {
    setSelectedUseCases((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    )
    clearWizardError()
  }

  const toggleOffer = (code: OfferTypeCode) => {
    setSelectedOffers((current) => {
      if (code === 'contact_organizer') return current.includes(code) ? [] : [code]
      const withoutContact = current.filter((item) => item !== 'contact_organizer')
      return withoutContact.includes(code) ? withoutContact.filter((item) => item !== code) : [...withoutContact, code]
    })
    clearWizardError()
  }

  const handleSubmitForm = async (formData: FormData) => {
    clearListingFormErrors()
    if (!selectedChannel) {
      showWizardError(1, isThai ? 'กรุณาเลือกหมวดหลักในข้อ 1' : 'Choose a main category in section 1.')
      return
    }
    if (!propertyType || !selectedPropertyType) {
      showWizardError(2, isThai ? 'กรุณาเลือกประเภททรัพย์ในข้อ 2' : 'Choose a property type in section 2.')
      return
    }
    if (selectedPropertyType === 'apartment' && !accommodationModel) {
      showWizardError(2, isThai ? 'กรุณาเลือกรูปแบบอพาร์ตเมนต์ในข้อ 2' : 'Choose the apartment model in section 2.')
      return
    }
    if (propertyType.supportsBusinessSpaceType && !businessSpaceTypes.length) {
      showWizardError(2, isThai ? 'กรุณาเลือกรูปแบบพื้นที่ค้าขาย' : 'Choose a business space type.')
      return
    }
    if (!selectedOffers.length) {
      showWizardError(3, isThai ? 'กรุณาเลือกอย่างน้อยหนึ่งรูปแบบการประกาศ' : 'Choose at least one listing option.')
      return
    }
    if (!title.trim()) {
      showWizardError(4, isThai ? 'กรุณากรอกหัวข้อประกาศ' : 'Enter a listing title.', 'listingTitle')
      return
    }
    if (!description.trim()) {
      showWizardError(4, isThai ? 'กรุณากรอกรายละเอียดประกาศ' : 'Enter a listing description.', 'listingDescription')
      return
    }
    if (!validateListingForm({ isThai })) return
    if (submitLockRef.current) return

    submitLockRef.current = true
    setSubmittingStep(1)

    formData.set('property_group_code', selectedGroup)
    formData.set('discovery_channel_code', selectedChannel)
    formData.set('property_type_code', selectedPropertyType)
    formData.set('accommodation_model', selectedPropertyType === 'apartment' ? accommodationModel : '')
    formData.set('listing_scope', selectedScope)
    const effectiveUseCases = selectedUseCases.length ? selectedUseCases : propertyType.defaultUseCases
    formData.set('useCaseCodes[]', '')
    effectiveUseCases.forEach((code) => formData.append('useCaseCodes[]', code))
    formData.set('usage_type', mapUseCasesToLegacyUsage(effectiveUseCases))
    formData.set('listing_type', offersToLegacyListingType(selectedOffers))
    resetListingDetailsForCategoryChange(selectedChannel, selectedPropertyType)
    const savedDraft = saveListingStep(1, formData)
    const authenticated = isAuthenticated || Boolean(await refresh())

    if (!authenticated) {
      submitLockRef.current = false
      setSubmittingStep(null)
      setAuthCheckpointOpen(true)
      return
    }

    await saveListingDraftToCloud(savedDraft).catch(() => undefined)
    router.push('/add-listing/2')
  }

  if (!draftReady) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
  }

  return (
    <>
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-[#fff8f1] px-3 py-1 text-xs font-medium text-orange-700 shadow-[0_8px_20px_-16px_rgba(194,82,17,0.7)] dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300">
          <PencilSquareIcon className="h-4 w-4" />
          <span>{isThai ? 'เริ่มลงประกาศ' : 'Start your listing'}</span>
        </div>
        <h1 className="font-sarabun text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          {isThai ? 'ทรัพย์ของคุณอยู่ในหมวดไหน' : 'Which category best fits your property?'}
        </h1>
      </div>

      <div className="h-px w-16 bg-gradient-to-r from-orange-400 via-orange-200 to-transparent" />

      <Form id="add-listing-form" action={handleSubmitForm} noValidate className="space-y-7">
        <input type="hidden" name="property_group_code" value={selectedGroup} />
        <input type="hidden" name="discovery_channel_code" value={selectedChannel} />
        <input type="hidden" name="property_type_code" value={selectedPropertyType} />
        <input
          type="hidden"
          name="accommodation_model"
          value={selectedPropertyType === 'apartment' ? accommodationModel : ''}
        />
        <input type="hidden" name="listing_scope" value={selectedScope} />
        <input type="hidden" name="space_type_code" value={primaryBusinessSpaceType} />
        {businessSpaceTypes.map((code) => (
          <input key={code} type="hidden" name="spaceTypeCodes[]" value={code} />
        ))}
        <input type="hidden" name="usage_type" value={mapUseCasesToLegacyUsage(selectedUseCases)} />
        <input type="hidden" name="listing_type" value={offersToLegacyListingType(selectedOffers)} />
        {selectedUseCases.map((code) => (
          <input key={code} type="hidden" name="useCaseCodes[]" value={code} />
        ))}
        {selectedOffers.map((code) => (
          <input key={code} type="hidden" name="offerTypes[]" value={code} />
        ))}

        <WizardSection
          number="1"
          title={isThai ? 'เลือกหมวดหลัก' : 'Choose a main category'}
          complete={Boolean(selectedChannel)}
          statusText={
            selectedChannelLabel
              ? isThai
                ? `เลือกแล้ว: ${selectedChannelLabel}`
                : `Selected: ${selectedChannelLabel}`
              : ''
          }
          pendingText={isThai ? 'ยังไม่ได้เลือกหมวดหลัก' : 'No main category selected yet'}
          tone={selectedChannel || undefined}
          invalid={errorSection === 1}
          errorText={errorSection === 1 ? error : ''}
        >
          <div className="grid gap-3 min-[744px]:grid-cols-3">
            {discoveryChannels.map((channel) => (
              <DiscoveryChannelCard
                key={channel.code}
                channel={channel.code}
                selected={selectedChannel === channel.code}
                title={isThai ? channel.nameTh : channel.nameEn}
                description={isThai ? channel.description : discoveryChannelDescriptionsEn[channel.code]}
                onClick={() => selectChannel(channel.code)}
              />
            ))}
          </div>
        </WizardSection>

        <WizardSection
          number="2"
          title={isThai ? 'เลือกประเภทหลักที่ตรงที่สุด' : 'Choose the best matching property type'}
          complete={hasCompletePropertySelection}
          statusText={
            propertySelectionLabel
              ? isThai
                ? `เลือกแล้ว: ${propertySelectionLabel}`
                : `Selected: ${propertySelectionLabel}`
              : ''
          }
          pendingText={
            selectedChannel
              ? isThai
                ? 'ยังไม่ได้เลือกประเภททรัพย์'
                : 'No property type selected yet'
              : isThai
                ? 'เลือกหมวดหลักในข้อ 1 ก่อน'
                : 'Choose a main category in section 1 first'
          }
          tone={selectedChannel || undefined}
          invalid={errorSection === 2}
          errorText={errorSection === 2 ? error : ''}
          description={
            selectedChannel === 'business'
              ? isThai
                ? 'อาคารเลือก 1 ประเภท ส่วนพื้นที่ค้าขายเลือกได้สูงสุด 2 ลักษณะที่ซ้อนกัน'
                : 'Choose one building type, or up to 2 overlapping retail space types.'
              : isThai
                ? 'เลือก 1 ประเภทหลักเพื่อให้ระบบแสดงช่องกรอกและตัวกรองที่ถูกต้อง'
                : 'Choose one primary type so we can show the right fields and search filters.'
          }
        >
          {!selectedChannel ? (
            <StepPrompt
              isThai={isThai}
              textTh="เมื่อเลือกหมวดหลักแล้ว ประเภททรัพย์ที่เกี่ยวข้องจะแสดงตรงนี้"
              textEn="Relevant property types will appear here after you choose a main category."
            />
          ) : selectedChannel === 'business' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-sarabun text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {isThai ? 'อาคารและที่ดิน' : 'Buildings and land'}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5 min-[744px]:grid-cols-3">
                  {businessPropertyTypes.map((item) => {
                    const Icon = propertyTypeIcons[item.code]
                    return (
                      <ChoiceCard
                        key={item.code}
                        compact
                        selected={selectedPropertyType === item.code}
                        title={isThai ? item.nameTh : item.nameEn}
                        icon={<Icon className="size-5" />}
                        tone="business"
                        onClick={() => selectPropertyType(item.code)}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
                <h3 className="font-sarabun text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                  {isThai ? 'ร้านค้า ล็อก และพื้นที่ชั่วคราว' : 'Retail, stalls and temporary spaces'}
                </h3>
                <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'เลือกได้สูงสุด 2 รายการตามสภาพจริง รายการแรกจะเป็นประเภทหลัก'
                    : 'Choose up to 2 matching types. Your first choice is the primary type.'}
                </p>
                <div className="mt-3 flex min-h-9 items-center justify-between gap-2 rounded-xl bg-orange-50/70 px-2.5 py-1.5 font-sarabun text-xs text-orange-800 dark:bg-orange-950/25 dark:text-orange-200">
                  <span>
                    {businessSpaceTypes.length
                      ? isThai
                        ? `เลือกแล้ว ${businessSpaceTypes.length} จาก 2 รายการ`
                        : `${businessSpaceTypes.length} of 2 selected`
                      : isThai
                        ? 'ยังไม่ได้เลือกลักษณะพื้นที่'
                        : 'No space type selected yet'}
                  </span>
                  {primaryBusinessSpaceType ? (
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-700 shadow-sm dark:bg-neutral-900 dark:text-orange-300">
                      {isThai ? 'รายการแรก = หลัก' : 'First = primary'}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 min-[744px]:grid-cols-3 min-[744px]:gap-2.5">
                  {primaryBusinessSpaceTypes.map((item) => {
                    const Icon = businessSpaceTypeIcons[item.code]
                    const selectionIndex = businessSpaceTypes.indexOf(item.code)
                    return (
                      <ChoiceCard
                        key={item.code}
                        compact
                        mobileStacked
                        selected={selectedPropertyType === 'retail_space' && selectionIndex >= 0}
                        selectionBadge={
                          selectionIndex === 0
                            ? isThai
                              ? 'หลัก'
                              : 'Primary'
                            : selectionIndex > 0
                              ? String(selectionIndex + 1)
                              : undefined
                        }
                        title={isThai ? item.nameTh : item.nameEn}
                        icon={<Icon className="size-5" />}
                        tone="business"
                        onClick={() => toggleBusinessSpaceType(item.code)}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 min-[744px]:grid-cols-3">
                {propertyTypesForChannel.map((item) => {
                  const Icon = propertyTypeIcons[item.code]
                  return (
                    <ChoiceCard
                      key={item.code}
                      compact
                      selected={selectedPropertyType === item.code}
                      title={isThai ? item.nameTh : item.nameEn}
                      icon={<Icon className="size-5" />}
                      tone={selectedChannel || undefined}
                      onClick={() => selectPropertyType(item.code)}
                    />
                  )
                })}
              </div>

              {selectedChannel === 'rooms' && selectedPropertyType === 'apartment' ? (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3.5 dark:border-sky-900/60 dark:bg-sky-950/20">
                  <div className="font-sarabun text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {isThai ? 'อพาร์ตเมนต์นี้ให้บริการแบบไหน' : 'How is this apartment serviced?'}
                  </div>
                  <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    {isThai
                      ? 'รวมอาคารชื่อ Court / คอร์ท, Residence หรือ Mansion ที่เจ้าของอาคารบริหารห้องเช่า เลือกแบบมีบริการเฉพาะเมื่อมีแม่บ้าน เปลี่ยนผ้า หรือ Reception ระหว่างเข้าพัก'
                      : 'Includes Court, Residence or Mansion buildings operated by one rental owner. Choose serviced only when ongoing services such as housekeeping, linen changes or reception are provided.'}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        {
                          code: 'standard' as const,
                          title: isThai ? 'อพาร์ตเมนต์ทั่วไป' : 'Standard apartment',
                          description: isThai
                            ? 'เช่าห้องเป็นหลัก ไม่มีบริการแบบโรงแรม'
                            : 'Room rental without hotel-style services',
                        },
                        {
                          code: 'serviced' as const,
                          title: isThai ? 'เซอร์วิสอพาร์ตเมนต์' : 'Serviced apartment',
                          description: isThai
                            ? 'มีบริการดูแลระหว่างเข้าพักเป็นประจำ'
                            : 'Includes ongoing services during the stay',
                        },
                      ] satisfies Array<{
                        code: AccommodationModelCode
                        title: string
                        description: string
                      }>
                    ).map((option) => {
                      const selected = accommodationModel === option.code
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => {
                            setAccommodationModel(option.code)
                            clearWizardError()
                          }}
                          className={`flex min-h-20 items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                            selected
                              ? 'border-sky-500 bg-white shadow-sm ring-1 ring-sky-500 dark:bg-neutral-900'
                              : 'border-neutral-200 bg-white/70 hover:border-sky-300 dark:border-neutral-700 dark:bg-neutral-900/60'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              selected ? 'border-sky-600 bg-sky-600 text-white' : 'border-neutral-300 text-transparent'
                            }`}
                          >
                            <CheckCircleIcon className="size-4" />
                          </span>
                          <span>
                            <span className="block font-sarabun text-sm font-semibold text-neutral-900 dark:text-white">
                              {option.title}
                            </span>
                            <span className="mt-0.5 block font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </WizardSection>

        <WizardSection
          number="3"
          complete={hasCompleteListingOption}
          statusText={
            listingOptionLabel ? (isThai ? `เลือกแล้ว: ${listingOptionLabel}` : `Selected: ${listingOptionLabel}`) : ''
          }
          pendingText={
            hasCompletePropertySelection
              ? isThai
                ? 'ยังไม่ได้เลือกรูปแบบประกาศ'
                : 'No listing option selected yet'
              : isThai
                ? 'เลือกประเภททรัพย์ในข้อ 2 ก่อน'
                : 'Choose a property type in section 2 first'
          }
          tone={selectedChannel || undefined}
          invalid={errorSection === 3}
          errorText={errorSection === 3 ? error : ''}
          title={
            selectedChannel === 'rooms'
              ? isThai
                ? 'รูปแบบประกาศ'
                : 'Listing option'
              : hasEventBooth
                ? isThai
                  ? 'รูปแบบประกาศพื้นที่ชั่วคราว'
                  : 'Temporary-space listing option'
                : isThai
                  ? 'ต้องการขายหรือให้เช่า'
                  : 'For sale or rent'
          }
        >
          {!hasCompletePropertySelection ? (
            <StepPrompt
              isThai={isThai}
              textTh="เมื่อเลือกประเภททรัพย์แล้ว ตัวเลือกขาย ให้เช่า หรือรูปแบบที่เกี่ยวข้องจะแสดงตรงนี้"
              textEn="Sale, rental or other relevant listing options will appear after you choose a property type."
            />
          ) : selectedChannel === 'rooms' ? (
            <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-200 ring-inset dark:bg-sky-950/30 dark:ring-sky-800">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
                <BedDouble className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sarabun text-sm font-semibold text-sky-950 dark:text-sky-100">
                  {isThai ? 'ให้เช่ารายเดือน' : 'Monthly rental'}
                </p>
                <p className="mt-0.5 font-sarabun text-xs leading-5 text-sky-700/80 dark:text-sky-300">
                  {isThai
                    ? 'หมวดนี้จะแสดงกับผู้ที่กำลังหาห้องเช่าและที่พักระยะยาว'
                    : 'This category is shown to people looking for rooms and long-term stays.'}
                </p>
              </div>
              <CheckCircleIcon className="size-5 shrink-0 text-sky-600" />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
                {availableOffers.map((offer) => (
                  <ToggleCard
                    key={offer.code}
                    compact
                    checked={selectedOffers.includes(offer.code)}
                    title={isThai ? offer.nameTh : offer.nameEn}
                    tone={selectedChannel || undefined}
                    onClick={() => toggleOffer(offer.code)}
                  />
                ))}
              </div>
              {availableOffers.length > 1 ? (
                <p className="mt-2.5 font-sarabun text-xs text-neutral-500 dark:text-neutral-400">
                  {hasEventBooth
                    ? isThai
                      ? 'เลือกได้มากกว่า 1 รูปแบบ ยกเว้น “ติดต่อผู้จัดงาน” ที่เลือกเดี่ยว'
                      : 'You can choose more than one priced option. “Contact organizer” is selected by itself.'
                    : isThai
                      ? 'เลือกได้มากกว่า 1 รูปแบบ'
                      : 'You can choose more than one option.'}
                </p>
              ) : null}
              {hasEventBooth ? (
                <p className="mt-2 font-sarabun text-xs leading-5 text-orange-700 dark:text-orange-300">
                  {isThai
                    ? 'ถ้ามีราคาตายตัวให้เลือกรูปแบบเช่าและระบุราคากับจำนวนวัน หากราคาเป็นส่วนตัวให้เลือก “ติดต่อผู้จัดงาน”'
                    : 'Choose a rental option to show a fixed price and number of days, or choose “Contact organizer” for a private quote.'}
                </p>
              ) : null}
            </div>
          )}
        </WizardSection>

        <details className="group overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sarabun sm:px-7">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isThai ? 'ตัวเลือกเพิ่มเติม' : 'More options'}{' '}
              <span className="font-normal text-neutral-400">{isThai ? '(ถ้ามี)' : '(if any)'}</span>
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs text-neutral-500 shadow-sm ring-1 ring-neutral-200 group-open:text-orange-600 dark:bg-neutral-800 dark:ring-neutral-700">
              {isThai ? 'เปิด' : 'Open'}
            </span>
          </summary>

          <div className="space-y-6 border-t border-neutral-200 px-5 py-6 sm:px-7 dark:border-neutral-800">
            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'กำลังประกาศส่วนใด' : 'What part are you listing?'}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableScopes.map((scope) => (
                  <ChoiceCard
                    key={scope.code}
                    selected={selectedScope === scope.code}
                    title={isThai ? scope.nameTh : scope.nameEn}
                    tone={selectedChannel || undefined}
                    onClick={() => setSelectedScope(scope.code)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? 'ใช้ทำอะไรได้บ้าง' : 'Suitable uses'}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {availableUseCases.map((useCase) => (
                  <ToggleCard
                    key={useCase.code}
                    checked={selectedUseCases.includes(useCase.code)}
                    title={isThai ? useCase.nameTh : useCase.nameEn}
                    tone={selectedChannel || undefined}
                    onClick={() => toggleUseCase(useCase.code)}
                  />
                ))}
              </div>
            </div>
          </div>
        </details>

        <WizardSection
          number="4"
          title={isThai ? 'ข้อมูลประกาศ' : 'Listing information'}
          complete={Boolean(title.trim()) && Boolean(description.trim())}
          statusText={
            title.trim() && description.trim()
              ? isThai
                ? 'กรอกข้อมูลประกาศครบแล้ว'
                : 'Listing information completed'
              : ''
          }
          pendingText={isThai ? 'กรอกหัวข้อและรายละเอียดประกาศให้ครบ' : 'Complete the listing title and description'}
          tone={selectedChannel || undefined}
          invalid={errorSection === 4}
          errorText={errorSection === 4 ? error : ''}
          description={
            isThai
              ? 'ระบุจุดเด่น การเดินทาง สภาพทรัพย์ และเงื่อนไขสำคัญ'
              : 'Describe highlights, access, condition and important terms.'
          }
        >
          <div className="grid gap-6 [&_[data-slot=label]]:font-sarabun [&_[data-slot=label]]:text-base">
            <FormItem label={isThai ? 'หัวข้อประกาศ *' : 'Listing title *'}>
              <Input
                name="listingTitle"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  if (errorSection === 4) clearWizardError()
                }}
                placeholder={
                  isThai
                    ? 'เช่น ให้เช่าอาคารพาณิชย์ 3 ชั้น ใกล้ BTS อ่อนนุช เปิดร้านอาหารได้'
                    : 'e.g. 3-storey shophouse near On Nut BTS, suitable for a restaurant'
                }
                maxLength={160}
                required
                className="h-16 rounded-[18px] border-neutral-200 bg-neutral-50 px-5 text-base shadow-none min-[744px]:text-[17px]! sm:text-base dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{title.length}/160</p>
            </FormItem>

            <FormItem
              label={isThai ? 'ชื่อโครงการ อาคาร หรือสถานที่ (ถ้ามี)' : 'Project, building or place name (if any)'}
            >
              <Input
                name="placeName"
                value={placeName}
                onChange={(event) => setPlaceName(event.target.value)}
                placeholder={
                  isThai
                    ? 'เช่น Ideo Sukhumvit 93, อาคาร ABC, ตลาดนัด XYZ'
                    : 'e.g. Ideo Sukhumvit 93, ABC Building, XYZ Market'
                }
                maxLength={160}
                className="h-16 rounded-[18px] border-neutral-200 bg-neutral-50 px-5 text-base shadow-none min-[744px]:text-[17px]! sm:text-base dark:bg-neutral-950"
              />
            </FormItem>

            <FormItem label={isThai ? 'รายละเอียดประกาศ *' : 'Listing description *'}>
              <Textarea
                name="listingDescription"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value)
                  if (errorSection === 4) clearWizardError()
                }}
                placeholder={
                  isThai
                    ? 'อธิบายจุดเด่นของทรัพย์ การเดินทาง และเงื่อนไขสำคัญ...'
                    : 'Describe the property highlights, transport access and important terms...'
                }
                required
                maxLength={1000}
                className="min-h-64 rounded-[18px] border-neutral-200 bg-neutral-50 px-5 py-4 text-base leading-7 shadow-none min-[744px]:min-h-72 min-[744px]:text-[17px]! sm:text-base dark:bg-neutral-950"
              />
              <p className="mt-2 text-right text-xs text-neutral-400">{description.length}/1000</p>
            </FormItem>
          </div>
        </WizardSection>

        {hasCompletePropertySelection && !isLand ? (
          <section
            key={coreDetailsKey}
            className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {coreDetailsTitle}
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {needsLandArea ? (
                <FormItem label={isThai ? 'ขนาดที่ดิน' : 'Land area'}>
                  <UnitInput
                    name="landAreaSqm"
                    defaultValue={readDraftText(coreDetailsDraft.landAreaSqm)}
                    suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                    placeholder={isThai ? 'กรอกขนาดที่ดิน' : 'Enter land area'}
                  />
                </FormItem>
              ) : null}

              <FormItem label={usableAreaLabel}>
                <UnitInput
                  name="usableAreaSqm"
                  defaultValue={readDraftText(coreDetailsDraft.usableAreaSqm)}
                  suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                  placeholder={isThai ? 'กรอกขนาดพื้นที่' : 'Enter area'}
                />
              </FormItem>

              {showsBedrooms ? (
                <FormItem label={isThai ? 'ห้องนอน' : 'Bedrooms'}>
                  <Input
                    name="Bedroom"
                    defaultValue={readDraftText(coreDetailsDraft.Bedroom)}
                    type="number"
                    min="0"
                    placeholder={isThai ? '0 สำหรับห้องสตูดิโอ' : '0 for a studio'}
                  />
                </FormItem>
              ) : null}

              {showsBathrooms ? (
                <FormItem label={bathroomLabel}>
                  <Input
                    name="Bathroom"
                    defaultValue={readDraftText(coreDetailsDraft.Bathroom)}
                    type="number"
                    min="0"
                    placeholder={isThai ? '0 หากไม่มี' : '0 if none'}
                  />
                </FormItem>
              ) : null}

              <FormItem label={parkingLabel}>
                <Input
                  name="Parking"
                  defaultValue={readDraftText(coreDetailsDraft.Parking)}
                  type="number"
                  min="0"
                  placeholder={isThai ? 'กรอกจำนวน' : 'Enter number'}
                />
              </FormItem>

              {showsFloorNumber ? (
                <FormItem label={isThai ? 'ชั้นที่' : 'Floor'}>
                  <Input
                    name="floorNo"
                    defaultValue={readDraftText(coreDetailsDraft.floorNo)}
                    type="number"
                    min="0"
                    placeholder={isThai ? '0 สำหรับชั้นล่าง' : '0 for ground floor'}
                  />
                </FormItem>
              ) : null}

              {showsTotalFloors ? (
                <FormItem label={isThai ? 'จำนวนชั้นทั้งหมด' : 'Total floors'}>
                  <Input
                    name="totalFloors"
                    defaultValue={readDraftText(coreDetailsDraft.totalFloors)}
                    type="number"
                    min="1"
                    placeholder={isThai ? 'เช่น 12' : 'e.g. 12'}
                  />
                </FormItem>
              ) : null}

              {showsFurnishing ? (
                <FormItem label={isThai ? 'เฟอร์นิเจอร์' : 'Furnishing'}>
                  <Select
                    name="furnishingStatus"
                    defaultValue={readDraftText(coreDetailsDraft.furnishingStatus)}
                    className="[&_select]:h-11 [&_select]:rounded-2xl"
                  >
                    <option value="">{isThai ? 'ไม่ระบุ' : 'Not specified'}</option>
                    <option value="fully_furnished">{isThai ? 'ครบ พร้อมอยู่' : 'Fully furnished'}</option>
                    <option value="partly_furnished">{isThai ? 'มีบางส่วน' : 'Partly furnished'}</option>
                    <option value="unfurnished">{isThai ? 'ไม่มีเฟอร์นิเจอร์' : 'Unfurnished'}</option>
                  </Select>
                </FormItem>
              ) : null}
            </div>
          </section>
        ) : null}
      </Form>

      <ListingAuthCheckpoint
        open={authCheckpointOpen}
        onClose={() => setAuthCheckpointOpen(false)}
        onAuthenticated={() => router.push('/add-listing/2')}
      />
    </>
  )
}

const WizardSection = ({
  number,
  title,
  description,
  complete,
  statusText,
  pendingText,
  tone,
  invalid = false,
  errorText,
  children,
}: {
  number: string
  title: string
  description?: string
  complete: boolean
  statusText: string
  pendingText: string
  tone?: DiscoveryChannelCode
  invalid?: boolean
  errorText?: string
  children: React.ReactNode
}) => {
  const completedBorder =
    tone === 'homes'
      ? 'border-[#68D27E] dark:border-[#2A7A3D]'
      : tone === 'rooms'
        ? 'border-sky-300 dark:border-sky-800'
        : 'border-orange-300 dark:border-orange-800'
  const completedHeader =
    tone === 'homes'
      ? 'border-[#C9F0D1] bg-[#F1FCF3] dark:border-[#205E30] dark:bg-[#173520]'
      : tone === 'rooms'
        ? 'border-sky-100 bg-sky-50/75 dark:border-sky-900 dark:bg-sky-950/20'
        : 'border-orange-100 bg-orange-50/75 dark:border-orange-900 dark:bg-orange-950/20'
  const completedNumber = tone === 'homes' ? 'bg-[#37A14F]' : tone === 'rooms' ? 'bg-sky-600' : 'bg-orange-500'
  const completedStatus =
    tone === 'homes'
      ? 'bg-[#DDF7E3] text-[#17662E] dark:bg-[#234B2F] dark:text-[#C9F0D1]'
      : tone === 'rooms'
        ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'

  return (
    <section
      id={`listing-wizard-section-${number}`}
      data-listing-section-invalid={invalid || undefined}
      className={`overflow-hidden rounded-[28px] border bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.32)] transition-colors dark:bg-neutral-900 ${
        invalid
          ? 'border-red-400 shadow-[0_24px_70px_-42px_rgba(220,38,38,0.42)] dark:border-red-700'
          : complete
            ? completedBorder
            : 'border-neutral-200/80 dark:border-neutral-800'
      }`}
    >
      <div
        className={`flex items-start gap-3 border-b px-4 py-4 transition-colors min-[744px]:gap-4 min-[744px]:px-7 min-[744px]:py-5 ${
          invalid
            ? 'border-red-100 bg-red-50 dark:border-red-900/70 dark:bg-red-950/25'
            : complete
              ? completedHeader
              : 'border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white transition-colors ${
            invalid ? 'bg-red-600' : complete ? completedNumber : 'bg-neutral-900 dark:bg-white dark:text-neutral-900'
          }`}
        >
          {number}
        </span>
        <span className="min-w-0 flex-1 self-center">
          <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
          {description ? (
            <span className="mt-0.5 block font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {description}
            </span>
          ) : null}
          <span
            aria-live="polite"
            className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 font-sarabun text-xs font-medium ${
              invalid
                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                : complete
                  ? completedStatus
                  : 'bg-neutral-200/70 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {invalid ? (
              <ExclamationCircleIcon className="size-4 shrink-0" />
            ) : complete ? (
              <CheckCircleIcon className="size-4 shrink-0" />
            ) : (
              <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
            )}
            <span className={invalid ? '' : 'truncate'}>
              {invalid ? errorText : complete ? statusText : pendingText}
            </span>
          </span>
        </span>
      </div>
      <div className="p-3 min-[744px]:p-7">{children}</div>
    </section>
  )
}

const StepPrompt = ({ isThai, textTh, textEn }: { isThai: boolean; textTh: string; textEn: string }) => (
  <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 px-5 py-6 text-center dark:border-neutral-700 dark:bg-neutral-950/40">
    <p className="max-w-xl font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
      {isThai ? textTh : textEn}
    </p>
  </div>
)

const DiscoveryChannelCard = ({
  channel,
  selected,
  title,
  description,
  onClick,
}: {
  channel: DiscoveryChannelCode
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) => {
  const visual = discoveryChannelVisuals[channel]
  const Icon = visual.Icon

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex min-h-28 w-full items-center gap-4 rounded-3xl border p-4 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${visual.focus} min-[744px]:min-h-44 min-[744px]:flex-col min-[744px]:items-start min-[744px]:p-5 ${
        selected
          ? visual.selected
          : 'border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600'
      }`}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
          selected ? visual.icon : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        }`}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sarabun text-base leading-6 font-semibold text-neutral-950 dark:text-white">
          <PropertyCategoryLabel label={title} ampersandClassName="text-neutral-400/60" />
        </span>
        <span className="mt-1 block font-sarabun text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {description}
        </span>
      </span>
      {selected ? (
        <CheckCircleIcon
          className={`absolute top-4 right-4 size-6 shrink-0 min-[744px]:top-5 min-[744px]:right-5 ${visual.check}`}
        />
      ) : null}
    </button>
  )
}

const ChoiceCard = ({
  selected,
  title,
  icon,
  tone,
  compact = false,
  mobileStacked = false,
  selectionBadge,
  onClick,
}: {
  selected: boolean
  title: string
  icon?: React.ReactNode
  tone?: DiscoveryChannelCode
  compact?: boolean
  mobileStacked?: boolean
  selectionBadge?: string
  onClick: () => void
}) => {
  const selectedStyle =
    tone === 'homes'
      ? 'border-[#35B952] bg-[#F1FCF3] shadow-[0_10px_24px_-20px_rgba(53,185,82,0.65)] dark:border-[#68D27E] dark:bg-[#173520]'
      : tone === 'rooms'
        ? 'border-sky-500 bg-sky-50/80 shadow-[0_10px_24px_-20px_rgba(14,165,233,0.9)] dark:bg-sky-950/25'
        : 'border-orange-500 bg-orange-50/75 shadow-[0_10px_24px_-20px_rgba(249,115,22,0.95)] dark:bg-orange-950/25'
  const iconStyle = tone === 'homes' ? 'bg-[#37A14F]' : tone === 'rooms' ? 'bg-sky-600' : 'bg-orange-500'
  const checkStyle = tone === 'homes' ? 'text-[#17662E]' : tone === 'rooms' ? 'text-sky-700' : 'text-orange-600'
  const focusStyle =
    tone === 'homes'
      ? 'focus-visible:outline-[#35B952]'
      : tone === 'rooms'
        ? 'focus-visible:outline-sky-500'
        : 'focus-visible:outline-orange-500'

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`relative flex w-full touch-manipulation rounded-2xl border text-left transition duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.985] ${focusStyle} ${
        compact
          ? mobileStacked
            ? 'min-h-[102px] flex-col items-start gap-2 px-3 py-3 min-[744px]:min-h-16 min-[744px]:flex-row min-[744px]:items-center min-[744px]:gap-2.5 min-[744px]:p-3'
            : 'min-h-[68px] flex-row items-center gap-2.5 px-3 py-2.5 min-[744px]:min-h-16 min-[744px]:p-3'
          : 'min-h-20 items-center gap-4 p-4'
      } ${
        selected
          ? selectedStyle
          : 'border-neutral-200/90 bg-white hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500 dark:hover:bg-neutral-800/60 dark:active:bg-neutral-800/60'
      }`}
    >
      {icon ? (
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${
            compact ? (mobileStacked ? 'size-9' : 'size-10 min-[744px]:size-9') : 'h-11 w-11'
          } ${
            selected
              ? `${iconStyle} text-white`
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
          }`}
        >
          {icon}
        </span>
      ) : null}
      <span
        className={`min-w-0 flex-1 ${
          compact
            ? mobileStacked
              ? `w-full ${selectionBadge ? 'min-[744px]:pe-14' : 'min-[744px]:pe-4'}`
              : selectionBadge
                ? 'pe-14'
                : 'pe-5 min-[744px]:pe-4'
            : ''
        }`}
      >
        <span
          className={`block font-sarabun font-semibold text-neutral-900 dark:text-neutral-50 ${
            compact ? 'text-sm leading-5' : 'text-base'
          }`}
        >
          {title}
        </span>
      </span>
      {selected && selectionBadge ? (
        <span className="absolute top-2 right-2 rounded-full bg-orange-600 px-2 py-0.5 font-sarabun text-[10px] leading-4 font-semibold text-white shadow-sm">
          {selectionBadge}
        </span>
      ) : selected ? (
        <CheckCircleIcon
          className={`${compact ? 'absolute top-3 right-3 size-5' : 'h-6 w-6 shrink-0'} ${checkStyle}`}
        />
      ) : null}
    </button>
  )
}

const ToggleCard = ({
  checked,
  title,
  compact = false,
  tone = 'business',
  onClick,
}: {
  checked: boolean
  title: string
  compact?: boolean
  tone?: DiscoveryChannelCode
  onClick: () => void
}) => {
  const selectedStyle =
    tone === 'homes'
      ? 'border-[#35B952] bg-[#F1FCF3] dark:border-[#68D27E] dark:bg-[#173520]'
      : tone === 'rooms'
        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/25'
        : 'border-orange-500 bg-orange-50 dark:bg-orange-950/25'
  const indicatorStyle =
    tone === 'homes'
      ? 'border-[#35B952] bg-[#35B952]'
      : tone === 'rooms'
        ? 'border-sky-600 bg-sky-600'
        : 'border-orange-500 bg-orange-500'
  const focusStyle =
    tone === 'homes'
      ? 'focus-visible:outline-[#35B952]'
      : tone === 'rooms'
        ? 'focus-visible:outline-sky-500'
        : 'focus-visible:outline-orange-500'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`flex w-full touch-manipulation items-center rounded-2xl border text-left transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.985] ${focusStyle} ${
        compact ? 'min-h-12 gap-2.5 px-3 py-2.5' : 'min-h-16 gap-3 p-4'
      } ${
        checked
          ? selectedStyle
          : 'border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? `${indicatorStyle} text-white` : 'border-neutral-300 dark:border-neutral-600'}`}
      >
        {checked ? <CheckCircleIcon className="h-4 w-4" /> : null}
      </span>
      <span className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-50">{title}</span>
    </button>
  )
}

const UnitInput = ({
  name,
  defaultValue,
  suffix,
  placeholder,
}: {
  name: string
  defaultValue: string
  suffix: string
  placeholder?: string
}) => (
  <div className="relative">
    <Input
      name={name}
      defaultValue={defaultValue}
      inputMode="decimal"
      pattern="(?=.*[1-9])[0-9,]*(\.[0-9]{1,2})?"
      placeholder={placeholder || '0'}
      className="pe-20!"
    />
    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-xs text-neutral-500">
      {suffix}
    </span>
  </div>
)

const readDraftText = (value: ListingDraftValue | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readDraftValues = (value: ListingDraftValue | undefined) =>
  value ? (Array.isArray(value) ? value : [value]) : []

const mapLegacyUsageToUseCases = (value: ListingDraftValue | undefined, fallback: UseCaseCode[]) => {
  const usage = readDraftText(value)
  if (usage === 'residence') return ['residential'] as UseCaseCode[]
  if (usage === 'business') return fallback.filter((code) => code !== 'residential')
  return fallback
}

const offersFromLegacy = (value: ListingDraftValue | undefined): OfferTypeCode[] => {
  const listingType = readDraftText(value)
  if (listingType === 'sale_and_rent') return ['sale', 'rent']
  if (listingType === 'event_booking') return ['contact_organizer']
  if (
    listingType === 'sale' ||
    listingType === 'rent' ||
    listingType === 'sublease' ||
    listingType === 'business_transfer' ||
    listingType === 'contact_organizer'
  ) {
    return [listingType]
  }
  return ['rent']
}

const resolveDiscoveryChannel = (
  savedChannel: string,
  propertyTypeCode: PropertyTypeCode,
  usageType: string
): DiscoveryChannelCode => {
  if (
    (savedChannel === 'homes' || savedChannel === 'rooms' || savedChannel === 'business') &&
    getDiscoveryChannel(savedChannel)?.propertyTypeCodes.includes(propertyTypeCode)
  ) {
    return savedChannel
  }

  if (
    ['rental_room', 'apartment', 'dormitory', 'flat', 'serviced_apartment', 'monthly_hotel'].includes(propertyTypeCode)
  ) {
    return 'rooms'
  }

  if (
    ['office', 'retail_space', 'warehouse', 'factory', 'hotel_resort'].includes(propertyTypeCode) ||
    ((propertyTypeCode === 'shophouse' || propertyTypeCode === 'home_office' || propertyTypeCode === 'land') &&
      usageType === 'business')
  ) {
    return 'business'
  }

  return 'homes'
}

export default Page
