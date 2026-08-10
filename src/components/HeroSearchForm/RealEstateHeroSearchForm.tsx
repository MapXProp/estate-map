'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import {
  ButtonSubmit,
  LocationInputField,
  PriceRangeInputField,
  PropertyTypeSelectField,
  VerticalDividerLine,
} from './ui'

export type RealEstateSearchTab = 'all' | 'homes' | 'rooms' | 'business'

interface Props {
  className?: string
  formStyle: 'default' | 'small'
  selectedTab?: RealEstateSearchTab
  onSelectedTabChange?: (tab: RealEstateSearchTab) => void
  showTabs?: boolean
}

const tabs = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'homes', label: 'ที่อยู่อาศัย' },
  { value: 'rooms', label: 'ห้องเช่ารายเดือน' },
  { value: 'business', label: 'พื้นที่ธุรกิจ' },
] as const

const propertyTypesByTab = {
  all: [
    { name: 'บ้าน', value: 'house', description: 'บ้านเดี่ยว บ้านแฝด และบ้านเช่า' },
    { name: 'คอนโด', value: 'condo', description: 'คอนโดสำหรับซื้อหรือเช่า' },
    { name: 'ห้องเช่า', value: 'monthly_room', description: 'อพาร์ตเมนต์ หอพัก และห้องรายเดือน' },
    { name: 'ตึกแถว', value: 'rowhouse', description: 'อยู่อาศัยหรือใช้ทำธุรกิจ' },
    { name: 'ร้านค้า', value: 'retail', description: 'ร้านค้า ล็อคตลาด และคีออส' },
    { name: 'ออฟฟิศ', value: 'office', description: 'สำนักงานและพื้นที่ทำงาน' },
    { name: 'โกดัง / โรงงาน', value: 'warehouse_factory', description: 'พื้นที่จัดเก็บและพื้นที่ผลิต' },
    { name: 'ที่ดิน', value: 'land', description: 'ที่ดินเพื่ออยู่อาศัยหรือธุรกิจ' },
  ],
  homes: [
    { name: 'บ้าน', value: 'house', description: 'บ้านเดี่ยวและบ้านแฝด' },
    { name: 'คอนโด', value: 'condo', description: 'คอนโดมิเนียมสำหรับซื้อหรือเช่า' },
    { name: 'ทาวน์โฮม', value: 'townhome', description: 'ทาวน์เฮาส์และทาวน์โฮม' },
    { name: 'ตึกแถว', value: 'rowhouse', description: 'ตึกแถวสำหรับอยู่อาศัย' },
    { name: 'ที่ดินสร้างบ้าน', value: 'residential_land', description: 'ที่ดินสำหรับสร้างที่อยู่อาศัย' },
  ],
  rooms: [
    { name: 'ห้องเช่า', value: 'monthly_room', description: 'ห้องพักให้เช่ารายเดือน' },
    { name: 'อพาร์ตเมนต์', value: 'apartment', description: 'อพาร์ตเมนต์และเซอร์วิสอพาร์ตเมนต์' },
    { name: 'หอพัก', value: 'dormitory', description: 'หอพักนักเรียน นักศึกษา และคนทำงาน' },
    { name: 'แฟลต', value: 'flat', description: 'แฟลตและที่พักระยะยาว' },
    { name: 'คอนโดให้เช่า', value: 'rental_condo', description: 'ห้องคอนโดสำหรับเช่ารายเดือน' },
  ],
  business: [
    { name: 'ตึกแถว', value: 'commercial_rowhouse', description: 'อาคารพาณิชย์และตึกแถว' },
    { name: 'ร้านค้า', value: 'standalone_retail', description: 'ร้านค้า Standalone และพื้นที่ขายของ' },
    { name: 'ล็อคตลาด / คีออส', value: 'stall_kiosk', description: 'ล็อคในตลาดและล็อคในห้าง' },
    { name: 'ออฟฟิศ', value: 'office', description: 'สำนักงานและ Co-working space' },
    { name: 'โกดัง / โรงงาน', value: 'warehouse_factory', description: 'พื้นที่จัดเก็บและพื้นที่ผลิต' },
    { name: 'ที่ดินธุรกิจ', value: 'business_land', description: 'ที่ดินเพื่อการค้าและอุตสาหกรรม' },
    { name: 'พื้นที่ออกบูธ', value: 'event_space', description: 'งานอีเวนต์และพื้นที่ชั่วคราว' },
  ],
}

