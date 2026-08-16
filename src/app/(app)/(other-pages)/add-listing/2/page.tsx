'use client'

import { Map, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { getPropertyGroup, getPropertyType } from '@/data/propertyTaxonomy'
import { getListingDraft, saveListingDraftToCloud, saveListingStep, type ListingDraft } from '@/lib/listingDraft'
import Input from '@/shared/Input'
import Select from '@/shared/Select'
import { BuildingOffice2Icon, CheckIcon, HomeModernIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import FormItem from '../FormItem'

const amenities = [
  { code: 'air_conditioning', label: 'เครื่องปรับอากาศ' },
  { code: 'parking', label: 'ที่จอดรถ' },
  { code: 'elevator', label: 'ลิฟต์' },
  { code: 'security', label: 'ระบบรักษาความปลอดภัย' },
  { code: 'swimming_pool', label: 'สระว่ายน้ำ' },
  { code: 'fitness', label: 'ฟิตเนส' },
  { code: 'wifi', label: 'อินเทอร์เน็ต / Wi-Fi' },
  { code: 'pet_friendly', label: 'เลี้ยงสัตว์ได้' },
]

const Page = () => {
  const router = useRouter()
  const [draft, setDraft] = useState<ListingDraft | null>(null)
  const [marker, setMarker] = useState({ lng: 100.5018, lat: 13.7563 })
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    router.prefetch('/add-listing/3')
    const frame = requestAnimationFrame(() => {
      const savedDraft = getListingDraft()
      setDraft(savedDraft)
      setMarker({
        lng: parseCoordinate(readText(savedDraft.lngMapPosition), 100.5018),
        lat: parseCoordinate(readText(savedDraft.latMapPosition), 13.7563),
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [router])

  const propertyGroup = readText(draft?.property_group_code) || 'residential'
  const propertyType = getPropertyType(readText(draft?.property_type_code))
  const selectedAmenities = useMemo(() => readValues(draft?.['amenities[]']), [draft])
  const showsRooms = propertyGroup === 'residential' || propertyGroup === 'mixed_use'
  const isLand = propertyGroup === 'land'

  const useCurrentLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setMarker({ lng: coords.longitude, lat: coords.latitude }),
      () => setLocationError('ไม่สามารถอ่านตำแหน่งได้ กรุณาอนุญาต Location หรือลากหมุดเอง'),
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
          ทำเลและรายละเอียด
        </div>
        <h1 className="font-sarabun text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          ข้อมูลที่คนค้นหาใช้ตัดสินใจ
        </h1>
        <p className="font-sarabun text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          กรอกเฉพาะข้อมูลสำคัญก่อน รายละเอียดย่อยสามารถกลับมาเพิ่มภายหลังได้
        </p>
      </div>

      <Form id="add-listing-form" action={handleSubmitForm} className="space-y-6">
        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm dark:bg-neutral-800">
              {propertyGroup === 'commercial' ? (
                <BuildingOffice2Icon className="size-5" />
              ) : (
                <HomeModernIcon className="size-5" />
              )}
            </span>
            <div>
              <p className="font-sarabun text-xs text-neutral-500">กำลังลงรายละเอียดให้</p>
              <p className="font-sarabun text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {getPropertyGroup(propertyGroup)?.nameTh || propertyGroup} · {propertyType?.nameTh || 'อสังหาริมทรัพย์'}
              </p>
            </div>
          </div>
        </section>

        <SectionCard title="ตำแหน่งที่ตั้ง" description="ระบุตำแหน่งให้ใกล้เคียงที่สุด ผู้ค้นหาจะเห็นทำเลได้ง่ายขึ้น">
          <div className="space-y-5">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 font-sarabun text-sm font-medium text-neutral-700 transition hover:border-orange-300 hover:text-orange-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <MapPinIcon className="size-5" />
              ใช้ตำแหน่งปัจจุบัน
            </button>
            {locationError ? <p className="font-sarabun text-sm text-red-600">{locationError}</p> : null}

            <FormItem label="ที่อยู่ / ถนน / ซอย" desccription="ไม่ต้องใส่ข้อมูลส่วนตัว เช่น ชื่อเจ้าของทรัพย์">
              <Input name="Street" defaultValue={readText(draft.Street)} placeholder="เช่น ถนนสุขุมวิท 24" required />
            </FormItem>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormItem label="แขวง / ตำบล">
                <Input name="subdistrict" defaultValue={readText(draft.subdistrict)} placeholder="เช่น คลองตัน" />
              </FormItem>
              <FormItem label="เขต / อำเภอ">
                <Input name="city" defaultValue={readText(draft.city)} placeholder="เช่น คลองเตย" required />
              </FormItem>
              <FormItem label="จังหวัด">
                <Input name="state" defaultValue={readText(draft.state)} placeholder="เช่น กรุงเทพมหานคร" required />
              </FormItem>
              <FormItem label="รหัสไปรษณีย์">
                <Input
                  name="Postal"
                  defaultValue={readText(draft.Postal)}
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  placeholder="10110"
                />
              </FormItem>
              <FormItem label="เลขห้อง / ยูนิต" desccription="เว้นว่างได้">
                <Input name="room-number" defaultValue={readText(draft['room-number'])} placeholder="เช่น A-1208" />
              </FormItem>
            </div>

            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="h-72 lg:h-96 xl:h-[26rem]">
                <Map center={[marker.lng, marker.lat]} zoom={14}>
                  <MapMarker
                    draggable
                    longitude={marker.lng}
                    latitude={marker.lat}
                    onDragEnd={(lngLat) => setMarker({ lng: lngLat.lng, lat: lngLat.lat })}
                  >
                    <MarkerContent>
                      <div className="cursor-move rounded-full bg-orange-500 p-1 text-white shadow-lg ring-4 ring-white/80">
                        <MapPinIcon className="size-7" />
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="space-y-1">
                        <p className="font-sarabun font-medium">ลากหมุดเพื่อปรับตำแหน่ง</p>
                        <p className="text-xs text-neutral-500">
                          {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                </Map>
              </div>
            </div>
            <input type="hidden" name="country-region" value="Thailand" />
            <input type="hidden" name="latMapPosition" value={marker.lat} />
            <input type="hidden" name="lngMapPosition" value={marker.lng} />
          </div>
        </SectionCard>

        <SectionCard
          title={isLand ? 'ขนาดที่ดิน' : 'ขนาดและข้อมูลหลัก'}
          description="ตัวเลขที่ครบช่วยให้ประกาศติดตัวกรองการค้นหาได้ถูกต้อง"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {isLand ? (
              <FormItem label="ขนาดที่ดิน" desccription="กรอกเป็นตารางเมตร">
                <UnitInput name="landAreaSqm" defaultValue={readText(draft.landAreaSqm)} suffix="ตร.ม." required />
              </FormItem>
            ) : (
              <FormItem label="พื้นที่ใช้สอย" desccription="กรอกเป็นตารางเมตร">
                <UnitInput name="usableAreaSqm" defaultValue={readText(draft.usableAreaSqm)} suffix="ตร.ม." required />
              </FormItem>
            )}

            {showsRooms ? (
              <>
                <FormItem label="ห้องนอน">
                  <Input name="Bedroom" defaultValue={readText(draft.Bedroom)} type="number" min="0" placeholder="0" />
                </FormItem>
                <FormItem label="ห้องน้ำ">
                  <Input
                    name="Bathroom"
                    defaultValue={readText(draft.Bathroom)}
                    type="number"
                    min="0"
                    placeholder="0"
                    required
                  />
                </FormItem>
              </>
            ) : null}

            {!isLand ? (
              <>
                <FormItem label="ที่จอดรถ">
                  <Input name="Parking" defaultValue={readText(draft.Parking)} type="number" min="0" placeholder="0" />
                </FormItem>
                <FormItem label="ชั้นที่">
                  <Input
                    name="floorNo"
                    defaultValue={readText(draft.floorNo)}
                    type="number"
                    min="0"
                    placeholder="ไม่ระบุ"
                  />
                </FormItem>
                <FormItem label="จำนวนชั้นทั้งหมด">
                  <Input
                    name="totalFloors"
                    defaultValue={readText(draft.totalFloors)}
                    type="number"
                    min="0"
                    placeholder="ไม่ระบุ"
                  />
                </FormItem>
                <FormItem label="เฟอร์นิเจอร์">
                  <Select
                    name="furnishingStatus"
                    defaultValue={readText(draft.furnishingStatus)}
                    className="[&_select]:h-11 [&_select]:rounded-2xl"
                  >
                    <option value="">ไม่ระบุ</option>
                    <option value="fully_furnished">ครบ พร้อมอยู่</option>
                    <option value="partly_furnished">มีบางส่วน</option>
                    <option value="unfurnished">ไม่มีเฟอร์นิเจอร์</option>
                  </Select>
                </FormItem>
              </>
            ) : null}
          </div>
        </SectionCard>

        {!isLand ? (
          <SectionCard title="จุดเด่นและสิ่งอำนวยความสะดวก" description="เลือกเท่าที่มีจริง ไม่จำเป็นต้องเลือกให้ครบ">
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
                  <span className="font-sarabun text-sm text-neutral-700 dark:text-neutral-200">{amenity.label}</span>
                </label>
              ))}
            </div>
          </SectionCard>
        ) : null}

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <SparklesIcon className="mt-0.5 size-5 shrink-0" />
          <p className="font-sarabun text-sm leading-6">
            แนะนำให้กรอกทำเลและขนาดให้ครบ เพราะเป็นสองข้อมูลหลักที่ผู้ซื้อและผู้เช่าใช้กรองประกาศ
          </p>
        </div>
      </Form>
    </>
  )
}

const SectionCard = ({
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
    <div className="mt-6">{children}</div>
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
