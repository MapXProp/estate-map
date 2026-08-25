'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { Map, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
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

const Page = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [marker, setMarker] = useState({ lng: 100.5018, lat: 13.7563 })
  const [hasConfirmedMarker, setHasConfirmedMarker] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    router.prefetch('/add-listing/3')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      const savedLng = readText(savedDraft.lngMapPosition)
      const savedLat = readText(savedDraft.latMapPosition)
      setDraft(savedDraft)
      setMarker({
        lng: parseCoordinate(savedLng, 100.5018),
        lat: parseCoordinate(savedLat, 13.7563),
      })
      setHasConfirmedMarker(Boolean(savedLng && savedLat))
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const propertyGroup = readText(draft?.property_group_code) || 'residential'
  const discoveryChannel = readText(draft?.discovery_channel_code) || 'homes'
  const propertyType = getPropertyType(readText(draft?.property_type_code))
  const businessSpaceType = getBusinessSpaceType(readText(draft?.space_type_code))
  const selectedAmenities = useMemo(() => readValues(draft?.['amenities[]']), [draft])
  const showsRooms = propertyGroup === 'residential' || propertyGroup === 'mixed_use'
  const isLand = propertyGroup === 'land'

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
                isThai ? businessSpaceType?.nameTh : businessSpaceType?.nameEn,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </section>

        <SectionCard title={isThai ? 'ตำแหน่งที่ตั้ง' : 'Location'}>
          <div className="space-y-5">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 font-sarabun text-sm font-medium text-neutral-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <MapPinIcon className="size-5" />
              {isThai ? 'ใช้ตำแหน่งปัจจุบัน' : 'Use current location'}
            </button>
            {locationError ? <p className="font-sarabun text-sm text-red-600">{locationError}</p> : null}

            <FormItem label={isThai ? 'ที่อยู่ / ถนน / ซอย (ไม่บังคับ)' : 'Address / road / soi (optional)'}>
              <Input
                name="Street"
                defaultValue={readText(draft.Street)}
                placeholder={isThai ? 'เช่น ถนนสุขุมวิท 24' : 'e.g. Sukhumvit Soi 24'}
              />
            </FormItem>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label={isThai ? 'แขวง / ตำบล' : 'Subdistrict'}>
                <Input
                  name="subdistrict"
                  defaultValue={readText(draft.subdistrict)}
                  placeholder={isThai ? 'เช่น คลองตัน' : 'e.g. Khlong Tan'}
                />
              </FormItem>
              <FormItem label={isThai ? 'เขต / อำเภอ' : 'District'}>
                <Input
                  name="city"
                  defaultValue={readText(draft.city)}
                  placeholder={isThai ? 'เช่น คลองเตย' : 'e.g. Khlong Toei'}
                />
              </FormItem>
              <FormItem label={isThai ? 'จังหวัด' : 'Province'}>
                <Input
                  name="state"
                  defaultValue={readText(draft.state)}
                  placeholder={isThai ? 'เช่น กรุงเทพมหานคร' : 'e.g. Bangkok'}
                  required
                />
              </FormItem>
              <FormItem label={isThai ? 'รหัสไปรษณีย์' : 'Postal code'}>
                <Input
                  name="Postal"
                  defaultValue={readText(draft.Postal)}
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

            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="h-72 lg:h-96 xl:h-[26rem]">
                <Map center={[marker.lng, marker.lat]} zoom={14}>
                  <MapMarker
                    draggable
                    longitude={marker.lng}
                    latitude={marker.lat}
                    onDragEnd={(lngLat) => {
                      setMarker({ lng: lngLat.lng, lat: lngLat.lat })
                      setHasConfirmedMarker(true)
                    }}
                  >
                    <MarkerContent>
                      <div className="cursor-move rounded-full bg-orange-500 p-1 text-white shadow-lg ring-4 ring-white/80">
                        <MapPinIcon className="size-7" />
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="space-y-1">
                        <p className="font-sarabun font-medium">
                          {isThai ? 'ลากหมุดเพื่อปรับตำแหน่ง' : 'Drag the pin to adjust the location'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                </Map>
              </div>
            </div>
            <p
              role="status"
              className={`inline-flex rounded-full px-3 py-1.5 font-sarabun text-xs font-medium ${
                hasConfirmedMarker
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {hasConfirmedMarker
                ? isThai
                  ? 'บันทึกตำแหน่งแล้ว'
                  : 'Location saved'
                : isThai
                  ? 'ลากหมุดหรือใช้ตำแหน่งปัจจุบัน'
                  : 'Drag the pin or use your current location'}
            </p>
            <input type="hidden" name="country-region" value="Thailand" />
            <input type="hidden" name="latMapPosition" value={hasConfirmedMarker ? marker.lat : ''} />
            <input type="hidden" name="lngMapPosition" value={hasConfirmedMarker ? marker.lng : ''} />
          </div>
        </SectionCard>

        <SectionCard
          title={isLand ? (isThai ? 'ขนาดที่ดิน' : 'Land size') : isThai ? 'ขนาดและข้อมูลหลัก' : 'Size & key details'}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {isLand ? (
              <FormItem label={isThai ? 'ขนาดที่ดิน' : 'Land area'}>
                <UnitInput
                  name="landAreaSqm"
                  defaultValue={readText(draft.landAreaSqm)}
                  suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                />
              </FormItem>
            ) : (
              <FormItem label={isThai ? 'พื้นที่ใช้สอย' : 'Usable area'}>
                <UnitInput
                  name="usableAreaSqm"
                  defaultValue={readText(draft.usableAreaSqm)}
                  suffix={isThai ? 'ตร.ม.' : 'sq.m.'}
                />
              </FormItem>
            )}

            {showsRooms ? (
              <>
                <FormItem label={isThai ? 'ห้องนอน' : 'Bedrooms'}>
                  <Input name="Bedroom" defaultValue={readText(draft.Bedroom)} type="number" min="0" placeholder="0" />
                </FormItem>
                <FormItem label={isThai ? 'ห้องน้ำ' : 'Bathrooms'}>
                  <Input
                    name="Bathroom"
                    defaultValue={readText(draft.Bathroom)}
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                </FormItem>
              </>
            ) : null}

            {!isLand ? (
              <>
                <FormItem label={isThai ? 'ที่จอดรถ' : 'Parking spaces'}>
                  <Input name="Parking" defaultValue={readText(draft.Parking)} type="number" min="0" placeholder="0" />
                </FormItem>
                <FormItem label={isThai ? 'ชั้นที่' : 'Floor'}>
                  <Input
                    name="floorNo"
                    defaultValue={readText(draft.floorNo)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'ไม่ระบุ' : 'Not specified'}
                  />
                </FormItem>
                <FormItem label={isThai ? 'จำนวนชั้นทั้งหมด' : 'Total floors'}>
                  <Input
                    name="totalFloors"
                    defaultValue={readText(draft.totalFloors)}
                    type="number"
                    min="0"
                    placeholder={isThai ? 'ไม่ระบุ' : 'Not specified'}
                  />
                </FormItem>
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
              </>
            ) : null}
          </div>
        </SectionCard>

        {!isLand ? (
          <SectionCard title={isThai ? 'จุดเด่นและสิ่งอำนวยความสะดวก' : 'Features & amenities'}>
            <input type="hidden" name="amenities[]" value="" />
            <div className="grid gap-3 sm:grid-cols-2">
              {amenities.map((amenity) => (
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
  required,
}: {
  name: string
  defaultValue: string
  suffix: string
  required?: boolean
}) => (
  <div className="relative">
    <Input
      name={name}
      defaultValue={defaultValue}
      inputMode="decimal"
      pattern="[0-9,]*(\.[0-9]{1,2})?"
      placeholder="0"
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
const parseCoordinate = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export default Page
