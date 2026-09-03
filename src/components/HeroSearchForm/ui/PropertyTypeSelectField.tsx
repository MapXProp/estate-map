'use client'

import T from '@/utils/getT'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { HomeIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { Check, ChevronDown, Layers3 } from 'lucide-react'
import { FC, useMemo, useState } from 'react'

const styles = {
  button: {
    base: 'relative z-10 flex w-full shrink-0 cursor-pointer items-center gap-x-3 text-start focus:outline-hidden',
    focused: 'rounded-full bg-transparent custom-shadow-1 focus-visible:outline-hidden dark:bg-white/5',
    default: 'px-7 py-4 xl:px-8 xl:py-6',
    small: 'px-7 py-3 xl:px-8',
  },
  mainText: {
    default: 'text-base xl:text-lg',
    small: 'text-base',
  },
  panel: {
    base: 'absolute left-1/2 top-full z-10 mt-3 max-h-[min(42rem,72vh)] w-96 -translate-x-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5 transition duration-150 data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-800',
    default: '',
    small: '',
  },
}

export interface PropertyTypeOption {
  name: string
  description: string
  value: string
}

export interface PropertyTypeSelectSection {
  id: string
  name: string
  countLabel?: string
  propertyTypes: PropertyTypeOption[]
  spaceTypes?: PropertyTypeOption[]
  spaceTypesTitle?: string
}

const defaultPropertyTypes: PropertyTypeOption[] = [
  { name: 'House', value: 'detached_house', description: 'Detached house' },
  { name: 'Condo', value: 'condo', description: 'Condominium' },
]

interface Props {
  className?: string
  fieldStyle: 'default' | 'small'
  propertyTypes?: PropertyTypeOption[]
  sections?: PropertyTypeSelectSection[]
  description?: string
  placeholder?: string
  defaultSelected?: string[]
  defaultSelectedSpaceTypes?: string[]
  panelTitle?: string
  panelDescription?: string
  allTypesLabel?: string
  allTypesDescription?: string
  selectionSummary?: string
  tone?: 'default' | 'mapx'
  onSelectionChange?: (values: string[]) => void
  onSpaceTypeSelectionChange?: (values: string[]) => void
}

const uniqueOptions = (sections: PropertyTypeSelectSection[], key: 'propertyTypes' | 'spaceTypes') => {
  const options = new Map<string, PropertyTypeOption>()
  sections.forEach((section) => section[key]?.forEach((option) => options.set(option.value, option)))
  return options
}

export const PropertyTypeSelectField: FC<Props> = ({
  className = 'flex-1',
  fieldStyle = 'default',
  propertyTypes = defaultPropertyTypes,
  sections,
  description = T['HeroSearchForm']['Property type'],
  placeholder = T['HeroSearchForm']['Type'],
  defaultSelected = [],
  defaultSelectedSpaceTypes = [],
  panelTitle,
  panelDescription = 'เลือกเฉพาะประเภทที่ต้องการ',
  allTypesLabel = 'ทุกประเภท',
  allTypesDescription = 'ไม่จำกัดประเภทอสังหา',
  selectionSummary,
  tone = 'default',
  onSelectionChange,
  onSpaceTypeSelectionChange,
}) => {
  const availableSections = useMemo<PropertyTypeSelectSection[]>(
    () => (sections?.length ? sections : [{ id: 'all', name: panelTitle || placeholder, propertyTypes }]),
    [panelTitle, placeholder, propertyTypes, sections]
  )
  const [selectedTypes, setSelectedTypes] = useState<string[]>(defaultSelected)
  const [selectedSpaceTypes, setSelectedSpaceTypes] = useState<string[]>(defaultSelectedSpaceTypes)
  const [activeSectionId, setActiveSectionId] = useState(availableSections[0]?.id || 'all')
  const [spaceTypesExpanded, setSpaceTypesExpanded] = useState(false)
  const activeSection = availableSections.find((section) => section.id === activeSectionId) || availableSections[0]
  const propertyOptions = useMemo(() => uniqueOptions(availableSections, 'propertyTypes'), [availableSections])
  const spaceOptions = useMemo(() => uniqueOptions(availableSections, 'spaceTypes'), [availableSections])
  const selectionCount = selectedTypes.length + selectedSpaceTypes.length
  const singleSelectedName =
    selectionCount === 1
      ? selectedTypes.length
        ? propertyOptions.get(selectedTypes[0])?.name
        : spaceOptions.get(selectedSpaceTypes[0])?.name
      : ''
  const typeStringConverted =
    singleSelectedName || (selectionCount > 1 ? selectionSummary || `${selectionCount} selected` : '')

  const toggleType = (value: string) => {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((item) => item !== value)
      : [...selectedTypes, value]
    setSelectedTypes(next)
    onSelectionChange?.(next)
  }

  const toggleSpaceType = (value: string) => {
    const next = selectedSpaceTypes.includes(value)
      ? selectedSpaceTypes.filter((item) => item !== value)
      : [...selectedSpaceTypes, value]
    setSelectedSpaceTypes(next)
    onSpaceTypeSelectionChange?.(next)
  }

  const clearSelection = () => {
    setSelectedTypes([])
    setSelectedSpaceTypes([])
    onSelectionChange?.([])
    onSpaceTypeSelectionChange?.([])
  }

  const renderOption = (item: PropertyTypeOption, selected: boolean, onClick: () => void) => (
    <button
      key={item.value}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        'relative flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
        selected
          ? 'border-[#176b50] bg-[#eef7f3] text-[#123f32] shadow-[inset_0_0_0_1px_rgba(23,107,80,0.08)] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
          : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#9fc7b7] hover:bg-[#f7faf8] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
      )}
    >
      <span
        className={clsx(
          'grid size-6 shrink-0 place-items-center rounded-lg border',
          selected
            ? 'border-[#176b50] bg-[#176b50] text-white'
            : 'border-neutral-300 bg-white text-transparent dark:border-neutral-600 dark:bg-neutral-800'
        )}
      >
        <Check className="size-4" strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{item.name}</span>
        <span className="mt-0.5 line-clamp-1 block text-xs font-normal text-neutral-500 dark:text-neutral-400">
          {item.description}
        </span>
      </span>
    </button>
  )

  return (
    <Popover className={`group relative z-10 flex data-open:z-50 ${className}`}>
      {({ open: showPopover }) => (
        <>
          {selectedTypes.map((value) => (
            <input key={`property-${value}`} type="hidden" name="property_type" value={value} />
          ))}
          {selectedSpaceTypes.map((value) => (
            <input key={`space-${value}`} type="hidden" name="space_type" value={value} />
          ))}

          <PopoverButton
            className={clsx(styles.button.base, styles.button[fieldStyle], showPopover && styles.button.focused)}
          >
            {fieldStyle === 'default' && (
              <HomeIcon className="size-5 text-neutral-300 lg:size-7 dark:text-neutral-400" />
            )}

            <div className="min-w-0 flex-1">
              <span className={clsx('block font-semibold', styles.mainText[fieldStyle])}>
                <span className="line-clamp-1">{typeStringConverted || placeholder}</span>
              </span>
              <span className="mt-1 block text-sm leading-none font-light text-neutral-400">{description}</span>
            </div>
          </PopoverButton>

          <PopoverPanel
            unmount={false}
            transition
            className={clsx(
              styles.panel.base,
              styles.panel[fieldStyle],
              tone === 'mapx' && 'w-[46rem] max-w-[calc(100vw-2rem)] border border-[#dfe9e5] ring-0'
            )}
          >
            {panelTitle && (
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-neutral-950 dark:text-white">{panelTitle}</p>
                  {selectionCount > 0 && (
                    <span className="rounded-full bg-[#edf6f1] px-2.5 py-1 text-xs font-semibold text-[#176b50] dark:bg-emerald-950/50 dark:text-emerald-200">
                      {selectionCount}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{panelDescription}</p>
              </div>
            )}

            <button
              type="button"
              aria-pressed={selectionCount === 0}
              onClick={clearSelection}
              className={clsx(
                'flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50]',
                selectionCount === 0
                  ? 'border-[#176b50] bg-[#176b50] text-white shadow-sm'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-[#9fc7b7] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/16">
                <Layers3 className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{allTypesLabel}</span>
                <span
                  className={clsx('mt-0.5 block text-xs', selectionCount === 0 ? 'text-white/75' : 'text-neutral-500')}
                >
                  {allTypesDescription}
                </span>
              </span>
              {selectionCount === 0 && <Check className="size-5 shrink-0" />}
            </button>

            {availableSections.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-2" role="tablist">
                {availableSections.map((section) => {
                  const active = section.id === activeSection.id
                  const selectedInSection = [
                    ...section.propertyTypes.map((item) => item.value),
                    ...(section.spaceTypes || []).map((item) => item.value),
                  ].filter((value) => selectedTypes.includes(value) || selectedSpaceTypes.includes(value)).length
                  return (
                    <button
                      key={section.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveSectionId(section.id)}
                      className={clsx(
                        'min-h-12 rounded-2xl border px-2.5 py-2 text-center text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] sm:text-sm',
                        active
                          ? 'border-[#176b50] bg-[#edf6f1] text-[#123f32] dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-100'
                          : 'border-neutral-200 text-neutral-600 hover:border-[#9fc7b7] dark:border-neutral-700 dark:text-neutral-300'
                      )}
                    >
                      <span className="line-clamp-1 block">{section.name}</span>
                      <span className="mt-0.5 block text-[11px] font-normal opacity-70">
                        {selectedInSection ? `${selectedInSection} / ` : ''}
                        {section.countLabel || section.propertyTypes.length}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {activeSection && (
              <div className="mt-5">
                {availableSections.length > 1 && (
                  <h3 className="mb-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {activeSection.name}
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  {activeSection.propertyTypes.map((item) =>
                    renderOption(item, selectedTypes.includes(item.value), () => toggleType(item.value))
                  )}
                </div>

                {activeSection.spaceTypes?.length ? (
                  <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-700">
                    <button
                      type="button"
                      aria-expanded={spaceTypesExpanded}
                      onClick={() => setSpaceTypesExpanded((current) => !current)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-start text-orange-950 transition hover:border-orange-300 dark:border-orange-900/60 dark:bg-orange-950/20 dark:text-orange-100"
                    >
                      <span>
                        <span className="block text-sm font-semibold">{activeSection.spaceTypesTitle}</span>
                        <span className="mt-0.5 block text-xs text-orange-700/75 dark:text-orange-300/75">
                          {selectedSpaceTypes.length
                            ? `${selectedSpaceTypes.length} / ${activeSection.spaceTypes.length}`
                            : activeSection.spaceTypes.length}
                        </span>
                      </span>
                      <ChevronDown
                        className={clsx('size-5 shrink-0 transition-transform', spaceTypesExpanded && 'rotate-180')}
                      />
                    </button>
                    {spaceTypesExpanded && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                        {activeSection.spaceTypes.map((item) =>
                          renderOption(item, selectedSpaceTypes.includes(item.value), () => toggleSpaceType(item.value))
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
