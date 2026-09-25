'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  getMobilePropertyMapSearchUrl,
  mobilePropertyCategories,
  type MobilePropertyCategory,
} from '@/lib/mobilePropertySearch'
import { asBrowseHref } from '@/lib/propertyBrowse'
import { OPEN_MOBILE_PROPERTY_SEARCH_EVENT } from '@/lib/propertyNavigation'
import { getPropertyZoneFromPathname } from '@/lib/propertyZone'
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useId, useMemo, useState } from 'react'
import MobileProjectSearchDialog from './MobileProjectSearchDialog'
import MobilePropertyBrandMark from './MobilePropertyBrandMark'
import styles from './MobilePropertySearch.module.css'
import MobilePropertySearchDialog from './MobilePropertySearchDialog'
import MobileSearchBudgetSheet, { emptySearchBudget, type SearchBudget } from './MobileSearchBudgetSheet'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type OfferType = '' | 'sale' | 'rent'

type PropertyGroup = 'homes' | 'rooms' | 'business'

const propertyGroups: Array<{
  value: PropertyGroup
  label: string
  labelEn: string
  hint: string
  hintEn: string
  image: string
}> = [
  {
    value: 'homes',
    label: 'บ้าน / คอนโด',
    labelEn: 'Homes',
    hint: 'ที่อยู่อาศัย',
    hintEn: 'Buy or rent',
    image: 'detached-house',
  },
  {
    value: 'rooms',
    label: 'ห้องเช่า',
    labelEn: 'Rooms',
    hint: 'พักรายเดือน',
    hintEn: 'Monthly stays',
    image: 'rental-room',
  },
  {
    value: 'business',
    label: 'ธุรกิจ',
    labelEn: 'Business',
    hint: 'พื้นที่ทำธุรกิจ',
    hintEn: 'Commercial',
    image: 'retail-space',
  },
]

const formatPrice = (value: number, isThai: boolean) => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return isThai
      ? `${millions.toLocaleString('th-TH', { maximumFractionDigits: 2 })} ล้าน`
      : `${millions.toLocaleString('en-US', { maximumFractionDigits: 2 })}M THB`
  }
  if (!isThai && value >= 1_000) return `${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K THB`
  return isThai ? `${value.toLocaleString('th-TH')} บาท` : `${value.toLocaleString('en-US')} THB`
}

