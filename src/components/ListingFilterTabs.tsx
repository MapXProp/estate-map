'use client'

import NcInputNumber from '@/components/NcInputNumber'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import { Button } from '@/shared/Button'
import ButtonClose from '@/shared/ButtonClose'
import ButtonPrimary from '@/shared/ButtonPrimary'
import ButtonThird from '@/shared/ButtonThird'
import { Checkbox, CheckboxField, CheckboxGroup } from '@/shared/Checkbox'
import { Description, Fieldset, Label } from '@/shared/fieldset'
import T from '@/utils/getT'
import {
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { FilterVerticalIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Form from 'next/form'
import { useEffect, useState } from 'react'
import { PriceRangeSlider } from './PriceRangeSlider'

type CheckboxFilter = {
  label: string
  name: string
  tabUIType: 'checkbox'
  options: {
    name: string
    value?: string
    description?: string
    defaultChecked?: boolean
  }[]
}
type PriceRangeFilter = {
  name: string
  label: string
  tabUIType: 'price-range'
  min: number
  max: number
  step?: number
  currency?: 'USD' | 'THB'
}
type SelectNumberFilter = {
  name: string
  label: string
  tabUIType: 'select-number'
  options: {
    name: string
    max: number
  }[]
}

type ListingFilterOption = {
  label: string
  name: string
  tabUIType: string
  min?: number
  max?: number
  step?: number
  currency?: 'USD' | 'THB'
  options?: {
    name: string
    value?: string
    description?: string
    defaultChecked?: boolean
    max?: number
  }[]
}
type ListingFilterVariant = 'default' | 'property-map'

const demo_filters_options: ListingFilterOption[] = [
  {
    name: 'type-of-place',
    label: 'Type of place',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Entire place',
        value: 'entire_place',
        description: 'Have a place to yourself',
        defaultChecked: true,
      },
      {
        name: 'Private room',
        value: 'private_room',
        description: 'Have your own room and share some common spaces',
        defaultChecked: true,
      },
      {
        name: 'Hotel room',
        value: 'hotel_room',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Shared room',
        value: 'shared_room',
        description: 'Stay in a shared space, like a common room',
      },
    ],
  },
  {
    label: 'Price per day',
    name: 'price-per-day',
    tabUIType: 'price-range',
    min: 0,
    max: 1000,
  },
  {
    label: 'Rooms & Beds',
    name: 'rooms-beds',
    tabUIType: 'select-number',
    options: [
      { name: 'Beds', max: 10 },
      { name: 'Bedrooms', max: 10 },
      { name: 'Bathrooms', max: 10 },
    ],
  },
  {
    label: 'Amenities',
    name: 'amenities',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Kitchen',
        value: 'kitchen',
        description: 'Have a place to yourself',
        defaultChecked: true,
      },
      {
        name: 'Air conditioning',
        value: 'air_conditioning',
        description: 'Have your own room and share some common spaces',
        defaultChecked: true,
      },
      {
        name: 'Heating',
        value: 'heating',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Dryer',
        value: 'dryer',
        description: 'Stay in a shared space, like a common room',
      },
      {
        name: 'Washer',
        value: 'washer',
        description: 'Stay in a shared space, like a common room',
      },
    ],
  },
  {
    name: 'Facilities',
    label: 'Facilities',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Free parking on premise',
        value: 'free_parking_on_premise',
        description: 'Have a place to yourself',
      },
      {
        name: 'Hot tub',
        value: 'hot_tub',
        description: 'Have your own room and share some common spaces',
      },
      {
        name: 'Gym',
        value: 'gym',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Pool',
        value: 'pool',
        description: 'Stay in a shared space, like a common room',
      },
      {
        name: 'EV charger',
        value: 'ev_charger',
        description: 'Stay in a shared space, like a common room',
      },
    ],
  },
  {
    name: 'Property-type',
    label: 'Property type',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'House',
        value: 'house',
        description: 'Have a place to yourself',
      },
      {
        name: 'Bed and breakfast',
        value: 'bed_and_breakfast',
        description: 'Have your own room and share some common spaces',
      },
      {
        name: 'Apartment',
        defaultChecked: true,
        value: 'apartment',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Boutique hotel',
        value: 'boutique_hotel',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Bungalow',
        value: 'bungalow',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Chalet',
        defaultChecked: true,
        value: 'chalet',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Condominium',
        defaultChecked: true,
        value: 'condominium',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Cottage',
        value: 'cottage',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Guest suite',
        value: 'guest_suite',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
      {
        name: 'Guesthouse',
        value: 'guesthouse',
        description: 'Have a private or shared room in a boutique hotel, hostel, and more',
      },
    ],
  },
  {
    name: 'House-rules',
    label: 'House rules',
    tabUIType: 'checkbox',
    options: [
      {
        name: 'Pets allowed',
        value: 'pets_allowed',
        description: 'Have a place to yourself',
      },
      {
        name: 'Smoking allowed',
        value: 'smoking_allowed',
        description: 'Have your own room and share some common spaces',
      },
    ],
  },
]

