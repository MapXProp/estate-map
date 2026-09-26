'use client'

import { useListingStepAnalytics } from '@/hooks/useListingStepAnalytics'

import BusinessDetails from '@/components/add-listing/BusinessDetails'
import HomesDetails from '@/components/add-listing/HomesDetails'
import { useListingFlowProgress } from '@/components/add-listing/ListingFlowProgressContext'
import MonthlyStayDetails from '@/components/add-listing/MonthlyStayDetails'
import LongdoLocationPicker from '@/components/map/LongdoLocationPicker'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getBusinessSpaceType, getDiscoveryChannel, getPropertyType } from '@/data/propertyTaxonomy'
import { getListingDraft, saveListingDraftToCloud, saveListingStep, type ListingDraft } from '@/lib/listingDraft'
import { clearListingFormErrors, showListingFieldError, validateListingForm } from '@/lib/listingFormValidation'
import { isListingPoint, parseListingCoordinates, type ListingPoint } from '@/lib/listingLocation'
import { consumeListingPublishValidationIssue, listingValidationMessage } from '@/lib/listingPublishValidation'
import Input from '@/shared/Input'
import {
  BuildingOffice2Icon,
  CheckIcon,
  ExclamationCircleIcon,
  HomeModernIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import FormItem from '../FormItem'

const amenities = [
  { code: 'air_conditioning', labelTh: 'เครื่องปรับอากาศ', labelEn: 'Air conditioning' },
  { code: 'parking', labelTh: 'ที่จอดรถ', labelEn: 'Parking' },
  { code: 'elevator', labelTh: 'ลิฟต์', labelEn: 'Elevator' },
  { code: 'security', labelTh: 'ระบบรักษาความปลอดภัย', labelEn: 'Security' },
  { code: 'swimming_pool', labelTh: 'สระว่ายน้ำ', labelEn: 'Swimming pool' },
  { code: 'fitness', labelTh: 'ฟิตเนส', labelEn: 'Fitness center' },
  { code: 'wifi', labelTh: 'อินเทอร์เน็ต / Wi-Fi', labelEn: 'Internet / Wi-Fi' },
  { code: 'pet_friendly', labelTh: 'เลี้ยงสัตว์ได้', labelEn: 'Pet friendly' },
]

const THAILAND_CENTER = { lng: 100.9925, lat: 15.87 }

type LongdoAddress = {
  country?: string
  province?: string
  district?: string
  subdistrict?: string
  postcode?: string | number
  house_num?: string
  road?: string
  error?: string
}

const Page = () => {
  const router = useRouter()
  const { setSubmittingStep } = useListingFlowProgress()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  useListingStepAnalytics(2, Boolean(draft))
  const [marker, setMarker] = useState(THAILAND_CENTER)
  const [coordinateInput, setCoordinateInput] = useState('')
  const [hasMarker, setHasMarker] = useState(false)
  const [hasConfirmedMarker, setHasConfirmedMarker] = useState(false)
  const [addressLookupVersion, setAddressLookupVersion] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [addressExpanded, setAddressExpanded] = useState(false)
  const [coordinateError, setCoordinateError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [locationValidationError, setLocationValidationError] = useState(false)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)
  const [street, setStreet] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const submitLockRef = useRef(false)
  const gpsRequest = useRef(0)
  const addressEdits = useRef({ street: 0, subdistrict: 0, district: 0, province: 0, postalCode: 0 })
  const streetIsManual = useRef(false)
  const addressDetailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(
    () => () => {
      gpsRequest.current++
    },
    []
  )

  useEffect(() => {
    router.prefetch('/add-listing/3')
    submitLockRef.current = false
    setSubmittingStep(null)
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedLng = readText(savedDraft.lngMapPosition)
      const savedLat = readText(savedDraft.latMapPosition)
      const savedPosition = parseSavedLocation(savedLng, savedLat)
      setDraft(savedDraft)
      setMarker(savedPosition || THAILAND_CENTER)
      setCoordinateInput(savedPosition ? formatCoordinatePair(savedPosition) : '')
      setHasMarker(Boolean(savedPosition))
      setHasConfirmedMarker(Boolean(savedPosition))
      setStreet(readText(savedDraft.Street))
      streetIsManual.current = Boolean(readText(savedDraft.Street))
      setSubdistrict(readText(savedDraft.subdistrict))
      setDistrict(readText(savedDraft.city))
      setProvince(readText(savedDraft.state))
      setPostalCode(readText(savedDraft.Postal))
    })

    return () => cancelAnimationFrame(frame)
  }, [router, setSubmittingStep])

  useEffect(() => {
    if (!draft) return
    const validationIssue = consumeListingPublishValidationIssue()
    if (!validationIssue || validationIssue.step !== 2) return

    const message = listingValidationMessage(validationIssue, locale)
    if (
      validationIssue.fieldName &&
      ['state', 'city', 'subdistrict', 'Street', 'Postal'].includes(validationIssue.fieldName)
    ) {
      setAddressExpanded(true)
      if (addressDetailsRef.current) addressDetailsRef.current.open = true
    }
    if (validationIssue.target === 'location') {
      setLocationError(message)
      setLocationValidationError(true)
    }

    const frame = window.requestAnimationFrame(() => {
      if (
        validationIssue.fieldName &&
        showListingFieldError({ fieldName: validationIssue.fieldName, message, isThai })
      ) {
        return
      }

      const target = document.getElementById('listing-location-section')
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
  }, [draft, isThai, locale])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY
    if (!hasMarker || !apiKey || !addressLookupVersion) return

    const controller = new AbortController()
    let cancelled = false
    const edits = { ...addressEdits.current }
    setIsResolvingAddress(true)
    const timer = window.setTimeout(async () => {
      const timeout = window.setTimeout(() => controller.abort(), 8000)
      try {
        const params = new URLSearchParams({
          lon: String(marker.lng),
          lat: String(marker.lat),
          locale: isThai ? 'th' : 'en',
          noelevation: '1',
          key: apiKey,
        })
        const response = await fetch(`https://api.longdo.com/map/services/address?${params}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('reverse geocoding failed')
        const address = (await response.json()) as LongdoAddress
        if (controller.signal.aborted) return
        if (address.error) throw new Error(address.error)
        if (!address.province) throw new Error('Province unavailable')

        const roadAddress = [address.house_num, address.road].filter(Boolean).join(' ')
        if (!streetIsManual.current && edits.street === addressEdits.current.street) setStreet(roadAddress)
        if (edits.subdistrict === addressEdits.current.subdistrict) setSubdistrict(address.subdistrict || '')
        if (edits.district === addressEdits.current.district) setDistrict(address.district || '')
        if (edits.province === addressEdits.current.province) setProvince(address.province || '')
        if (edits.postalCode === addressEdits.current.postalCode)
          setPostalCode(address.postcode ? String(address.postcode) : '')
        if (address.province) window.requestAnimationFrame(() => clearListingFormErrors())
      } catch {
        if (!cancelled) {
          // Do not leave an old administrative address attached to a new pin.
          if (edits.subdistrict === addressEdits.current.subdistrict) setSubdistrict('')
          if (edits.district === addressEdits.current.district) setDistrict('')
          if (edits.province === addressEdits.current.province) setProvince('')
          if (edits.postalCode === addressEdits.current.postalCode) setPostalCode('')
          if (!streetIsManual.current && edits.street === addressEdits.current.street) setStreet('')
          setAddressExpanded(true)
          setLocationError(
            isThai
              ? 'เติมที่อยู่ไม่สำเร็จ กรุณาใส่จังหวัดและตรวจสอบที่อยู่'
              : 'Address lookup unavailable. Enter the province and check the address.'
          )
        }
      } finally {
        window.clearTimeout(timeout)
        if (!cancelled) setIsResolvingAddress(false)
      }
    }, 450)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [hasMarker, addressLookupVersion, isThai, marker.lat, marker.lng])

  const propertyGroup = readText(draft?.property_group_code) || 'residential'
  const discoveryChannel = readText(draft?.discovery_channel_code) || 'homes'
  const propertyType = getPropertyType(readText(draft?.property_type_code))
  const businessSpaceTypes = [readText(draft?.space_type_code), ...readValues(draft?.['spaceTypeCodes[]'])]
    .filter((code, index, all) => Boolean(code) && all.indexOf(code) === index)
    .map((code) => getBusinessSpaceType(code))
    .filter((item): item is NonNullable<ReturnType<typeof getBusinessSpaceType>> => Boolean(item))
  const selectedAmenities = useMemo(() => readValues(draft?.['amenities[]']), [draft])
  const showsRooms = propertyGroup === 'residential' || propertyGroup === 'mixed_use'
  const propertyTypeCode = propertyType?.code || ''
  const isLand = propertyTypeCode === 'land' || propertyGroup === 'land'
  const needsLandArea = [
    'detached_house',
    'semi_detached_house',
    'townhouse',
    'shophouse',
    'home_office',
    'warehouse',
    'factory',
    'hotel_resort',
  ].includes(propertyTypeCode)
  const listingScope = readText(draft?.listing_scope)
  const accommodationModel = readText(draft?.accommodation_model)
  const isHospitalityBusiness = discoveryChannel === 'business' && propertyTypeCode === 'hotel_resort'
  const isMonthlyPortfolio = discoveryChannel === 'rooms' && listingScope === 'multi_unit'
  const showsBedrooms = showsRooms && !isMonthlyPortfolio
  const showsBathrooms = !isLand && !isHospitalityBusiness && !isMonthlyPortfolio
  const showsFloorNumber = !isLand && ['single_unit', 'space_slot'].includes(listingScope)
  const showsTotalFloors = !isLand
  const showsFurnishing =
    !isLand && (discoveryChannel !== 'business' || ['shophouse', 'home_office', 'office'].includes(propertyTypeCode))
  const visibleAmenities =
    discoveryChannel === 'business' && propertyTypeCode !== 'hotel_resort'
      ? amenities.filter((amenity) => !['swimming_pool', 'fitness', 'pet_friendly'].includes(amenity.code))
      : amenities

  const changeMarker = (location: ListingPoint) => {
    if (!isListingPoint(location)) return
    gpsRequest.current++
    setIsLocating(false)
    setGpsAccuracy(null)
    setMarker(location)
    setCoordinateInput(formatCoordinatePair(location))
    setCoordinateError('')
    setHasMarker(true)
    setHasConfirmedMarker(false)
    setAddressLookupVersion((version) => version + 1)
    setLocationError('')
    setLocationValidationError(false)
  }

  const useCurrentLocation = () => {
    setLocationError('')
    setLocationValidationError(false)
    if (!navigator.geolocation) {
      setLocationError(isThai ? 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง' : 'Location is not supported on this device.')
      setLocationValidationError(true)
      return
    }
    const request = ++gpsRequest.current
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (request !== gpsRequest.current) return
        const nextMarker = { lng: coords.longitude, lat: coords.latitude }
        setIsLocating(false)
        if (!isListingPoint(nextMarker)) {
          setLocationError(
            isThai ? 'กรุณาค้นหาที่อยู่ของทรัพย์ในประเทศไทย' : 'Search for the property address in Thailand.'
          )
          return
        }
        changeMarker(nextMarker)
        setGpsAccuracy(Math.round(coords.accuracy))
      },
      () => {
        if (request !== gpsRequest.current) return
        setIsLocating(false)
        setLocationError(
          isThai
            ? 'ใช้ตำแหน่งปัจจุบันไม่ได้ พิมพ์ที่อยู่เพื่อค้นหาได้เลย'
            : 'Current location unavailable. Search by address instead.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const applyCoordinateInput = () => {
    const nextMarker = parseListingCoordinates(coordinateInput)
    if (!nextMarker) {
      setCoordinateError(
        isThai
          ? 'ใส่พิกัดในประเทศไทย เช่น 13.75633, 100.50177'
          : 'Enter coordinates in Thailand, e.g. 13.75633, 100.50177.'
      )
      return
    }

    changeMarker(nextMarker)
  }

  const handleSubmitForm = async (formData: FormData) => {
    clearListingFormErrors()
    if (!hasConfirmedMarker) {
      setLocationError(
        isThai ? 'ตรวจหมุดบนแผนที่ แล้วกด “ใช้ตำแหน่งนี้”' : 'Check the pin, then choose “Use this location”.'
      )
      setLocationValidationError(true)
      window.requestAnimationFrame(() => {
        const target = document.getElementById('listing-location-section')
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        window.setTimeout(
          () =>
            target
              ?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')
              ?.focus({ preventScroll: true }),
          280
        )
      })
      return
    }
    setLocationValidationError(false)
    setLocationError('')
    if (isResolvingAddress) {
      setLocationError(
        isThai
          ? 'กำลังเติมที่อยู่ รอสักครู่แล้วกดไปขั้นถัดไปอีกครั้ง'
          : 'Address lookup is in progress. Continue again in a moment.'
      )
      return
    }
    const needsAddressEdit = !province.trim() || (postalCode.trim() && !/^\d{5}$/.test(postalCode))
    if (needsAddressEdit && addressDetailsRef.current) {
      addressDetailsRef.current.open = true
      setAddressExpanded(true)
    }
    if (!validateListingForm({ isThai })) return
    if (submitLockRef.current) return

    submitLockRef.current = true
    setSubmittingStep(2)
    if (isLand) {
      const rai = parseDecimal(formData.get('landAreaRai'))
      const ngan = parseDecimal(formData.get('landAreaNgan'))
      const squareWah = parseDecimal(formData.get('landAreaSqWah'))
      if (rai > 0 || ngan > 0 || squareWah > 0) {
        formData.set('landAreaSqm', formatDecimal(rai * 1600 + ngan * 400 + squareWah * 4))
      } else {
        formData.set('landAreaSqm', '')
      }
    }
    if (!needsLandArea && !isLand) formData.set('landAreaSqm', '')
    if (isLand) formData.set('usableAreaSqm', '')
    if (!showsBedrooms) formData.set('Bedroom', '')
    if (!showsBathrooms) formData.set('Bathroom', '')
    if (isLand) formData.set('Parking', '')
    if (!showsFloorNumber) formData.set('floorNo', '')
    if (!showsTotalFloors) formData.set('totalFloors', '')
    if (!showsFurnishing) formData.set('furnishingStatus', '')
    const savedDraft = saveListingStep(2, formData)
    await saveListingDraftToCloud(savedDraft).catch(() => undefined)
    router.push('/add-listing/3')
  }

  if (!draft) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-800" />
  }

  return (
    <>
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
          <MapPinIcon className="h-4 w-4" />
          {isThai ? 'ทำเลและรายละเอียด' : 'Location & details'}
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {isThai ? 'ข้อมูลที่คนค้นหาใช้ตัดสินใจ' : 'Add the details people need to decide'}
        </h1>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} noValidate className="space-y-6">
        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-neutral-800 ${
                discoveryChannel === 'business'
                  ? 'text-orange-600'
                  : discoveryChannel === 'rooms'
                    ? 'text-sky-600'
                    : 'text-emerald-700'
              }`}
            >
              {discoveryChannel === 'business' ? (
                <BuildingOffice2Icon className="size-5" />
              ) : (
                <HomeModernIcon className="size-5" />
              )}
            </span>
            <p className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {[
                isThai
                  ? getDiscoveryChannel(discoveryChannel)?.nameTh || discoveryChannel
                  : getDiscoveryChannel(discoveryChannel)?.nameEn || discoveryChannel,
                isThai ? propertyType?.nameTh : propertyType?.nameEn,
                businessSpaceTypes.map((item) => (isThai ? item.nameTh : item.nameEn)).join(', '),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </section>

        <SectionCard
          id="listing-location-section"
          title={isThai ? 'ทรัพย์อยู่ที่ไหน?' : 'Where is the property?'}
          invalid={locationValidationError}
          errorText={locationValidationError ? locationError : ''}
        >
          <div className="space-y-4">
            <LongdoLocationPicker
              apiKey={process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}
              value={marker}
              hasMarker={hasMarker}
              confirmed={hasConfirmedMarker}
              initialZoom={hasMarker ? 18 : 6}
              initialSearch={readText(draft.placeName)}
              locale={isThai ? 'th' : 'en'}
              locating={isLocating}
              onUseCurrentLocation={useCurrentLocation}
              onChange={changeMarker}
              onInteractionStart={() => {
                gpsRequest.current++
                setIsLocating(false)
                setGpsAccuracy(null)
                setHasConfirmedMarker(false)
                setLocationValidationError(false)
              }}
              onConfirm={() => {
                setHasConfirmedMarker(true)
                setLocationValidationError(false)
                setLocationError('')
              }}
            />
            {gpsAccuracy !== null && (
              <p role="status" className="text-xs leading-5 text-neutral-500">
                {isThai
                  ? `ตำแหน่งจากเครื่องอาจคลาดเคลื่อนประมาณ ${gpsAccuracy.toLocaleString()} ม. ตรวจหมุดอีกครั้ง`
                  : `Device accuracy is approximately ${gpsAccuracy.toLocaleString()} m. Check the pin.`}
              </p>
            )}
            {locationError && !locationValidationError && (
              <p
                role="alert"
                className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
              >
                {locationError}
              </p>
            )}
            {hasMarker && (
              <details
                ref={addressDetailsRef}
                data-listing-address-details
                open={addressExpanded}
                onToggle={(event) => setAddressExpanded(event.currentTarget.open)}
                className="group rounded-2xl border border-neutral-200 dark:border-neutral-700"
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf5f1] text-[#176b50]">
                    <MapPinIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-neutral-500">
                      {isThai ? 'ที่อยู่ประกาศ' : 'Listing address'}
                    </span>
                    <span
                      data-listing-address-summary
                      role="status"
                      className="mt-1 block text-sm leading-5 text-neutral-700 dark:text-neutral-200"
                    >
                      {isResolvingAddress
                        ? isThai
                          ? 'กำลังเติมที่อยู่จากหมุด…'
                          : 'Looking up the address…'
                        : [street, subdistrict, district, province].filter(Boolean).join(' · ') ||
                          (isThai ? 'เพิ่มที่อยู่' : 'Add address')}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-[#176b50] dark:text-emerald-300">
                    {isThai ? 'แก้ไข' : 'Edit'}
                  </span>
                </summary>
                <div className="space-y-4 border-t border-neutral-100 p-4 dark:border-neutral-800">
                  <FormItem label={isThai ? 'เลขที่ ถนน ซอย (ถ้ามี)' : 'House number, road or soi (optional)'}>
                    <Input
                      name="Street"
                      value={street}
                      onChange={(event) => {
                        streetIsManual.current = true
                        addressEdits.current.street++
                        setStreet(event.target.value)
                      }}
                      placeholder={isThai ? 'เช่น 24 ถนนสุขุมวิท ซอย 39' : 'e.g. 24 Sukhumvit Road, Soi 39'}
                    />
                  </FormItem>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormItem label={isThai ? 'แขวง / ตำบล' : 'Subdistrict'}>
                      <Input
                        name="subdistrict"
                        value={subdistrict}
                        onChange={(event) => {
                          addressEdits.current.subdistrict++
                          setSubdistrict(event.target.value)
                        }}
                      />
                    </FormItem>
                    <FormItem label={isThai ? 'เขต / อำเภอ' : 'District'}>
                      <Input
                        name="city"
                        value={district}
                        onChange={(event) => {
                          addressEdits.current.district++
                          setDistrict(event.target.value)
                        }}
                      />
                    </FormItem>
                    <FormItem label={isThai ? 'จังหวัด' : 'Province'}>
                      <Input
                        name="state"
                        value={province}
                        required
                        onChange={(event) => {
                          addressEdits.current.province++
                          setProvince(event.target.value)
                        }}
                      />
                    </FormItem>
                    <FormItem label={isThai ? 'รหัสไปรษณีย์ (ถ้ามี)' : 'Postal code (optional)'}>
                      <Input
                        name="Postal"
                        value={postalCode}
                        inputMode="numeric"
                        pattern="[0-9]{5}"
                        onChange={(event) => {
                          addressEdits.current.postalCode++
                          setPostalCode(event.target.value)
                        }}
                      />
                    </FormItem>
                    {showsFloorNumber ? (
                      <FormItem label={isThai ? 'เลขห้อง / ยูนิต (ถ้ามี)' : 'Room / unit (optional)'}>
                        <Input name="room-number" defaultValue={readText(draft['room-number'])} />
                      </FormItem>
                    ) : (
                      <input type="hidden" name="room-number" value={readText(draft['room-number'])} />
                    )}
                  </div>
                </div>
              </details>
            )}
            <details data-coordinate-tools className="border-t border-neutral-100 pt-2 dark:border-neutral-800">
              <summary className="w-fit cursor-pointer py-2 text-xs text-neutral-500">
                {isThai ? 'มีพิกัดอยู่แล้ว' : 'Already have coordinates?'}
              </summary>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="coordinate-input"
                  aria-label={isThai ? 'ละติจูด, ลองจิจูด' : 'Latitude, longitude'}
                  value={coordinateInput}
                  onChange={(event) => {
                    setCoordinateInput(event.target.value)
                    setCoordinateError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyCoordinateInput()
                    }
                  }}
                  placeholder="13.75633, 100.50177"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={applyCoordinateInput}
                  className="min-h-11 shrink-0 rounded-xl border border-neutral-300 px-4 text-sm font-medium"
                >
                  {isThai ? 'แสดงบนแผนที่' : 'Show on map'}
                </button>
              </div>
              {coordinateError && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                  {coordinateError}
                </p>
              )}
            </details>
            <input type="hidden" name="country-region" value="Thailand" />
            <input type="hidden" name="latMapPosition" value={hasConfirmedMarker ? marker.lat : ''} />
            <input type="hidden" name="lngMapPosition" value={hasConfirmedMarker ? marker.lng : ''} />
          </div>
        </SectionCard>
        {discoveryChannel === 'homes' && propertyType ? (
          <HomesDetails draft={draft} propertyTypeCode={propertyType.code} isThai={isThai} />
        ) : null}

        {discoveryChannel === 'rooms' && propertyType ? (
          <MonthlyStayDetails
            draft={draft}
            propertyTypeCode={propertyType.code}
            listingScope={listingScope}
            accommodationModel={accommodationModel}
            isThai={isThai}
          />
        ) : null}

        {discoveryChannel === 'business' && propertyType ? (
          <BusinessDetails draft={draft} propertyTypeCode={propertyType.code} isThai={isThai} />
        ) : null}

        {!isLand ? (
          <SectionCard title={isThai ? 'จุดเด่นและสิ่งอำนวยความสะดวก' : 'Features & amenities'}>
            <input type="hidden" name="amenities[]" value="" />
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleAmenities.map((amenity) => (
                <label
                  key={amenity.code}
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-orange-300 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <input
                    type="checkbox"
                    name="amenities[]"
                    value={amenity.code}
                    defaultChecked={selectedAmenities.includes(amenity.code)}
                    className="peer sr-only"
                  />
                  <span className="flex size-6 items-center justify-center rounded-lg border border-neutral-300 text-transparent transition peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-checked:text-white dark:border-neutral-600">
                    <CheckIcon className="size-4" />
                  </span>
                  <span className="font-sarabun text-sm text-neutral-700 dark:text-neutral-200">
                    {isThai ? amenity.labelTh : amenity.labelEn}
                  </span>
                </label>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </Form>
    </>
  )
}

const SectionCard = ({
  id,
  title,
  invalid = false,
  errorText,
  children,
}: {
  id?: string
  title: string
  invalid?: boolean
  errorText?: string
  children: React.ReactNode
}) => (
  <section
    id={id}
    data-listing-section-invalid={invalid || undefined}
    className={`scroll-mt-32 rounded-[28px] border bg-white p-5 shadow-sm transition sm:p-7 dark:bg-neutral-900 ${
      invalid
        ? 'border-red-400 shadow-[0_20px_60px_-40px_rgba(220,38,38,0.5)] dark:border-red-700'
        : 'border-neutral-200 dark:border-neutral-800'
    }`}
  >
    <h2
      className={`font-sarabun text-lg font-semibold ${invalid ? 'text-red-700 dark:text-red-300' : 'text-neutral-900 dark:text-neutral-50'}`}
    >
      {title}
    </h2>
    {invalid && errorText ? (
      <p
        role="alert"
        className="mt-2 flex items-start gap-2 font-sarabun text-sm font-medium text-red-600 dark:text-red-400"
      >
        <ExclamationCircleIcon className="mt-0.5 size-5 shrink-0" />
        <span>{errorText}</span>
      </p>
    ) : null}
    <div className="mt-5">{children}</div>
  </section>
)

const readText = (value: ListingDraft[string] | undefined) => (Array.isArray(value) ? value[0] || '' : value || '')
const readValues = (value: ListingDraft[string] | undefined) => (value ? (Array.isArray(value) ? value : [value]) : [])
const parseDecimal = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}
const formatDecimal = (value: number) => String(Math.round(value * 100) / 100)
const parseSavedLocation = (lngValue: string, latValue: string) => {
  if (!lngValue.trim() || !latValue.trim()) return null

  const lng = Number(lngValue)
  const lat = Number(latValue)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return null
  }

  return { lng, lat }
}

const formatCoordinatePair = ({ lat, lng }: { lat: number; lng: number }) => `${lat.toFixed(8)}, ${lng.toFixed(8)}`

export default Page