const MobilePropertySearch = ({
  className = '',
  compactMapHeader = false,
}: {
  className?: string
  compactMapHeader?: boolean
}) => {
  const { locale, propertyZone, setPropertyZone } = usePreferences()
  const isThai = locale === 'th'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMapResults = pathname === '/properties/map'
  const mapQuery = searchParams.get('q')?.trim() || ''
  const activePropertyGroup: PropertyGroup = getPropertyZoneFromPathname(pathname) ?? propertyZone
  const [open, setOpen] = useState(false)
  const [projectSearchOpen, setProjectSearchOpen] = useState(false)
  const [propertyGroup, setPropertyGroup] = useState<PropertyGroup>(activePropertyGroup)
  const [offerType, setOfferType] = useState<OfferType>(activePropertyGroup === 'rooms' ? 'rent' : '')
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<MobilePropertyCategory[]>([])
  const [budget, setBudget] = useState<SearchBudget>(emptySearchBudget)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchFormId = useId()
  const filtersId = useId()

  useEffect(() => {
    const openFromNavigation = () => {
      setFiltersOpen(false)
      setOpen(true)
    }
    window.addEventListener(OPEN_MOBILE_PROPERTY_SEARCH_EVENT, openFromNavigation)
    return () => window.removeEventListener(OPEN_MOBILE_PROPERTY_SEARCH_EVENT, openFromNavigation)
  }, [])

  useEffect(() => {
    // Navigation changes are external to this persistent header, so reset its draft filters to the new route context.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPropertyGroup(activePropertyGroup)
    setOfferType(activePropertyGroup === 'rooms' ? 'rent' : '')
    setSelectedPropertyTypes([])
    setBudget(emptySearchBudget)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activePropertyGroup])

  const visiblePropertyTypes = useMemo(
    () => mobilePropertyCategories.filter((property) => property.channel === propertyGroup),
    [propertyGroup]
  )

  const togglePropertyType = (property: MobilePropertyCategory) => {
    setSelectedPropertyTypes((current) =>
      current.some((item) => item.value === property.value)
        ? current.filter((item) => item.value !== property.value)
        : [...current, property]
    )
  }

  const openBudget = () => setBudgetOpen(true)

  const buildMapSearchUrl = (query: string) => {
    const href = getMobilePropertyMapSearchUrl({
      query,
      channel: propertyGroup,
      selectedCategories: selectedPropertyTypes.map((property) => property.value),
      offerType,
      minPrice: budget.minPrice ? Number(budget.minPrice) : undefined,
      maxPrice: budget.maxPrice ? Number(budget.maxPrice) : undefined,
    })
    return isMapResults ? href : asBrowseHref(href)
  }

  const hasBudget = Boolean(budget.minPrice || budget.maxPrice)
  const hasQuickFilters = Boolean(offerType || selectedPropertyTypes.length || hasBudget)
  const offerLabel = offerType === 'sale' ? (isThai ? 'ซื้อ' : 'Buy') : isThai ? 'เช่า' : 'Rent'
  const budgetLabel =
    budget.minPrice && budget.maxPrice
      ? `${formatPrice(Number(budget.minPrice), isThai)}–${formatPrice(Number(budget.maxPrice), isThai)}`
      : budget.minPrice
        ? `${isThai ? 'ตั้งแต่' : 'From'} ${formatPrice(Number(budget.minPrice), isThai)}`
        : budget.maxPrice
          ? `${isThai ? 'ไม่เกิน' : 'Up to'} ${formatPrice(Number(budget.maxPrice), isThai)}`
          : ''

  const openMapFilters = () => {
    window.dispatchEvent(new Event('mapx:open-property-filters'))
  }

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <div className={`flex w-full items-center ${compactMapHeader && isMapResults ? 'gap-1.5' : 'gap-2'}`}>
        <MobilePropertyBrandMark />
        <button
          type="button"
          data-mobile-property-search-trigger
          aria-label={isThai ? 'ค้นหาทำเลหรืออสังหาริมทรัพย์' : 'Search location or property'}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setFiltersOpen(false)
            setOpen(true)
          }}
          className={`flex min-w-0 flex-1 items-center text-start ${
            compactMapHeader && isMapResults
              ? 'min-h-11 gap-2 rounded-full border border-neutral-200 bg-white py-1.5 ps-2.5 pe-3 shadow-sm transition active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900'
              : styles.searchTrigger
          }`}
        >
          <span
            className={`grid shrink-0 place-items-center rounded-full bg-[#eaf4ef] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200 ${compactMapHeader && isMapResults ? 'size-8' : 'size-7'}`}
          >
            <Search className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate font-semibold text-neutral-950 dark:text-white ${compactMapHeader && isMapResults ? 'text-sm' : styles.searchTitle}`}
            >
              {isMapResults && mapQuery ? mapQuery : isThai ? 'ค้นหาอสังหา' : 'Find a property'}
            </span>
            <span
              className={`block truncate text-neutral-500 dark:text-neutral-400 ${compactMapHeader && isMapResults ? 'mt-0.5 text-xs' : styles.searchHint}`}
            >
              {hasQuickFilters
                ? [
                    offerType ? offerLabel : null,
                    selectedPropertyTypes.length
                      ? selectedPropertyTypes.map((property) => (isThai ? property.label : property.labelEn)).join(', ')
                      : null,
                    budgetLabel || null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : isThai
                  ? isMapResults
                    ? compactMapHeader
                      ? '20,000 รายการ · แตะเพื่อค้นหา'
                      : 'ทุกประเภท · ไม่จำกัดงบ'
                    : 'เลือกหมวด · ทำเล'
                  : isMapResults
                    ? 'All properties · Any budget'
                    : 'Category · Location'}
            </span>
          </span>
        </button>
        {compactMapHeader && isMapResults && (
          <>
            <button
              type="button"
              aria-label={isThai ? 'ค้นหาโครงการหรือห้าง' : 'Search projects or malls'}
              title={isThai ? 'ค้นหาโครงการ / ห้าง' : 'Search projects / malls'}
              className="relative grid size-10 shrink-0 place-items-center rounded-full border border-[#d8e6df] bg-white text-[#174d3e] shadow-sm transition hover:bg-[#f3f8f5] active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-emerald-200"
              onClick={() => setProjectSearchOpen(true)}
            >
              <Building2 className="size-4.5" strokeWidth={1.8} />
              <span className="ring-1.5 absolute right-1 bottom-1 grid size-3.5 place-items-center rounded-full bg-[#176b50] text-white ring-white dark:ring-neutral-900">
                <Search className="size-2.5" strokeWidth={2.5} />
              </span>
            </button>
            <button
              type="button"
              aria-label={isThai ? 'เปิดตัวกรอง' : 'Open filters'}
              className="relative grid size-10 shrink-0 place-items-center rounded-full border border-[#d8e6df] bg-white text-[#174d3e] shadow-sm transition hover:bg-[#f3f8f5] active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-emerald-200"
              onClick={openMapFilters}
            >
              <SlidersHorizontal className="size-4.5" />
              <span className="absolute -top-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full bg-[#176b50] text-[9px] font-bold text-white ring-2 ring-white dark:ring-neutral-900">
                3
              </span>
            </button>
          </>
        )}
      </div>

      <MobilePropertySearchDialog
        open={open}
        blocked={budgetOpen}
        th={isThai}
        onClose={() => {
          if (!budgetOpen) setOpen(false)
        }}
      >
        <div className={styles.flow} data-search-tone={propertyGroup}>
          <div data-sheet-scroll className={styles.content + ' overflow-y-auto'}>
            <section aria-label={isThai ? 'เลือกหมวดหลัก' : 'Choose a category'}>
              <div className={styles.groups}>
                {propertyGroups.map((group) => {
                  const active = propertyGroup === group.value
                  return (
                    <button
                      key={group.value}
                      type="button"
                      data-mobile-search-group={group.value}
                      aria-pressed={active}
                      onClick={() => {
                        if (group.value === propertyGroup) return
                        setPropertyGroup(group.value)
                        setPropertyZone(group.value)
                        setSelectedPropertyTypes([])
                        setBudget(emptySearchBudget)
                        setOfferType(group.value === 'rooms' ? 'rent' : '')
                        setFiltersOpen(false)
                      }}
                      className={styles.group}
                    >
                      <span className={styles.groupImage}>
                        <Image
                          src={'/images/property-categories/' + group.image + '.png'}
                          alt=""
                          width={112}
                          height={88}
                          sizes="(max-width: 390px) 100px, 140px"
                        />
                      </span>
                      <span className={styles.groupLabel}>{isThai ? group.label : group.labelEn}</span>
                      <span className={styles.groupHint}>{isThai ? group.hint : group.hintEn}</span>
                      {active && (
                        <span className={styles.groupCheck}>
                          <Check size={12} aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            {propertyGroup !== 'rooms' && (
              <div
                className={styles.offers}
                role="group"
                aria-label={isThai ? 'เลือกซื้อหรือเช่า' : 'Choose buy or rent'}
              >
                {(['', 'sale', 'rent'] as const).map((offer) => (
                  <button
                    key={offer || 'all'}
                    type="button"
                    data-mobile-search-offer={offer}
                    aria-pressed={offerType === offer}
                    onClick={() => {
                      if (offerType !== offer) {
                        setOfferType(offer)
                        setBudget(emptySearchBudget)
                      }
                    }}
                  >
                    {offer === ''
                      ? isThai
                        ? 'ซื้อและเช่า'
                        : 'Buy & rent'
                      : offer === 'sale'
                        ? isThai
                          ? 'ซื้อ'
                          : 'Buy'
                        : isThai
                          ? 'เช่า'
                          : 'Rent'}
                  </button>
                ))}
              </div>
            )}

            <section data-sheet-no-drag className={styles.location}>
              <div className={styles.locationHeading}>
                <span>
                  <MapPin size={17} aria-hidden="true" />
                  {isThai ? 'ทำเลที่สนใจ' : 'Location'}
                </span>
                <span className={styles.optional}>{isThai ? 'ไม่ระบุก็ได้' : 'Optional'}</span>
              </div>
              <PropertySearchOmnibox
                variant="sheet"
                tone={propertyGroup === 'rooms' ? 'mint' : propertyGroup === 'business' ? 'commerce' : 'green'}
                formId={searchFormId}
                hideSubmitButton
                initialQuery={mapQuery}
                buildSearchUrl={buildMapSearchUrl}
                allowEmptyQuery
                suggestionsMode="inline"
                suggestionScope="location"
                scrollSuggestionsIntoView
                showTypeLabels
                placeholder={isThai ? 'ย่าน โครงการ หรือสถานีรถไฟฟ้า' : 'Area, project or transit station'}
                onSubmitQuery={() => setOpen(false)}
              />
            </section>

            <section className={styles.refinements}>
              <button
                type="button"
                data-mobile-search-refinements
                className={styles.refinementToggle}
                aria-expanded={filtersOpen}
                aria-controls={filtersId}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
                <span>
                  <strong>{isThai ? 'เลือกเพิ่มเติม' : 'More options'}</strong>
                  <span className={styles.refinementSummary}>
                    {[
                      selectedPropertyTypes.length
                        ? selectedPropertyTypes
                            .map((property) => (isThai ? property.label : property.labelEn))
                            .join(', ')
                        : isThai
                          ? 'ทุกประเภท'
                          : 'All types',
                      budgetLabel || (isThai ? 'ไม่จำกัดงบ' : 'Any budget'),
                    ].join(' · ')}
                  </span>
                </span>
                {(selectedPropertyTypes.length > 0 || hasBudget) && (
                  <span className={styles.filterCount}>{selectedPropertyTypes.length + Number(hasBudget)}</span>
                )}
                <ChevronDown size={18} aria-hidden="true" className={filtersOpen ? styles.expandedChevron : ''} />
              </button>
              {filtersOpen && (
                <div id={filtersId} className={styles.filterDetails}>
                  <div className={styles.filterHeading}>
                    <h2>{isThai ? 'ประเภทที่สนใจ' : 'Property types'}</h2>
                    {(selectedPropertyTypes.length > 0 || hasBudget) && (
                      <button
                        type="button"
                        data-mobile-search-clear
                        onClick={() => {
                          setSelectedPropertyTypes([])
                          setBudget(emptySearchBudget)
                        }}
                      >
                        {isThai ? 'ล้างตัวเลือก' : 'Clear options'}
                      </button>
                    )}
                  </div>
                  <div className={styles.types}>
                    <button
                      type="button"
                      data-mobile-search-all-types
                      aria-pressed={selectedPropertyTypes.length === 0}
                      onClick={() => setSelectedPropertyTypes([])}
                    >
                      {selectedPropertyTypes.length === 0 && <Check size={14} aria-hidden="true" />}
                      {isThai ? 'ทุกประเภท' : 'All types'}
                    </button>
                    {visiblePropertyTypes.map((property) => {
                      const active = selectedPropertyTypes.some((item) => item.value === property.value)
                      return (
                        <button
                          key={property.value}
                          type="button"
                          data-mobile-search-category={property.value}
                          aria-pressed={active}
                          onClick={() => togglePropertyType(property)}
                        >
                          {active && <Check size={14} aria-hidden="true" />}
                          {isThai ? property.label : property.labelEn}
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" data-mobile-search-budget onClick={openBudget} className={styles.budget}>
                    <Banknote size={18} aria-hidden="true" />
                    <span>
                      {isThai ? 'งบประมาณ' : 'Budget'}
                      <small>{budgetLabel || (isThai ? 'ไม่จำกัดงบ' : 'Any budget')}</small>
                    </span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>
          </div>

          <footer className={styles.footer}>
            <p>{isThai ? 'เลือกหมวดแล้วค้นหาได้เลย' : 'Choose a category and start exploring'}</p>
            <button type="submit" form={searchFormId} data-mobile-search-submit className={styles.submit}>
              <Search size={20} aria-hidden="true" />
              <span>
                {isThai
                  ? propertyGroup === 'rooms'
                    ? 'ค้นหาห้องเช่า'
                    : propertyGroup === 'business'
                      ? 'ค้นหาพื้นที่ธุรกิจ'
                      : 'ค้นหาที่อยู่อาศัย'
                  : propertyGroup === 'rooms'
                    ? 'Find monthly rooms'
                    : propertyGroup === 'business'
                      ? 'Find business spaces'
                      : 'Find homes'}
              </span>
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </footer>
        </div>

        {budgetOpen && (
          <MobileSearchBudgetSheet
            value={budget}
            onApply={setBudget}
            onClose={() => setBudgetOpen(false)}
            offerType={offerType}
            rentalRooms={propertyGroup === 'rooms'}
            th={isThai}
          />
        )}
      </MobilePropertySearchDialog>
      <MobileProjectSearchDialog open={projectSearchOpen} onClose={() => setProjectSearchOpen(false)} />
    </div>
  )
}

export default MobilePropertySearch