const CheckboxPanel = ({
  filterOption,
  className,
  isPropertyMap = false,
}: {
  filterOption: CheckboxFilter
  className?: string
  isPropertyMap?: boolean
}) => {
  const hasDescriptions = filterOption.options.some((option) => Boolean(option.description))

  return (
    <Fieldset>
      <CheckboxGroup
        className={clsx(
          className,
          isPropertyMap &&
            (hasDescriptions
              ? 'grid grid-cols-1 gap-2.5 space-y-0 sm:grid-cols-2'
              : 'grid grid-cols-2 gap-2.5 space-y-0 sm:grid-cols-3')
        )}
      >
        {filterOption.options.map((option) => (
          <CheckboxField
            key={option.name}
            className={clsx(
              isPropertyMap &&
                'cursor-pointer rounded-2xl border border-neutral-200 bg-white px-3.5 py-3 transition hover:border-[#9fc7b7] hover:bg-[#f5faf7] has-data-checked:border-[#7fb39f] has-data-checked:bg-[#eef7f3] dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20 dark:has-data-checked:border-emerald-700 dark:has-data-checked:bg-emerald-950/35'
            )}
          >
            <Checkbox
              color={isPropertyMap ? 'mapx' : 'dark/zinc'}
              name={`${filterOption.name}[]`}
              value={option.value || option.name}
              defaultChecked={!!option.defaultChecked}
            />
            <Label className={clsx(isPropertyMap && 'cursor-pointer text-[0.9rem]/5 font-semibold!')}>
              {filterOption.name === 'discoveryChannel' ? (
                <PropertyCategoryLabel label={option.name} />
              ) : (
                option.name
              )}
            </Label>
            {option.description && (
              <Description className={clsx(isPropertyMap && 'mt-0.5 text-xs/5')}>{option.description}</Description>
            )}
          </CheckboxField>
        ))}
      </CheckboxGroup>
    </Fieldset>
  )
}
const PriceRagePanel = ({
  filterOption: { min, max, name, label, currency, step },
}: {
  filterOption: PriceRangeFilter
}) => {
  const [rangePrices, setRangePrices] = useState([min, max])

  return (
    <PriceRangeSlider
      defaultValue={rangePrices}
      onChange={setRangePrices}
      min={min}
      max={max}
      name={label || name}
      currency={currency}
      step={step}
    />
  )
}
const NumberSelectPanel = ({ filterOption: { name, options } }: { filterOption: SelectNumberFilter }) => {
  return (
    <div className="relative flex flex-col gap-y-5">
      {options.map((option) => (
        <NcInputNumber key={option.name} inputName={option.name} label={option.name} max={option.max} />
      ))}
    </div>
  )
}

