'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import PropertyCategoryLabel from '@/components/PropertyCategoryLabel'
import type { PropertyTypeCode } from '@/data/propertyTaxonomy'
import {
  getMobilePropertyMapSearchUrl,
  mobilePropertyCategories,
  type MobilePropertyCategory,
} from '@/lib/mobilePropertySearch'
import { getPropertyZoneFromPathname } from '@/lib/propertyZone'
import {
  Banknote,
  BedDouble,
  BriefcaseBusiness,
  Building,
  Building2,
  Check,
  ChevronRight,
  Factory,
  Hotel,
  House,
  HousePlus,
  KeyRound,
  LandPlot,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
  Warehouse,
} from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react'
import MobileProjectSearchDialog from './MobileProjectSearchDialog'
import MobilePropertyBrandMark from './MobilePropertyBrandMark'
import MobilePropertySearchDialog from './MobilePropertySearchDialog'
import MobileSearchBudgetSheet, { emptySearchBudget, type SearchBudget } from './MobileSearchBudgetSheet'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type OfferType = '' | 'sale' | 'rent'

type PropertyGroup = 'homes' | 'rooms' | 'business'

const RowHouseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 20.5h19" />
    <path d="M3.5 20.5v-13L6 5l2.5 2.5v13M8.5 20.5v-13L11 5l2.5 2.5v13M13.5 20.5v-13L16 5l2.5 2.5v13M18.5 20.5V8.5h2v12" />
    <path d="M5 11h2M10 11h2M15 11h2M5.25 20.5v-5h1.5v5M10.25 20.5v-5h1.5v5M15.25 20.5v-5h1.5v5" />
  </svg>
)

const categoryIcons: Record<PropertyTypeCode, ComponentType<SVGProps<SVGSVGElement>>> = {
  detached_house: House,
  semi_detached_house: HousePlus,
  townhouse: Building,
  condo: Building2,
  apartment: Hotel,
  dormitory: BedDouble,
  rental_room: BedDouble,
  flat: Building,
  serviced_apartment: Hotel,
  monthly_hotel: Hotel,
  shophouse: RowHouseIcon,
  home_office: BriefcaseBusiness,
  office: Building2,
  retail_space: Store,
  warehouse: Warehouse,
  factory: Factory,
  hotel_resort: Hotel,
  land: LandPlot,
}

const propertyGroups: Array<{ value: PropertyGroup; label: string; labelEn: string }> = [
  { value: 'homes', label: 'บ้าน คอนโด & ที่อยู่อาศัย', labelEn: 'Homes' },
  { value: 'rooms', label: 'ห้องเช่า & ที่พักรายเดือน', labelEn: 'Monthly rooms' },
  { value: 'business', label: 'พื้นที่ทำธุรกิจ', labelEn: 'Business' },
]

const propertyGroupTones: Record<
  PropertyGroup,
  {
    activeTab: string
    inactiveCount: string
    activeCard: string
    check: string
    activeIcon: string
    offerBorder: string
    activeOffer: string
  }
