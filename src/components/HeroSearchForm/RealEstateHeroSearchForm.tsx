'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import {
  getBusinessSpaceType,
  getDiscoveryChannel,
  getPropertyTypesForDiscoveryChannel,
  primaryBusinessSpaceTypeCodes,
  type DiscoveryChannelCode,
} from '@/data/propertyTaxonomy'
import { savePropertyRecentLocation } from '@/lib/propertyRecentLocations'
import { fetchLongdoPropertyLocation } from '@/lib/propertySearch'
import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useMemo, useState } from 'react'
import {
  ButtonSubmit,
  PriceRangeInputField,
  PropertyLocationInputField,
  PropertyTypeSelectField,
  VerticalDividerLine,
} from './ui'
import type { PropertyTypeSelectSection } from './ui/PropertyTypeSelectField'

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
  const [selectedSpaceTypes, setSelectedSpaceTypes] = useState<string[]>([])
  const router = useRouter()

  const propertyTypeSections = useMemo<PropertyTypeSelectSection[]>(() => {
    const sectionCodes: DiscoveryChannelCode[] =
      tabType === 'all' ? ['homes', 'rooms', 'business'] : [tabType as DiscoveryChannelCode]

    return sectionCodes.map((code) => {
      const channel = getDiscoveryChannel(code)!
      const propertyTypes = getPropertyTypesForDiscoveryChannel(code)
        .filter((item) => code !== 'business' || item.code !== 'retail_space')
        .map((item) => ({
          name: isThai ? item.nameTh : item.nameEn,
          value: item.code,
          description: isThai ? item.description : item.nameEn,
        }))
      const spaceTypes =
        code === 'business'
          ? primaryBusinessSpaceTypeCodes.flatMap((spaceTypeCode) => {
              const item = getBusinessSpaceType(spaceTypeCode)
              return item
                ? [
                    {
                      name: isThai ? item.nameTh : item.nameEn,
                      value: item.code,
                      description: isThai ? item.description : item.nameEn,
                    },
                  ]
                : []
            })
          : undefined

      return {
        id: code,
        name: isThai ? channel.nameTh : channel.nameEn,
        countLabel: spaceTypes ? `${propertyTypes.length} + ${spaceTypes.length}` : String(propertyTypes.length),
        propertyTypes,
        spaceTypes,
        spaceTypesTitle: isThai ? 'ร้านค้า ล็อก และพื้นที่ชั่วคราว' : 'Shops, stalls and temporary spaces',
      }
    })
  }, [isThai, tabType])

  const handleTabChange = (tab: RealEstateSearchTab) => {
    setSelectedPropertyTypes([])
    setSelectedSpaceTypes([])
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

  const handleFormSubmit = async (formData: FormData) => {
    const formDataEntries = Object.fromEntries(formData.entries())
    console.log('Form submitted', formDataEntries)
    // You can also redirect or perform other actions based on the form data

    const location = formDataEntries['location'] as string
    const locationLabel = formDataEntries['location_label'] as string
    const locationSource = String(formDataEntries['location_source'] || 'manual') as 'local' | 'longdo' | 'manual'
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
    formData
      .getAll('property_type')
      .forEach((propertyType) => searchParams.append('property_type', String(propertyType)))
    formData.getAll('space_type').forEach((spaceType) => searchParams.append('space_type', String(spaceType)))
    if (location?.trim()) {
      savePropertyRecentLocation(location, locationLabel, locationSource)
      if (locationSource !== 'local') {
        const place = await fetchLongdoPropertyLocation(location)
        if (place) {
          searchParams.set('lat', String(place.lat))
          searchParams.set('lon', String(place.lon))
          searchParams.set('zoom', '15')
        }
      }
    }
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
        <PropertyLocationInputField
          className={clsx(
            'hero-search-form__field-after flex-1',
            responsive &&
              'w-full rounded-2xl bg-neutral-50 min-[744px]:w-auto min-[744px]:rounded-none min-[744px]:bg-transparent dark:bg-neutral-900/60 min-[744px]:dark:bg-transparent'
          )}
          placeholder={isThai ? 'ทำเลที่ต้องการ' : 'Preferred location'}
          description={
            isThai ? 'จังหวัด เขต ย่าน ถนน หรือชื่อโครงการ' : 'Province, district, area, road or project name'
          }
          ariaLabel={isThai ? 'ค้นหาทำเล' : 'Search for a location'}
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
          sections={propertyTypeSections}
          defaultSelected={[]}
          defaultSelectedSpaceTypes={[]}
          placeholder={isThai ? 'ทุกประเภท' : 'All property types'}
          description={isThai ? 'เลือกประเภทอสังหา' : 'Choose property type'}
          panelTitle={tabs.find((tab) => tab.value === tabType)?.[isThai ? 'label' : 'labelEn']}
          panelDescription={
            isThai ? 'เริ่มจากทุกประเภท แล้วเลือกเพิ่มเมื่ออยากเจาะจง' : 'Start with all types, then refine if needed'
          }
          allTypesLabel={isThai ? 'ทุกประเภทในหมวดนี้' : 'All types in this category'}
          allTypesDescription={isThai ? 'ค้นหาได้ทันทีโดยไม่ต้องเลือกทีละรายการ' : 'Search without selecting each item'}
          selectionSummary={
            isThai
              ? `เลือกแล้ว ${selectedPropertyTypes.length + selectedSpaceTypes.length} ประเภท`
              : `${selectedPropertyTypes.length + selectedSpaceTypes.length} types selected`
          }
          tone="mapx"
          onSelectionChange={setSelectedPropertyTypes}
          onSpaceTypeSelectionChange={setSelectedSpaceTypes}
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
          selectedPropertyTypes={
            selectedSpaceTypes.length ? [...new Set([...selectedPropertyTypes, 'retail_space'])] : selectedPropertyTypes
          }
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
