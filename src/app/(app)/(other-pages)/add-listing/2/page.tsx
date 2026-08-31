'use client'

import BusinessDetails from '@/components/add-listing/BusinessDetails'
import HomesDetails from '@/components/add-listing/HomesDetails'
import MonthlyStayDetails from '@/components/add-listing/MonthlyStayDetails'
import LongdoLocationPicker from '@/components/map/LongdoLocationPicker'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getBusinessSpaceType, getDiscoveryChannel, getPropertyType } from '@/data/propertyTaxonomy'
import { getListingDraft, saveListingDraftToCloud, saveListingStep, type ListingDraft } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import { BuildingOffice2Icon, CheckIcon, HomeModernIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [marker, setMarker] = useState(THAILAND_CENTER)
  const [hasConfirmedMarker, setHasConfirmedMarker] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)
  const [street, setStreet] = useState('')
  const [subdistrict, setSubdistrict] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    router.prefetch('/add-listing/3')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedLng = readText(savedDraft.lngMapPosition)
      const savedLat = readText(savedDraft.latMapPosition)
      const savedPosition = parseSavedLocation(savedLng, savedLat)
      setDraft(savedDraft)
      setMarker(savedPosition || THAILAND_CENTER)
      setHasConfirmedMarker(Boolean(savedPosition))
      setStreet(readText(savedDraft.Street))
      setSubdistrict(readText(savedDraft.subdistrict))
      setDistrict(readText(savedDraft.city))
      setProvince(readText(savedDraft.state))
      setPostalCode(readText(savedDraft.Postal))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY
    if (!hasConfirmedMarker || !apiKey) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsResolvingAddress(true)
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
        if (address.error) throw new Error(address.error)

        const roadAddress = [address.house_num, address.road].filter(Boolean).join(' ')
        setStreet((current) => current || roadAddress)
        setSubdistrict(address.subdistrict || '')
        setDistrict(address.district || '')
        setProvince(address.province || '')
        setPostalCode(address.postcode ? String(address.postcode) : '')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setLocationError(
            isThai
              ? 'อ่านที่อยู่จากหมุดไม่สำเร็จ กรุณาตรวจสอบและกรอกที่อยู่ด้านล่าง'
              : 'Unable to read the address from the pin. Please check and complete the address below.'
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsResolvingAddress(false)
      }
    }, 450)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [hasConfirmedMarker, isThai, marker.lat, marker.lng])

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
  const isIndustrialBusiness = discoveryChannel === 'business' && ['warehouse', 'factory'].includes(propertyTypeCode)
  const isHospitalityBusiness = discoveryChannel === 'business' && propertyTypeCode === 'hotel_resort'
  const isMonthlyPortfolio = discoveryChannel === 'rooms' && listingScope === 'multi_unit'
  const showsBedrooms = showsRooms && !isMonthlyPortfolio
  const showsBathrooms = !isLand && !isHospitalityBusiness && !isMonthlyPortfolio
  const showsFloorNumber = !isLand && ['single_unit', 'space_slot'].includes(listingScope)
  const showsTotalFloors = !isLand
  const showsFurnishing =
    !isLand && (discoveryChannel !== 'business' || ['shophouse', 'home_office', 'office'].includes(propertyTypeCode))
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
    : discoveryChannel === 'business'
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
  const visibleAmenities =
    discoveryChannel === 'business' && propertyTypeCode !== 'hotel_resort'
      ? amenities.filter((amenity) => !['swimming_pool', 'fitness', 'pet_friendly'].includes(amenity.code))
      : amenities

  const useCurrentLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError(isThai ? 'อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง' : 'Location is not supported on this device.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMarker({ lng: coords.longitude, lat: coords.latitude })
        setHasConfirmedMarker(true)
      },
      () =>
        setLocationError(
          isThai
            ? 'ไม่สามารถอ่านตำแหน่งได้ กรุณาอนุญาต Location หรือลากหมุดเอง'
            : 'Unable to get your location. Allow location access or drag the pin manually.'
        ),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmitForm = async (formData: FormData) => {
    if (!hasConfirmedMarker) {
      setLocationError(
        isThai
          ? 'กรุณาค้นหาสถานที่หรือแตะแผนที่เพื่อยืนยันตำแหน่งอสังหา'
          : 'Search for the place or tap the map to confirm the property location.'
      )
      return
    }
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

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-6">
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

        <SectionCard title={isThai ? 'ปักหมุดที่ตั้งอสังหา' : 'Pin the property location'}>
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl bg-[#f1f7f4] p-4 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between dark:bg-emerald-950/25">
              <div>
                <p className="font-sarabun text-sm font-semibold text-[#123f32] dark:text-emerald-200">
                  {isThai
                    ? '1. ค้นหาชื่อโครงการ ถนน หรือสถานที่ใกล้เคียง'
                    : '1. Search a project, road or nearby place'}
                </p>
                <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-600 dark:text-neutral-300">
                  {isThai
                    ? 'แผนที่เริ่มจากประเทศไทย เลือกผลค้นหาแล้วลากหมุดให้ตรงหน้าทรัพย์มากที่สุด'
                    : 'The map starts at Thailand. Select a result, then drag the pin to the exact property entrance.'}
                </p>
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 font-sarabun text-sm font-medium text-emerald-800 transition hover:border-emerald-400 dark:border-emerald-900 dark:bg-neutral-900 dark:text-emerald-200"
              >
                <MapPinIcon className="size-5" />
                {isThai ? 'ใช้ตำแหน่งปัจจุบัน' : 'Use current location'}
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#dbe8e2] shadow-sm dark:border-neutral-700">
              <div className="h-[22rem] lg:h-[28rem]">
                <LongdoLocationPicker
                  apiKey={process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}
                  value={marker}
                  hasMarker={hasConfirmedMarker}
                  initialZoom={hasConfirmedMarker ? 16 : 6}
                  locale={isThai ? 'th' : 'en'}
                  onChange={(location) => {
                    setMarker(location)
                    setHasConfirmedMarker(true)
                    setLocationError('')
                  }}
                />
              </div>
            </div>

            <div
              role="status"
              className={`flex flex-col gap-1 rounded-2xl border px-4 py-3 font-sarabun text-sm sm:flex-row sm:items-center sm:justify-between ${
                hasConfirmedMarker
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300'
              }`}
            >
              <span className="font-medium">
                {hasConfirmedMarker
                  ? isResolvingAddress
                    ? isThai
                      ? 'กำลังอ่านที่อยู่จากหมุด...'
                      : 'Reading the address from the pin...'
                    : isThai
                      ? 'ยืนยันพิกัดแล้ว ตรวจสอบที่อยู่ด้านล่างอีกครั้ง'
                      : 'Coordinates confirmed. Check the address below.'
                  : isThai
                    ? 'ยังไม่ได้ปักหมุด กรุณาค้นหาหรือแตะแผนที่'
                    : 'No pin yet. Search or tap the map.'}
              </span>
              {hasConfirmedMarker ? (
                <span className="font-mono text-xs opacity-75">
                  {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                </span>
              ) : null}
            </div>

            {locationError ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-sarabun text-sm text-red-700"
              >
                {locationError}
              </p>
            ) : null}

            <div className="border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <h3 className="font-sarabun text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {isThai ? '2. ตรวจสอบที่อยู่จากหมุด' : '2. Check the address from the pin'}
              </h3>
              <p className="mt-1 font-sarabun text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                {isThai
                  ? 'ระบบเติมเขตการปกครองให้อัตโนมัติ คุณแก้เลขที่ ถนน ซอย หรือรายละเอียดเพิ่มเติมได้'
                  : 'Administrative fields are filled automatically. You can edit the house number, road or soi.'}
              </p>

              <div className="mt-5 space-y-5">
                <FormItem label={isThai ? 'บ้านเลขที่ ถนน และซอย' : 'House number, road and soi'}>
                  <Input
                    name="Street"
                    value={street}
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder={isThai ? 'เช่น 24 ถนนสุขุมวิท ซอย 39' : 'e.g. 24 Sukhumvit Road, Soi 39'}
                  />
                </FormItem>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormItem label={isThai ? 'แขวง / ตำบล' : 'Subdistrict'}>
                    <Input
                      name="subdistrict"
                      value={subdistrict}
                      onChange={(event) => setSubdistrict(event.target.value)}
                    />
                  </FormItem>
                  <FormItem label={isThai ? 'เขต / อำเภอ' : 'District'}>
                    <Input name="city" value={district} onChange={(event) => setDistrict(event.target.value)} />
                  </FormItem>
                  <FormItem label={isThai ? 'จังหวัด' : 'Province'}>
                    <Input
                      name="state"
                      value={province}
                      onChange={(event) => setProvince(event.target.value)}
                      required
                    />
                  </FormItem>
                  <FormItem label={isThai ? 'รหัสไปรษณีย์' : 'Postal code'}>
                    <Input
                      name="Postal"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      inputMode="numeric"
                      pattern="[0-9]{5}"
                      placeholder="10110"
                    />
                  </FormItem>
                  <FormItem label={isThai ? 'เลขห้อง / ยูนิต (ไม่บังคับ)' : 'Room / unit number (optional)'}>
                    <Input
                      name="room-number"
                      defaultValue={readText(draft['room-number'])}
                      placeholder={isThai ? 'เช่น A-1208' : 'e.g. A-1208'}
                    />
                  </FormItem>
                </div>
              </div>
            </div>

            <input type="hidden" name="country-region" value="Thailand" />
            <input type="hidden" name="latMapPosition" value={hasConfirmedMarker ? marker.lat : ''} />
            <input type="hidden" name="lngMapPosition" value={hasConfirmedMarker ? marker.lng : ''} />
          </div>
        </SectionCard>

        {!isLand ? (
          <SectionCard title={coreDetailsTitle}>
            <div className="grid gap-5 sm:grid-cols-2">
              {needsLandArea ? (
                <FormItem label={isThai ? 'ขนาดที่ดิน' : 'Land area'}>
                  <UnitInput
                    name="landAreaSqm"
                    defaultValue={readText(draft.landAreaSqm)}
                    suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                    placeholder={isThai ? 'กรอกขนาดที่ดิน' : 'Enter land area'}
                  />
                </FormItem>
              ) : null}

              <FormItem label={usableAreaLabel}>
                <UnitInput
                  name="usableAreaSqm"
                  defaultValue={readText(draft.usableAreaSqm)}
                  suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                  placeholder={isThai ? 'กรอกขนาดพื้นที่' : 'Enter area'}
                />
              </FormItem>

              {showsBedrooms ? (
                <FormItem label={isThai ? 'ห้องนอน' : 'Bedrooms'}>
                  <Input
                    name="Bedroom"
                    defaultValue={readText(draft.Bedroom)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'กรอกจำนวน' : 'Enter number'}
                  />
                </FormItem>
              ) : null}

              {showsBathrooms ? (
                <FormItem label={bathroomLabel}>
                  <Input
                    name="Bathroom"
                    defaultValue={readText(draft.Bathroom)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'กรอกจำนวน' : 'Enter number'}
                  />
                </FormItem>
              ) : null}

              <FormItem label={parkingLabel}>
                <Input
                  name="Parking"
                  defaultValue={readText(draft.Parking)}
                  type="number"
                  min="0"
                  placeholder={isThai ? 'กรอกจำนวน' : 'Enter number'}
                />
              </FormItem>

              {showsFloorNumber ? (
                <FormItem label={isThai ? 'ชั้นที่' : 'Floor'}>
                  <Input
                    name="floorNo"
                    defaultValue={readText(draft.floorNo)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'เช่น 5' : 'e.g. 5'}
                  />
                </FormItem>
              ) : null}

              {showsTotalFloors ? (
                <FormItem label={isThai ? 'จำนวนชั้นทั้งหมด' : 'Total floors'}>
                  <Input
                    name="totalFloors"
                    defaultValue={readText(draft.totalFloors)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'เช่น 12' : 'e.g. 12'}
                  />
                </FormItem>
              ) : null}

              {showsFurnishing ? (
                <FormItem label={isThai ? 'เฟอร์นิเจอร์' : 'Furnishing'}>
                  <Select
                    name="furnishingStatus"
                    defaultValue={readText(draft.furnishingStatus)}
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
          </SectionCard>
        ) : null}

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

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7 dark:border-neutral-800 dark:bg-neutral-900">
    <h2 className="font-sarabun text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
)

const UnitInput = ({
  name,
  defaultValue,
  suffix,
  placeholder,
  required,
}: {
  name: string
  defaultValue: string
  suffix: string
  placeholder?: string
  required?: boolean
}) => (
  <div className="relative">
    <Input
      name={name}
      defaultValue={defaultValue}
      inputMode="decimal"
      pattern="[0-9,]*(\.[0-9]{1,2})?"
      placeholder={placeholder || '0'}
      required={required}
      className="pe-20!"
    />
    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-4 text-xs text-neutral-500">
      {suffix}
    </span>
  </div>
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

export default Page