const ListingFilterTabs = ({
  filterOptions = demo_filters_options,
  variant = 'default',
  visibleFilterCount = 3,
  hideInlineControls = false,
}: {
  filterOptions?: ListingFilterOption[]
  variant?: ListingFilterVariant
  visibleFilterCount?: number
  hideInlineControls?: boolean
}) => {
  const [showAllFilter, setShowAllFilter] = useState(false)
  const isPropertyMap = variant === 'property-map'
  const activeFilterCount = filterOptions.reduce((total, filterOption) => {
    if (filterOption.tabUIType !== 'checkbox') return total
    return total + (filterOption.options?.filter((option) => !!option.defaultChecked).length || 0)
  }, 0)

  useEffect(() => {
    if (!isPropertyMap) return

    const openPropertyFilters = () => setShowAllFilter(true)
    window.addEventListener('mapx:open-property-filters', openPropertyFilters)
    return () => window.removeEventListener('mapx:open-property-filters', openPropertyFilters)
  }, [isPropertyMap])

  const handleFormSubmit = async (formData: FormData) => {
    const formDataObject = Object.fromEntries(formData.entries())
    console.log('Form submitted with data:', formDataObject)
  }

  const renderTabAllFilters = () => {
    return (
      <div className={clsx('shrink-0 grow md:grow-0', hideInlineControls && 'hidden')}>
        <Button
          outline
          onClick={() => setShowAllFilter(true)}
          className={clsx(
            'w-full md:w-auto',
            isPropertyMap
              ? 'border-[#dbe7e2]! bg-white! text-[#173f34] shadow-[0_3px_12px_rgba(18,63,50,0.06)] ring-0! hover:border-[#9fc7b7]! hover:bg-[#f5faf7]! dark:border-neutral-700! dark:bg-neutral-900! dark:text-neutral-100'
              : 'border-black! ring-1 ring-black ring-inset dark:border-neutral-200! dark:ring-neutral-200'
          )}
        >
          <HugeiconsIcon icon={FilterVerticalIcon} size={16} color="currentColor" strokeWidth={1.5} />
          <span>{isPropertyMap ? 'ตัวกรองทั้งหมด' : T['common']['All filters']}</span>
          {activeFilterCount > 0 && (
            <span
              className={clsx(
                'absolute top-0 -right-0.5 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-white dark:ring-neutral-900',
                isPropertyMap ? 'bg-[#176b50]' : 'bg-black dark:bg-neutral-200 dark:text-neutral-900'
              )}
            >
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Dialog
          open={showAllFilter}
          onClose={() => setShowAllFilter(false)}
          className="relative z-50"
          as={Form}
          action={handleFormSubmit}
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/35 duration-200 ease-out data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex max-h-screen w-screen items-center justify-center pt-3">
            <DialogPanel
              className={clsx(
                'flex max-h-full w-full max-w-3xl flex-col overflow-hidden bg-white text-left align-middle shadow-xl duration-200 ease-out dark:border dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 data-closed:translate-y-16 data-closed:opacity-0',
                isPropertyMap ? 'rounded-3xl' : 'rounded-t-2xl'
              )}
              transition
            >
              <div className="relative shrink-0 border-b border-neutral-200 p-4 text-center sm:px-8 dark:border-neutral-800">
                <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                  {isPropertyMap ? 'ตัวกรองทั้งหมด' : T['common']['Filters']}
                </DialogTitle>
                <div className="absolute end-2 top-2">
                  <ButtonClose plain onClick={() => setShowAllFilter(false)} />
                </div>
              </div>

              <div className="hidden-scrollbar grow overflow-y-auto text-start">
                <div className="divide-y divide-neutral-200 px-4 sm:px-8 dark:divide-neutral-800">
                  {filterOptions.map((filterOption, index) =>
                    filterOption ? (
                      <div key={index} className="py-7">
                        <h3 className="text-xl font-medium">{filterOption.label}</h3>
                        <div className="relative mt-6">
                          {filterOption.tabUIType === 'checkbox' && (
                            <CheckboxPanel
                              filterOption={filterOption as CheckboxFilter}
                              isPropertyMap={isPropertyMap}
                            />
                          )}
                          {filterOption.tabUIType === 'price-range' && (
                            <PriceRagePanel key={index} filterOption={filterOption as PriceRangeFilter} />
                          )}
                          {filterOption.tabUIType === 'select-number' && (
                            <NumberSelectPanel key={index} filterOption={filterOption as SelectNumberFilter} />
                          )}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between bg-neutral-50 p-4 sm:px-8 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
                <ButtonThird className="-mx-3" onClick={() => setShowAllFilter(false)} type="button">
                  {isPropertyMap ? 'ล้างทั้งหมด' : T['common']['Clear All']}
                </ButtonThird>
                <ButtonPrimary
                  type="submit"
                  onClick={() => setShowAllFilter(false)}
                  className={clsx(
                    isPropertyMap &&
                      '[--btn-bg:#123f32] [--btn-border:#0d3429] data-focus:outline-[#176b50] dark:[--btn-bg:#176b50]'
                  )}
                >
                  {isPropertyMap ? 'ดูผลลัพธ์' : T['common']['Apply filters']}
                </ButtonPrimary>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    )
  }

  if (!filterOptions || filterOptions.length === 0) {
    return <div>No filter options available</div>
  }

  return (
    <div className={clsx('flex', isPropertyMap ? 'flex-nowrap gap-2 pb-1' : 'flex-wrap md:gap-x-4 md:gap-y-2')}>
      {renderTabAllFilters()}
      <PopoverGroup
        className={clsx(
          hideInlineControls
            ? 'hidden!'
            : isPropertyMap
              ? 'hidden flex-nowrap gap-2 lg:flex'
              : 'hidden flex-wrap gap-x-4 gap-y-2 md:flex'
        )}
        as={Form}
        action={handleFormSubmit}
      >
        <div className="h-auto w-px bg-neutral-200 dark:bg-neutral-700"></div>
        {filterOptions.map((filterOption, index) => {
          if (index >= visibleFilterCount || !filterOption) {
            return null
          }

          const checkedNumber =
            (filterOption as CheckboxFilter).options?.filter((option) => !!option.defaultChecked)?.length || 0

          return (
            <Popover className="relative" key={index}>
              <PopoverButton
                as={Button}
                outline
                className={clsx(
                  isPropertyMap
                    ? 'border-[#dbe7e2]! bg-white! px-3.5! text-[#284d43] shadow-[0_3px_12px_rgba(18,63,50,0.05)] ring-0! hover:border-[#9fc7b7]! hover:bg-[#f5faf7]!'
                    : 'md:px-4',
                  checkedNumber &&
                    (isPropertyMap
                      ? 'border-[#8bbba8]! bg-[#eef7f3]! text-[#12513f] ring-1 ring-[#176b50]/15 ring-inset'
                      : 'border-black! ring-1 ring-black ring-inset dark:border-neutral-200! dark:ring-neutral-200')
                )}
              >
                <span>{filterOption.label}</span>
                <ChevronDownIcon className="size-4" />
                {checkedNumber ? (
                  <span
                    className={clsx(
                      'absolute top-0 -right-0.5 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white ring-2 ring-white dark:ring-neutral-900',
                      isPropertyMap ? 'bg-[#176b50]' : 'bg-black dark:bg-neutral-200 dark:text-neutral-900'
                    )}
                  >
                    {checkedNumber}
                  </span>
                ) : null}
              </PopoverButton>

              <PopoverPanel
                transition
                unmount={false}
                className={clsx(
                  'absolute start-1/2 top-full z-30 mt-3 -translate-x-1/2 transition data-closed:translate-y-1 data-closed:opacity-0',
                  filterOption.name === 'propertyType'
                    ? 'w-[32rem]'
                    : filterOption.name === 'discoveryChannel' || filterOption.name === 'offerType'
                      ? 'w-[27rem]'
                      : 'w-sm',
                  'max-w-[calc(100vw-2rem)]'
                )}
              >
                <div
                  className={clsx(
                    'border bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900',
                    isPropertyMap ? 'rounded-3xl border-[#dfe9e5]' : 'rounded-2xl border-neutral-200'
                  )}
                >
                  <div className="hidden-scrollbar max-h-[28rem] overflow-y-auto px-5 py-5">
                    {isPropertyMap && (
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
                          {filterOption.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {filterOption.name === 'discoveryChannel'
                            ? 'เลือกได้มากกว่าหนึ่งหมวด พื้นที่เดียวอาจตอบโจทย์ได้หลายแบบ'
                            : filterOption.name === 'offerType'
                              ? 'เลือกรูปแบบข้อเสนอที่คุณยอมรับได้'
                              : filterOption.name === 'propertyType'
                                ? 'เลือกเฉพาะประเภทที่สนใจ หรือเว้นไว้เพื่อดูทั้งหมด'
                                : 'กำหนดช่วงที่เหมาะกับความต้องการของคุณ'}
                        </p>
                      </div>
                    )}
                    {filterOption.tabUIType === 'checkbox' && (
                      <CheckboxPanel filterOption={filterOption as CheckboxFilter} isPropertyMap={isPropertyMap} />
                    )}
                    {filterOption.tabUIType === 'price-range' && (
                      <PriceRagePanel key={index} filterOption={filterOption as PriceRangeFilter} />
                    )}
                    {filterOption.tabUIType === 'select-number' && (
                      <NumberSelectPanel key={index} filterOption={filterOption as SelectNumberFilter} />
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-b-2xl bg-neutral-50 p-5 dark:border-t dark:border-neutral-800 dark:bg-neutral-900">
                    <CloseButton className="-mx-3" as={ButtonThird} type="button">
                      {isPropertyMap ? 'ล้าง' : T['common']['Clear']}
                    </CloseButton>
                    <CloseButton
                      type="submit"
                      as={ButtonPrimary}
                      className={clsx(
                        isPropertyMap &&
                          '[--btn-bg:#123f32] [--btn-border:#0d3429] data-focus:outline-[#176b50] dark:[--btn-bg:#176b50]'
                      )}
                    >
                      {isPropertyMap ? 'ดูผลลัพธ์' : T['common']['Apply']}
                    </CloseButton>
                  </div>
                </div>
              </PopoverPanel>
            </Popover>
          )
        })}
      </PopoverGroup>
    </div>
  )
}

export default ListingFilterTabs
