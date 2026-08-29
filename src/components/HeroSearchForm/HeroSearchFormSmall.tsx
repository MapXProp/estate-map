'use client'

import { ListingType } from '@/type'
import * as Headless from '@headlessui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { BedDouble, Grid2X2, House, Store } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { formTabs } from './HeroSearchForm'
import { RealEstateHeroSearchForm, RealEstateSearchTab } from './RealEstateHeroSearchForm'

const propertyTabs = [
  {
    value: 'all',
    label: 'ทั้งหมด',
    labelEn: 'All',
    labelParts: null,
    labelPartsEn: null,
    icon: Grid2X2,
    tone: 'text-[#123f32]',
  },
  {
    value: 'homes',
    label: 'บ้าน คอนโด & ที่อยู่อาศัย',
    labelEn: 'Homes & residential',
    labelParts: ['บ้าน คอนโด', 'ที่อยู่อาศัย'],
    labelPartsEn: ['Homes', 'residential'],
    icon: House,
    tone: 'text-[#176b50]',
  },
  {
    value: 'rooms',
    label: 'ห้องเช่า & ที่พักรายเดือน',
    labelEn: 'Rooms & monthly rentals',
    labelParts: ['ห้องเช่า', 'ที่พักรายเดือน'],
    labelPartsEn: ['Rooms', 'monthly rentals'],
    icon: BedDouble,
    tone: 'text-[#2D8FC7]',
  },
  {
    value: 'business',
    label: 'พื้นที่ทำธุรกิจ',
    labelEn: 'Business spaces',
    labelParts: null,
    labelPartsEn: null,
    icon: Store,
    tone: 'text-[#E65A2F]',
  },
] as const

const HeroSearchFormSmall = ({ className, initTab = 'Stays' }: { className?: string; initTab: ListingType }) => {
  const { locale, propertyZone, setPropertyZone } = usePreferences()
  const isThai = locale === 'th'
  const [propertyTab, setPropertyTab] = useState<RealEstateSearchTab>(propertyZone)

  const selectPropertyTab = (tab: RealEstateSearchTab) => {
    setPropertyTab(tab)
    if (tab !== 'all') setPropertyZone(tab)
  }

  useEffect(() => {
    setPropertyTab(propertyZone)
  }, [propertyZone])

  if (initTab === 'RealEstates') {
    return (
      <div className={clsx('hero-search-form-sm', className)}>
        <div className="flex h-20 items-center justify-center gap-7 min-[900px]:gap-10">
          {propertyTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = propertyTab === tab.value
            const label = isThai ? tab.label : tab.labelEn
            const labelParts = isThai ? tab.labelParts : tab.labelPartsEn
            return (
              <button
                key={tab.value}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={isActive}
                onClick={() => selectPropertyTab(tab.value)}
                className={clsx(
                  'group relative flex h-full min-w-12 flex-col items-center justify-center gap-1 text-neutral-400 transition hover:text-neutral-700 focus-visible:outline-none',
                  isActive && tab.tone
                )}
              >
                <Icon className="size-6" strokeWidth={isActive ? 2 : 1.7} />
                <span className="flex items-baseline text-[11px] font-medium whitespace-nowrap">
                  {labelParts ? (
                    <>
                      <span>{labelParts[0]}</span>
                      <span aria-hidden="true" className="mx-1 text-[0.72em] font-normal opacity-45">
                        &amp;
                      </span>
                      <span>{labelParts[1]}</span>
                    </>
                  ) : (
                    label
                  )}
                </span>
                <span
                  className={clsx(
                    'absolute inset-x-1 bottom-1 h-0.5 rounded-full transition',
                    isActive
                      ? tab.value === 'business'
                        ? 'bg-[#E65A2F]'
                        : tab.value === 'rooms'
                          ? 'bg-[#2D8FC7]'
                          : 'bg-[#176B50]'
                      : 'bg-transparent'
                  )}
                />
              </button>
            )
          })}
        </div>

        <div className="mt-2">
          <RealEstateHeroSearchForm
            formStyle="small"
            selectedTab={propertyTab}
            onSelectedTabChange={selectPropertyTab}
            showTabs={false}
          />
        </div>
      </div>
    )
  }

  return (
    <Headless.TabGroup
      defaultIndex={formTabs.findIndex((tab) => tab.name === initTab)}
      className={clsx('hero-search-form-sm', className)}
    >
      <Headless.TabList className="flex h-20 justify-center gap-x-10">
        {formTabs.map((tab) => {
          return (
            <Headless.Tab
              key={tab.name}
              as="div"
              className={clsx(
                'group relative -mx-3 flex shrink-0 cursor-pointer items-center justify-center px-3 text-neutral-400 hover:text-black focus-visible:outline-hidden data-[selected]:text-neutral-950 dark:hover:text-white dark:data-[selected]:text-neutral-100'
              )}
            >
              <div className="relative">
                <span className="sr-only">{tab.name}</span>
                <HugeiconsIcon icon={tab.icon} size={28} />
                <span className="absolute top-full me-2 mt-1 hidden h-0.5 w-full rounded-full bg-neutral-800 group-data-[selected]:block dark:bg-neutral-100" />
              </div>
            </Headless.Tab>
          )
        })}
      </Headless.TabList>

      <Headless.TabPanels className="mt-2">
        {formTabs.map((tab) => (
          <Headless.TabPanel as={Fragment} key={tab.name}>
            <tab.formComponent formStyle={'small'} />
          </Headless.TabPanel>
        ))}
      </Headless.TabPanels>
    </Headless.TabGroup>
  )
}

export default HeroSearchFormSmall