export const RealEstateHeroSearchForm: FC<Props> = ({
  className,
  formStyle = 'default',
  selectedTab,
  onSelectedTabChange,
  showTabs = true,
}) => {
  const [internalTab, setInternalTab] = useState<RealEstateSearchTab>('all')
  const tabType = selectedTab ?? internalTab
  const router = useRouter()

  const handleTabChange = (tab: RealEstateSearchTab) => {
    if (selectedTab === undefined) setInternalTab(tab)
    onSelectedTabChange?.(tab)
  }

  // Prefetch the stay categories page to improve performance
  useEffect(() => {
    router.prefetch('/properties/map')
  }, [router])

  const handleFormSubmit = (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())
    console.log('Form submitted', formDataEntries)
    // You can also redirect or perform other actions based on the form data

    const location = formDataEntries['location'] as string
    const channelPrefix = {
      all: '',
      homes: 'บ้านและที่อยู่อาศัย',
      rooms: 'ห้องเช่ารายเดือน',
      business: 'พื้นที่ทำธุรกิจ',
    }[tabType]
    const query = [channelPrefix, location].filter(Boolean).join(' ')
    let url = '/properties/map'

    if (query) {
      url = url + `?q=${encodeURIComponent(query)}`
    }
    router.push(url)
  }

  return (
    <Form
      action={handleFormSubmit}
      className={clsx(
        'relative z-10 w-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'rounded-t-2xl rounded-b-4xl custom-shadow-1',
        formStyle === 'default' &&
          'rounded-t-2xl rounded-b-[40px] shadow-xl xl:rounded-t-3xl xl:rounded-b-[48px] dark:shadow-2xl'
      )}
    >
      {/* RADIO */}
      {showTabs && (
        <Headless.RadioGroup
          value={tabType}
          onChange={handleTabChange}
          aria-label="Real Estate Tab Type"
          name="real_estate_tab_type"
          className={clsx(
            'flex flex-wrap items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700',
            formStyle === 'small' && 'px-7 py-4 xl:px-8',
            formStyle === 'default' && 'px-7 py-4 xl:px-8 xl:py-6'
          )}
        >
          {tabs.map((tab) => (
            <Headless.Field key={tab.value}>
              <Headless.Radio
                value={tab.value}
                className={clsx(
                  'flex cursor-pointer items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition dark:border-neutral-700',
                  tab.value === 'business'
                    ? 'border-orange-200 text-[#b73a25] data-checked:border-[#f04b2f] data-checked:bg-[#f04b2f] data-checked:text-white data-checked:shadow-lg data-checked:shadow-orange-500/20'
                    : tab.value === 'rooms'
                      ? 'border-emerald-100 text-[#247357] data-checked:border-[#247357] data-checked:bg-[#247357] data-checked:text-white data-checked:shadow-lg data-checked:shadow-emerald-900/15'
                      : tab.value === 'homes'
                        ? 'border-emerald-100 text-[#176b50] data-checked:border-[#176b50] data-checked:bg-[#176b50] data-checked:text-white data-checked:shadow-lg data-checked:shadow-emerald-950/15'
                        : 'border-neutral-200 text-neutral-700 data-checked:border-[#123f32] data-checked:bg-[#123f32] data-checked:text-white data-checked:shadow-lg data-checked:shadow-emerald-950/15'
                )}
              >
                {tab.label}
              </Headless.Radio>
            </Headless.Field>
          ))}
        </Headless.RadioGroup>
      )}

      {/*  */}
      <div className="relative flex">
        <LocationInputField
          className="hero-search-form__field-after flex-1"
          placeholder="ทำเลที่ต้องการ"
          description="จังหวัด เขต ย่าน ถนน หรือชื่อโครงการ"
          fieldStyle={formStyle}
        />
        <VerticalDividerLine />
        <PropertyTypeSelectField
          key={tabType}
          fieldStyle={formStyle}
          className="hero-search-form__field-before hero-search-form__field-after flex-1"
          propertyTypes={propertyTypesByTab[tabType]}
          defaultSelected={[]}
          placeholder="ทุกประเภท"
          description="เลือกประเภทอสังหา"
          panelTitle={tabs.find((tab) => tab.value === tabType)?.label}
          tone="mapx"
        />
        <VerticalDividerLine />
        <PriceRangeInputField
          key={`price-${tabType}`}
          fieldStyle={formStyle}
          className="hero-search-form__field-before flex-1"
          clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
          currency="THB"
          min={0}
          max={tabType === 'rooms' ? 200_000 : tabType === 'business' || tabType === 'all' ? 100_000_000 : 50_000_000}
        />

        <ButtonSubmit
          fieldStyle={formStyle}
          className={tabType === 'business' ? 'bg-[#f04b2f]! hover:bg-[#d83c24]!' : 'bg-[#123f32]! hover:bg-[#0b3227]!'}
        />
      </div>
    </Form>
  )
}