> = {
  homes: {
    activeTab:
      'bg-[#176B50] text-white shadow-[0_3px_10px_rgba(23,107,80,0.20)] ring-1 ring-[#176B50] dark:bg-emerald-300 dark:text-emerald-950 dark:ring-emerald-300',
    inactiveCount: 'bg-[#cfe1d9] text-[#176B50] dark:bg-emerald-900 dark:text-emerald-200',
    activeCard:
      'border-[#176B50] bg-[#F0F7F4] text-[#123F32] ring-1 ring-[#176B50] ring-inset dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-400',
    check: 'bg-[#176B50] text-white dark:bg-emerald-300 dark:text-emerald-950',
    activeIcon: 'bg-white/80 dark:bg-emerald-900',
    offerBorder: 'border-[#d8e5dd]',
    activeOffer:
      'bg-[#e5f0e9] text-[#123f32] ring-1 ring-[#c5dbcf] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800',
  },
  rooms: {
    activeTab:
      'bg-[#2D8FC7] text-white shadow-[0_3px_10px_rgba(45,143,199,0.22)] ring-1 ring-[#2D8FC7] dark:bg-[#8fd4f4] dark:text-[#102b3a] dark:ring-[#8fd4f4]',
    inactiveCount: 'bg-[#E0F2FC] text-[#1676AE] dark:bg-[#102b3a] dark:text-[#8fd4f4]',
    activeCard:
      'border-[#2D8FC7] bg-[#E0F2FC] text-[#155C82] ring-1 ring-[#2D8FC7] ring-inset dark:border-[#8fd4f4] dark:bg-[#102b3a] dark:text-[#d8f2ff] dark:ring-[#8fd4f4]',
    check: 'bg-[#2D8FC7] text-white dark:bg-[#8fd4f4] dark:text-[#102b3a]',
    activeIcon: 'bg-white/80 dark:bg-[#173747]',
    offerBorder: 'border-[#cde2ee]',
    activeOffer:
      'bg-[#e9f4fa] text-[#155c82] ring-1 ring-[#c9e2ef] dark:bg-[#102b3a] dark:text-[#bce9fc] dark:ring-[#28566e]',
  },
  business: {
    activeTab:
      'bg-[#E65A2F] text-white shadow-[0_3px_10px_rgba(230,90,47,0.22)] ring-1 ring-[#E65A2F] dark:bg-[#FFC2AD] dark:text-[#351B14] dark:ring-[#FFC2AD]',
    inactiveCount: 'bg-[#FFE7DC] text-[#D94A22] dark:bg-[#351B14] dark:text-[#FFC2AD]',
    activeCard:
      'border-[#E65A2F] bg-[#FFF2EC] text-[#8C321D] ring-1 ring-[#E65A2F] ring-inset dark:border-[#FFC2AD] dark:bg-[#351B14] dark:text-[#FFE8DF] dark:ring-[#FFC2AD]',
    check: 'bg-[#E65A2F] text-white dark:bg-[#FFC2AD] dark:text-[#351B14]',
    activeIcon: 'bg-white/80 dark:bg-[#4A251C]',
    offerBorder: 'border-[#eddcd4]',
    activeOffer:
      'bg-[#fff0e8] text-[#974326] ring-1 ring-[#f0d4c5] dark:bg-[#351b14] dark:text-[#ffccb9] dark:ring-[#71412e]',
  },
}

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
    return getMobilePropertyMapSearchUrl({
      query,
      channel: propertyGroup,
      selectedCategories: selectedPropertyTypes.map((property) => property.value),
      offerType,
      minPrice: budget.minPrice ? Number(budget.minPrice) : undefined,
      maxPrice: budget.maxPrice ? Number(budget.maxPrice) : undefined,
    })
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
      <div className={`flex w-full items-center ${compactMapHeader && isMapResults ? 'gap-1.5' : 'gap-2.5'}`}>
        <MobilePropertyBrandMark />
        <button
          type="button"
          data-mobile-property-search-trigger
          onClick={() => setOpen(true)}
          className={`flex min-w-0 flex-1 items-center rounded-full border border-neutral-200 bg-white text-start transition active:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 ${
            compactMapHeader && isMapResults
              ? 'min-h-11 gap-2 py-1.5 ps-2.5 pe-3 shadow-sm'
              : 'min-h-12 gap-2.5 py-1.5 ps-2.5 pe-3 shadow-[0_5px_18px_rgba(15,23,42,0.09)]'
          }`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf4ef] text-[#123f32] dark:bg-emerald-950 dark:text-emerald-200">
            <Search className="size-4.5" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-white">
              {isMapResults && mapQuery
                ? mapQuery
                : isThai
                  ? 'ค้นหาทำเลหรืออสังหาที่ต้องการ'
                  : 'Search location or property'}
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
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
                    : 'พิมพ์หรือแตะตัวเลือกได้เลย'
                  : isMapResults
                    ? 'All properties · Any budget'
                    : 'Type or tap a quick option'}
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
        <div data-sheet-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-28">
          <section>
            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              {propertyGroups.map((group) => {
                const active = propertyGroup === group.value
                const tone = propertyGroupTones[group.value]
                const selectedCount = selectedPropertyTypes.filter(
                  (property) => property.channel === group.value
                ).length

                return (
                  <button
                    key={group.value}
                    type="button"
                    data-mobile-search-group={group.value}
                    onClick={() => {
                      setPropertyGroup(group.value)
                      setPropertyZone(group.value)
                      setSelectedPropertyTypes([])
                      setBudget(emptySearchBudget)
                      setOfferType(group.value === 'rooms' ? 'rent' : '')
                    }}
                    aria-pressed={active}
                    className={`flex min-h-12 items-center justify-center gap-1 rounded-xl px-1 text-[10px] leading-tight font-semibold transition min-[390px]:text-[11px] ${
                      active
                        ? tone.activeTab
                        : 'text-neutral-600 hover:bg-white/55 active:bg-white/80 dark:text-neutral-300 dark:hover:bg-neutral-700/60 dark:active:bg-neutral-700'
                    }`}
                  >
                    <span className="text-center">
                      {isThai ? (
                        <PropertyCategoryLabel
                          label={group.label}
                          ampersandClassName={active ? 'text-white/55' : 'text-neutral-400'}
                        />
                      ) : (
                        group.labelEn
                      )}
                    </span>
                    {selectedCount > 0 && (
                      <span
                        className={`grid size-4 shrink-0 place-items-center rounded-full text-[9px] ${
                          active
                            ? 'bg-white/20 text-white ring-1 ring-white/30 dark:bg-emerald-950/15 dark:text-emerald-950 dark:ring-emerald-950/20'
                            : tone.inactiveCount
                        }`}
                      >
                        {selectedCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {isThai ? 'เลือกประเภทที่สนใจ' : 'Choose property types'}
              </h2>
              {hasQuickFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setPropertyGroup(activePropertyGroup)
                    setOfferType(activePropertyGroup === 'rooms' ? 'rent' : '')
                    setSelectedPropertyTypes([])
                    setBudget(emptySearchBudget)
                  }}
                  className="text-xs font-semibold text-[#176b50] dark:text-emerald-300"
                >
                  {isThai ? 'ล้างทั้งหมด' : 'Clear all'}
                </button>
              )}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 pt-1 pb-1">
              {visiblePropertyTypes.map((property) => {
                const Icon = categoryIcons[property.propertyType]
                const active = selectedPropertyTypes.some((item) => item.value === property.value)
                const tone = propertyGroupTones[propertyGroup]
                return (
                  <button
                    key={property.value}
                    type="button"
                    data-mobile-search-category={property.value}
                    onClick={() => togglePropertyType(property)}
                    aria-pressed={active}
                    className={`relative flex min-h-[78px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-2 text-[11px] leading-tight font-semibold transition ${
                      active
                        ? tone.activeCard
                        : 'border-neutral-200 bg-white text-neutral-600 active:border-[#8ab6a7] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    {active && (
                      <span
                        className={`absolute end-1.5 top-1.5 grid size-4 place-items-center rounded-full ${tone.check}`}
                      >
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className={`grid size-8 place-items-center rounded-full ${active ? tone.activeIcon : 'bg-neutral-100 dark:bg-neutral-800'}`}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    <span className="text-center">{isThai ? property.label : property.labelEn}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section
            className="mt-5 flex flex-wrap items-start gap-2"
            aria-label={isThai ? 'ซื้อ เช่า และงบประมาณ' : 'Buy, rent and budget'}
          >
            <div
              className={`inline-flex shrink-0 gap-0.5 rounded-2xl border bg-white p-1 ${propertyGroupTones[propertyGroup].offerBorder} dark:border-neutral-700 dark:bg-neutral-900`}
              role="group"
              aria-label={isThai ? 'เลือกซื้อหรือเช่า' : 'Choose buy or rent'}
            >
              {(['sale', 'rent'] as const)
                .filter((offer) => propertyGroup !== 'rooms' || offer === 'rent')
                .map((offer) => {
                  const active = !offerType || offerType === offer
                  const Icon = offer === 'sale' ? House : KeyRound
                  return (
                    <button
                      key={offer}
                      type="button"
                      data-mobile-search-offer={offer}
                      aria-pressed={active}
                      onClick={() => {
                        if (offerType !== offer) {
                          setOfferType(offer)
                          setBudget(emptySearchBudget)
                        }
                      }}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${active ? propertyGroupTones[propertyGroup].activeOffer : 'text-neutral-500 dark:text-neutral-400'}`}
                    >
                      <Icon className="size-4.5" strokeWidth={1.8} />
                      {offer === 'sale' ? (isThai ? 'ซื้อ' : 'Buy') : isThai ? 'เช่า' : 'Rent'}
                    </button>
                  )
                })}
            </div>
            <button
              type="button"
              data-mobile-search-budget
              onClick={openBudget}
              className={`flex min-h-[54px] min-w-[116px] flex-1 items-center gap-2 rounded-2xl border bg-white px-3 text-start text-sm dark:bg-neutral-900 ${hasBudget ? 'border-neutral-800 dark:border-neutral-300' : 'border-neutral-200 dark:border-neutral-700'}`}
            >
              <Banknote className="size-4.5 shrink-0 text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{isThai ? 'งบประมาณ' : 'Budget'}</span>
                {hasBudget && <span className="block py-1 text-xs leading-5">{budgetLabel}</span>}
              </span>
              <ChevronRight className="size-4 shrink-0 text-neutral-400" />
            </button>
          </section>

          <section data-sheet-no-drag className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <MapPin className="size-4.5 text-[#176b50] dark:text-emerald-300" />
              {isThai ? 'ทำเลที่ต้องการ?' : 'Where do you want to look?'}
            </div>
            <PropertySearchOmnibox
              buildSearchUrl={buildMapSearchUrl}
              allowEmptyQuery
              suggestionsMode="inline"
              suggestionScope="location"
              scrollSuggestionsIntoView
              showTypeLabels
              placeholder={isThai ? 'จังหวัด เขต ย่าน หรือชื่อโครงการ' : 'Province, area, or project name'}
              onSubmitQuery={() => setOpen(false)}
            />
          </section>
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
