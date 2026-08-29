'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
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
  responsive?: boolean
}

const tabs = [
  { value: 'all', label: 'ทั้งหมด', labelEn: 'All', compactLabel: 'ทั้งหมด', compactLabelEn: 'All' },
  {
    value: 'homes',
    label: 'บ้าน คอนโด & ที่อยู่อาศัย',
    labelEn: 'Homes, condos & residential',
    compactLabel: 'ที่อยู่อาศัย',
    compactLabelEn: 'Homes',
  },
  {
    value: 'rooms',
    label: 'ห้องเช่า & ที่พักรายเดือน',
    labelEn: 'Rooms & monthly rentals',
    compactLabel: 'ห้องเช่ารายเดือน',
    compactLabelEn: 'Monthly rentals',
  },
  {
    value: 'business',
    label: 'พื้นที่ทำธุรกิจ',
    labelEn: 'Business spaces',
    compactLabel: 'พื้นที่ธุรกิจ',
    compactLabelEn: 'Business',
  },
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

const englishPropertyTypes: Record<string, { name: string; description: string }> = {
  house: { name: 'House', description: 'Detached, semi-detached and rental houses' },
  condo: { name: 'Condo', description: 'Condominiums available to buy or rent' },
  monthly_room: { name: 'Rental room', description: 'Apartments, dormitories and monthly rooms' },
  rowhouse: { name: 'Rowhouse', description: 'For residential or business use' },
  retail: { name: 'Retail space', description: 'Shops, market stalls and kiosks' },
  office: { name: 'Office', description: 'Offices and workspaces' },
  warehouse_factory: { name: 'Warehouse / Factory', description: 'Storage and production spaces' },
  land: { name: 'Land', description: 'Land for residential or business use' },
  townhome: { name: 'Townhome', description: 'Townhouses and townhomes' },
  residential_land: { name: 'Residential land', description: 'Land suitable for building a home' },
  apartment: { name: 'Apartment', description: 'Apartments and serviced apartments' },
  dormitory: { name: 'Dormitory', description: 'Student and worker accommodation' },
  flat: { name: 'Flat', description: 'Flats and long-term accommodation' },
  rental_condo: { name: 'Condo for rent', description: 'Condo units available for monthly rent' },
  commercial_rowhouse: { name: 'Commercial rowhouse', description: 'Commercial buildings and rowhouses' },
  standalone_retail: { name: 'Standalone shop', description: 'Standalone retail and selling spaces' },
  stall_kiosk: { name: 'Market stall / Kiosk', description: 'Stalls in markets and shopping centres' },
  business_land: { name: 'Commercial land', description: 'Land for commercial and industrial use' },
  event_space: { name: 'Event space', description: 'Event booths and temporary spaces' },
}

export const RealEstateHeroSearchForm: FC<Props> = ({
  className,
  formStyle = 'default',
  selectedTab,
  onSelectedTabChange,
  showTabs = true,
  responsive = false,
}) => {
  const { locale, propertyZone, setPropertyZone } = usePreferences()
  const isThai = locale === 'th'
  const [uncontrolledSelection, setUncontrolledSelection] = useState<{
    contextZone: RealEstateSearchTab
    tab: RealEstateSearchTab
  }>({ contextZone: propertyZone, tab: propertyZone })
  const internalTab = uncontrolledSelection.contextZone === propertyZone ? uncontrolledSelection.tab : propertyZone
  const tabType = selectedTab ?? internalTab
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([])
  const router = useRouter()

  const handleTabChange = (tab: RealEstateSearchTab) => {
    setSelectedPropertyTypes([])
    if (selectedTab === undefined) {
      setUncontrolledSelection({
        contextZone: tab === 'all' ? propertyZone : tab,
        tab,
      })
    }
    if (tab !== 'all') setPropertyZone(tab)
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
    const channelPrefix = isThai
      ? {
          all: '',
          homes: 'บ้านและที่อยู่อาศัย',
          rooms: 'ห้องเช่ารายเดือน',
          business: 'พื้นที่ทำธุรกิจ',
        }[tabType]
      : {
          all: '',
          homes: 'homes and residential',
          rooms: 'monthly rentals',
          business: 'business spaces',
        }[tabType]
    const query = [channelPrefix, location].filter(Boolean).join(' ')
    const searchParams = new URLSearchParams()
    if (query) searchParams.set('q', query)
    const offerType = String(formDataEntries['offer_type'] || '')
    const minPrice = String(formDataEntries['price_min'] || '')
    const maxPrice = String(formDataEntries['price_max'] || '')
    if (offerType) searchParams.set('offer_type', offerType)
    if (minPrice) searchParams.set('price_min', minPrice)
    if (maxPrice) searchParams.set('price_max', maxPrice)
    formData.getAll('property_type').forEach((propertyType) => searchParams.append('property_type', String(propertyType)))
    const searchString = searchParams.toString()
    router.push(searchString ? `/properties/map?${searchString}` : '/properties/map')
  }

  return (
    <Form
      action={handleFormSubmit}
      className={clsx(
        'relative z-20 w-full bg-white [--form-bg:var(--color-white)] dark:bg-neutral-800 dark:[--form-bg:var(--color-neutral-800)]',
        className,
        formStyle === 'small' && 'rounded-t-2xl rounded-b-4xl custom-shadow-1',
        formStyle === 'default' &&
          'rounded-t-2xl rounded-b-[40px] shadow-xl xl:rounded-t-3xl xl:rounded-b-[48px] dark:shadow-2xl',
        responsive &&
          'rounded-[28px]! border border-neutral-100 shadow-[0_18px_50px_-24px_rgba(18,63,50,0.32)] dark:border-neutral-700'
      )}
    >
      {/* RADIO */}
      {showTabs && (
        <Headless.RadioGroup
          value={tabType}
          onChange={handleTabChange}
          aria-label={isThai ? 'เลือกหมวดอสังหาริมทรัพย์' : 'Choose a property category'}
          name="real_estate_tab_type"
          className={clsx(
            'flex flex-wrap items-center gap-2.5 border-b border-neutral-100 dark:border-neutral-700',
            formStyle === 'small' && 'px-7 py-4 xl:px-8',
            formStyle === 'default' && 'px-7 py-4 xl:px-8 xl:py-6',
            responsive &&
              'grid grid-cols-2 gap-2 px-3.5 py-3 min-[744px]:flex min-[744px]:px-7 min-[744px]:py-4 xl:px-8 xl:py-5'
          )}
        >
          {tabs.map((tab) => (
            <Headless.Field key={tab.value}>
              <Headless.Radio
                value={tab.value}
                className={clsx(
                  'flex cursor-pointer items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition dark:border-neutral-700',
                  responsive &&
                    'min-h-10 justify-center px-2.5 text-center min-[744px]:min-h-0 min-[744px]:justify-start min-[744px]:px-4',
                  tab.value === 'business'
                    ? 'border-[#F2A086] text-[#D94A22] data-checked:border-[#E65A2F] data-checked:bg-[#E65A2F] data-checked:text-white data-checked:shadow-lg data-checked:shadow-[#E65A2F]/20'
                    : tab.value === 'rooms'
                      ? 'border-[#9ED4ED] text-[#1676AE] data-checked:border-[#2D8FC7] data-checked:bg-[#2D8FC7] data-checked:text-white data-checked:shadow-lg data-checked:shadow-[#2D8FC7]/20'
                      : tab.value === 'homes'
                        ? 'border-emerald-100 text-[#176b50] data-checked:border-[#176b50] data-checked:bg-[#176b50] data-checked:text-white data-checked:shadow-lg data-checked:shadow-emerald-950/15'
                        : 'border-neutral-200 text-neutral-700 data-checked:border-[#123f32] data-checked:bg-[#123f32] data-checked:text-white data-checked:shadow-lg data-checked:shadow-emerald-950/15'
                )}
              >
                <span className={clsx(responsive && 'min-[744px]:hidden')}>
                  {isThai ? tab.compactLabel : tab.compactLabelEn}
                </span>
                <span className={clsx(responsive && 'hidden min-[744px]:inline')}>
                  <PropertyCategoryLabel
                    label={isThai ? tab.label : tab.labelEn}
                    ampersandClassName="text-current opacity-55"
                  />
                </span>
              </Headless.Radio>
            </Headless.Field>
          ))}
        </Headless.RadioGroup>
      )}

      {/*  */}
      <div
        className={clsx(
          'relative flex',
          responsive && 'flex-col gap-2 p-3 min-[744px]:flex-row min-[744px]:gap-0 min-[744px]:p-0'
        )}
      >
        <LocationInputField
          className={clsx(
            'hero-search-form__field-after flex-1',
            responsive &&
              'w-full rounded-2xl bg-neutral-50 min-[744px]:w-auto min-[744px]:rounded-none min-[744px]:bg-transparent dark:bg-neutral-900/60 min-[744px]:dark:bg-transparent'
          )}
          placeholder={isThai ? 'ทำเลที่ต้องการ' : 'Preferred location'}
          description={isThai ? 'จังหวัด เขต ย่าน ถนน หรือชื่อโครงการ' : 'Province, district, area, road or project name'}
          ariaLabel={isThai ? 'ค้นหาทำเล' : 'Search for a location'}
          suggestionsLabel={isThai ? 'ทำเลแนะนำ' : 'Suggested locations'}
          fieldStyle={formStyle}
          responsive={responsive}
        />
        <VerticalDividerLine responsive={responsive} />
        <PropertyTypeSelectField
          key={tabType}
          fieldStyle={formStyle}
          className={clsx(
            'hero-search-form__field-before hero-search-form__field-after flex-1',
            responsive &&
              'w-full rounded-2xl bg-neutral-50 min-[744px]:w-auto min-[744px]:rounded-none min-[744px]:bg-transparent dark:bg-neutral-900/60 min-[744px]:dark:bg-transparent'
          )}
          propertyTypes={propertyTypesByTab[tabType].map((propertyType) =>
            isThai ? propertyType : { ...propertyType, ...englishPropertyTypes[propertyType.value] }
          )}
          defaultSelected={[]}
          placeholder={isThai ? 'ทุกประเภท' : 'All property types'}
          description={isThai ? 'เลือกประเภทอสังหา' : 'Choose property type'}
          panelTitle={tabs.find((tab) => tab.value === tabType)?.[isThai ? 'label' : 'labelEn']}
          panelDescription={
            isThai ? 'เลือกได้หลายประเภท หรือเว้นไว้เพื่อดูทั้งหมด' : 'Select multiple types, or leave blank to view all'
          }
          tone="mapx"
          onSelectionChange={setSelectedPropertyTypes}
        />
        <VerticalDividerLine responsive={responsive} />
        <PriceRangeInputField
          fieldStyle={formStyle}
          className={clsx(
            'hero-search-form__field-before flex-1',
            responsive &&
              'w-full rounded-2xl bg-neutral-50 min-[744px]:w-auto min-[744px]:rounded-none min-[744px]:bg-transparent dark:bg-neutral-900/60 min-[744px]:dark:bg-transparent'
          )}
          clearDataButtonClassName={clsx(formStyle === 'small' && 'sm:end-18', formStyle === 'default' && 'sm:end-22')}
          currency="THB"
          description={isThai ? 'เลือกช่วงราคา' : 'Choose price range'}
          panelTitle={isThai ? 'งบประมาณ' : 'Budget'}
          minLabel={isThai ? 'ราคาต่ำสุด' : 'Min price'}
          maxLabel={isThai ? 'ราคาสูงสุด' : 'Max price'}
          priceContext={tabType}
          selectedPropertyTypes={selectedPropertyTypes}
        />

        <ButtonSubmit
          fieldStyle={formStyle}
          responsive={responsive}
          label={isThai ? 'ค้นหา' : 'Search'}
          className={
            tabType === 'business'
              ? 'bg-[#D94A22]! hover:bg-[#BE3E1B]!'
              : tabType === 'rooms'
                ? 'bg-[#1676AE]! hover:bg-[#0D6398]!'
                : 'bg-[#123F32]! hover:bg-[#0B3227]!'
          }
        />
      </div>
    </Form>
  )
}
