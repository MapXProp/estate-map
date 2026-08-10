'use client'

import { ListingType } from '@/type'
import * as Headless from '@headlessui/react'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import { BedDouble, Grid2X2, House, Store } from 'lucide-react'
import { Fragment, useState } from 'react'
import { formTabs } from './HeroSearchForm'
import { RealEstateHeroSearchForm, RealEstateSearchTab } from './RealEstateHeroSearchForm'

const propertyTabs = [
  { value: 'all', label: 'ทั้งหมด', icon: Grid2X2, tone: 'text-[#123f32]' },
  { value: 'homes', label: 'ที่อยู่อาศัย', icon: House, tone: 'text-[#176b50]' },
  { value: 'rooms', label: 'ห้องเช่ารายเดือน', icon: BedDouble, tone: 'text-[#2a8063]' },
  { value: 'business', label: 'พื้นที่ธุรกิจ', icon: Store, tone: 'text-[#f04b2f]' },
] as const

const HeroSearchFormSmall = ({ className, initTab = 'Stays' }: { className?: string; initTab: ListingType }) => {
  const [propertyTab, setPropertyTab] = useState<RealEstateSearchTab>('all')

  if (initTab === 'RealEstates') {
    return (
      <div className={clsx('hero-search-form-sm', className)}>
        <div className="flex h-20 items-center justify-center gap-7 min-[900px]:gap-10">
          {propertyTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = propertyTab === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                title={tab.label}
                aria-label={tab.label}
                aria-pressed={isActive}
                onClick={() => setPropertyTab(tab.value)}
                className={clsx(
                  'group relative flex h-full min-w-12 flex-col items-center justify-center gap-1 text-neutral-400 transition hover:text-neutral-700 focus-visible:outline-none',
                  isActive && tab.tone
                )}
              >
                <Icon className="size-6" strokeWidth={isActive ? 2 : 1.7} />
                <span className="text-[11px] font-medium whitespace-nowrap">{tab.label}</span>
                <span
                  className={clsx(
                    'absolute inset-x-1 bottom-1 h-0.5 rounded-full transition',
                    isActive ? (tab.value === 'business' ? 'bg-[#f04b2f]' : 'bg-[#176b50]') : 'bg-transparent'
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
            onSelectedTabChange={setPropertyTab}
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
