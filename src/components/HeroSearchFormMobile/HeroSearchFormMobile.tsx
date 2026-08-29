'use client'

import { ButtonCircle } from '@/shared/Button'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonThird from '@/shared/ButtonThird'
import { ListingType } from '@/type'
import T from '@/utils/getT'
import { CloseButton, Dialog, DialogPanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import {
  Airplane02Icon,
  Car05Icon,
  FilterVerticalIcon,
  HotAirBalloonFreeIcons,
  House03Icon,
  RealEstate02Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTimeoutFn } from 'react-use'
import MobilePropertySearch from '../property-home/MobilePropertySearch'

// The property homepage is the primary route. Keep its search available immediately,
// while loading the legacy travel forms only when a visitor actually opens those routes.
const CarSearchFormMobile = dynamic(() => import('./car-search-form/CarSearchFormMobile'))
const ExperienceSearchFormMobile = dynamic(() => import('./experience-search-form/ExperienceSearchFormMobile'))
const FlightSearchFormMobile = dynamic(() => import('./flight-search-form/FlightSearchFormMobile'))
const RealestateSearchFormMobile = dynamic(() => import('./real-estate-search-form/RealestateSearchFormMobile'))
const StaySearchFormMobile = dynamic(() => import('./stay-search-form/StaySearchFormMobile'))

const formTabs: { name: ListingType; icon: IconSvgElement; formComponent: React.ComponentType<{}> }[] = [
  { name: 'Stays', icon: House03Icon, formComponent: StaySearchFormMobile },
  { name: 'Cars', icon: Car05Icon, formComponent: CarSearchFormMobile },
  { name: 'Experiences', icon: HotAirBalloonFreeIcons, formComponent: ExperienceSearchFormMobile },
  { name: 'RealEstates', icon: RealEstate02Icon, formComponent: RealestateSearchFormMobile },
  { name: 'Flights', icon: Airplane02Icon, formComponent: FlightSearchFormMobile },
]

const HeroSearchFormMobile = ({
  className,
  compactMapHeader = false,
}: {
  className?: string
  compactMapHeader?: boolean
}) => {
  const [showModal, setShowModal] = useState(false)

  // FOR RESET ALL DATA WHEN CLICK CLEAR BUTTON
  const [showDialog, setShowDialog] = useState(false)
  let [, , resetIsShowingDialog] = useTimeoutFn(() => setShowDialog(true), 1)

  // pathname
  const pathname = usePathname()
  const isPropertyHome =
    pathname === '/' ||
    pathname === '/property-home' ||
    pathname === '/homes' ||
    pathname === '/rooms' ||
    pathname === '/buy' ||
    pathname === '/rent' ||
    pathname === '/business' ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/account') ||
    pathname === '/properties/map' ||
    pathname.startsWith('/add-listing') ||
    pathname.startsWith('/real-estate-categories') ||
    pathname.startsWith('/real-estate-listings')

  if (isPropertyHome) {
    return <MobilePropertySearch className={className} compactMapHeader={compactMapHeader} />
  }

  let locationText = 'Where to?'
  let weekText = 'Any week'
  let guestsText = 'Add guests'
  let activeTabName: ListingType = 'Stays'

  if (pathname.startsWith('/experience-categories')) {
    activeTabName = 'Experiences'
    locationText = 'Experiences in Bali'
    weekText = 'Mar 22 - 27'
    guestsText = '2 guests'
  } else if (pathname.startsWith('/car-categories')) {
    activeTabName = 'Cars'
    locationText = 'Car rentals in Tokyo'
    weekText = 'Mar 25 - 28'
    guestsText = ''
  } else if (pathname.startsWith('/flight-categories')) {
    activeTabName = 'Flights'
    locationText = 'Flights to Rome'
    weekText = 'Mar 10 - 15'
    guestsText = '1 guest'
  } else if (pathname.startsWith('/stay-categories')) {
    activeTabName = 'Stays'
    locationText = 'Homes in London'
    weekText = 'Mar 20 - 25'
    guestsText = '1 guest'
  } else if (pathname.startsWith('/real-estate-categories')) {
    activeTabName = 'RealEstates'
    locationText = 'Real Estates in Bali'
    weekText = 'Rent'
    guestsText = '$10k - $1M'
  }

  const defaultIndex = Math.max(
    0,
    formTabs.findIndex((t) => t.name === activeTabName)
  )

  //
  function closeModal() {
    setShowModal(false)
  }

  function openModal() {
    setShowModal(true)
  }

  const renderButtonOpenModal = () => {
    return (
      <button
        onClick={openModal}
        className="relative flex w-full items-center rounded-full border border-neutral-200 px-4 py-2 pe-11 shadow-lg dark:border-neutral-600"
      >
        <HugeiconsIcon icon={Search01Icon} size={20} color="currentColor" strokeWidth={1.5} />

        <div className="ms-4 flex-1 overflow-hidden text-start">
          <span className="block text-sm/5 font-medium">{locationText}</span>
          <span className="mt-px flex gap-2 text-sm/5 font-normal text-neutral-500 dark:text-neutral-400">
            {weekText} {activeTabName !== 'Cars' && <span>•</span>} {guestsText}
          </span>
        </div>

        <span className="absolute end-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 transform items-center justify-center rounded-full border border-neutral-200 sm:flex dark:border-neutral-600 dark:text-neutral-300">
          <HugeiconsIcon icon={FilterVerticalIcon} size={20} color="currentColor" strokeWidth={1.5} />
        </span>
      </button>
    )
  }

  return (
    <div className={clsx(className, 'relative z-10 w-full max-w-lg')}>
      {renderButtonOpenModal()}
      <Dialog as="div" className="relative z-max" onClose={closeModal} open={showModal}>
        <div className="fixed inset-0 bg-neutral-100 dark:bg-neutral-900">
          <div className="flex h-full">
            <DialogPanel
              transition
              className="relative flex-1 transition data-closed:translate-y-28 data-closed:opacity-0"
            >
              {showDialog && (
                <TabGroup
                  manual
                  className="relative flex h-full flex-1 flex-col justify-between"
                  defaultIndex={defaultIndex}
                >
                  <div className="absolute end-3 top-2 z-10">
                    <CloseButton color="light" as={ButtonCircle} className="size-7!">
                      <XMarkIcon className="size-4!" />
                    </CloseButton>
                  </div>

                  <TabList className="flex justify-center gap-x-8 sm:gap-x-14">
                    {formTabs.map((tab) => {
                      return (
                        <Tab
                          key={tab.name}
                          className={clsx(
                            'group relative -mx-3 flex shrink-0 cursor-pointer items-center justify-center px-3 pt-10 pb-5 text-neutral-400 data-[selected]:text-neutral-950 dark:data-[selected]:text-neutral-100'
                          )}
                        >
                          <div className="relative">
                            <span className="sr-only">{tab.name}</span>
                            <HugeiconsIcon icon={tab.icon} size={26} />
                            <span className="absolute top-full mt-1 hidden h-0.5 w-full bg-neutral-800 group-data-[selected]:block dark:bg-neutral-100" />
                          </div>
                        </Tab>
                      )
                    })}
                  </TabList>

                  <TabPanels className="flex flex-1 overflow-hidden px-1.5 sm:px-4">
                    <div className="hidden-scrollbar flex-1 overflow-y-auto pt-2 pb-4">
                      {formTabs.map((tab) => (
                        <TabPanel
                          key={tab.name}
                          as="div"
                          className="animate-[myblur_0.4s_ease-in-out] transition-opacity"
                        >
                          <tab.formComponent />
                        </TabPanel>
                      ))}
                    </div>
                  </TabPanels>
                  <div className="flex justify-between border-t border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
                    <ButtonThird
                      onClick={() => {
                        setShowDialog(false)
                        resetIsShowingDialog()
                      }}
                    >
                      {T['HeroSearchForm']['Clear all']}
                    </ButtonThird>
                    <ButtonPrimary type="submit" form="form-hero-search-form-mobile" onClick={closeModal}>
                      <HugeiconsIcon icon={Search01Icon} size={16} />
                      <span>{T['HeroSearchForm']['search']}</span>
                    </ButtonPrimary>
                  </div>
                </TabGroup>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default HeroSearchFormMobile
