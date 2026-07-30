'use client'

import { propertyGroups, propertyUseCases } from '@/data/property-navigation'
import {
  CloseButton,
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react'
import { ChevronDown, Map, MapPin, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const locations = [
  ['กรุงเทพมหานคร', 'Bangkok'],
  ['เชียงใหม่', 'Chiang Mai'],
  ['ชลบุรี', 'Chon Buri'],
  ['ภูเก็ต', 'Phuket'],
  ['ขอนแก่น', 'Khon Kaen'],
  ['นครราชสีมา', 'Nakhon Ratchasima'],
] as const

const tabs = ['ตามประเภททรัพย์', 'ตามการใช้งาน', 'ตามทำเล'] as const

const PropertyMegaMenu = () => {
  const [activeGroup, setActiveGroup] = useState<(typeof propertyGroups)[number]['value']>('residential')
  const selectedGroup = useMemo(
    () => propertyGroups.find((group) => group.value === activeGroup) ?? propertyGroups[0],
    [activeGroup]
  )

  return (
    <Popover className="group">
      <PopoverButton className="flex min-h-10 items-center rounded-full px-2.5 text-sm font-semibold whitespace-nowrap text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 focus:outline-hidden min-[1100px]:px-3.5 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white">
        ประเภทอสังหา
        <ChevronDown className="ms-1 size-4 transition group-data-open:rotate-180" aria-hidden="true" />
      </PopoverButton>

      <PopoverBackdrop
        transition
        className="fixed inset-0 top-20 z-30 bg-neutral-950/10 transition duration-200 dark:bg-black/25 data-closed:opacity-0"
      />

      <PopoverPanel
        anchor={{ to: 'bottom', gap: 18 }}
        transition
        className="z-50 max-h-[calc(100vh-7rem)] w-[min(1040px,calc(100vw-2rem))] overflow-y-auto rounded-[28px] border border-neutral-200/80 bg-white p-5 shadow-2xl shadow-neutral-900/15 transition duration-200 min-[900px]:p-6 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40 data-closed:-translate-y-1 data-closed:opacity-0"
      >
        <div className="mb-5 flex items-start justify-between gap-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#176b50] dark:text-emerald-300">
              <Sparkles className="size-3.5" />
              ค้นหาแบบไม่ต้องจำชื่อหมวด
            </p>
            <h2 className="mt-1 text-xl font-semibold text-neutral-950 dark:text-white">คุณกำลังมองหาพื้นที่แบบไหน</h2>
          </div>
          <CloseButton
            as={Link}
            href="/real-estate-categories/all"
            className="hidden items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 min-[900px]:inline-flex dark:border-neutral-700 dark:text-neutral-200"
          >
            <Search className="size-4" />
            ค้นหาทั้งหมด
          </CloseButton>
        </div>

        <TabGroup>
          <TabList className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 transition outline-none hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white data-selected:bg-[#123f32] data-selected:text-white data-selected:shadow-sm dark:data-selected:bg-emerald-800"
              >
                {tab}
              </Tab>
            ))}
          </TabList>

          <TabPanels className="mt-5">
            <TabPanel className="outline-none">
              <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
                {propertyGroups.map((group) => {
                  const Icon = group.icon
                  const isActive = group.value === activeGroup

                  return (
                    <button
                      key={group.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveGroup(group.value)}
                      className={`rounded-2xl border p-3 text-left transition min-[900px]:p-4 ${
                        isActive
                          ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm ring-1 ring-orange-500 dark:bg-orange-950/40 dark:text-orange-100'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-orange-700'
                      }`}
                    >
                      <Icon
                        className={`size-5 ${isActive ? 'text-orange-600' : 'text-[#176b50] dark:text-emerald-300'}`}
                      />
                      <span className="mt-3 block text-sm font-semibold">{group.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {group.description}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 border-t border-neutral-100 pt-5 dark:border-neutral-800">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="font-semibold text-neutral-950 dark:text-white">{selectedGroup.label}</p>
                  <CloseButton
                    as={Link}
                    href={`/real-estate-categories/all?property_group=${selectedGroup.value}`}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-300"
                  >
                    ดูทั้งหมดในกลุ่ม
                  </CloseButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.types.map(([value, label]) => (
                    <CloseButton
                      as={Link}
                      key={value}
                      href={`/real-estate-categories/all?property_type=${value}`}
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm text-neutral-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-orange-600 dark:hover:bg-orange-950/30 dark:hover:text-orange-100"
                    >
                      {label}
                    </CloseButton>
                  ))}
                </div>
              </div>
            </TabPanel>

            <TabPanel className="outline-none">
              <div className="grid gap-2 min-[900px]:grid-cols-2">
                {propertyUseCases.map((useCase) => {
                  const Icon = useCase.icon
                  return (
                    <CloseButton
                      as={Link}
                      key={useCase.value}
                      href={`/real-estate-categories/all?use_case=${useCase.value}`}
                      className="group/item flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left transition hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-700 dark:hover:border-orange-700 dark:hover:bg-orange-950/20"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6f1] text-[#176b50] group-hover/item:bg-orange-100 group-hover/item:text-orange-700 dark:bg-emerald-950 dark:text-emerald-200">
                        <Icon className="size-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                          {useCase.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
                          {useCase.description}
                        </span>
                      </span>
                    </CloseButton>
                  )
                })}
              </div>
            </TabPanel>

            <TabPanel className="outline-none">
              <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-3">
                {locations.map(([thaiName, englishName]) => (
                  <CloseButton
                    as={Link}
                    key={thaiName}
                    href={`/real-estate-categories/all?location=${encodeURIComponent(thaiName)}`}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-left transition hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-700 dark:hover:border-orange-700 dark:hover:bg-orange-950/20"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6f1] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                      <MapPin className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-neutral-950 dark:text-white">{thaiName}</span>
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">{englishName}</span>
                    </span>
                  </CloseButton>
                ))}
              </div>
              <CloseButton
                as={Link}
                href="/real-estate-categories-map/all"
                className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 p-3 text-sm font-semibold text-neutral-700 transition hover:border-[#176b50] hover:bg-[#edf6f1] hover:text-[#176b50] dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
              >
                <Map className="size-5" />
                สำรวจอสังหาบนแผนที่
              </CloseButton>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </PopoverPanel>
    </Popover>
  )
}

export default PropertyMegaMenu
