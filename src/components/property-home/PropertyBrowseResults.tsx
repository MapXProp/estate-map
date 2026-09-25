'use client'

import BtnLikeIcon from '@/components/BtnLikeIcon'
import ListingImageFallback from '@/components/ListingImageFallback'
import PropertyPrices from '@/components/PropertyPrices'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import MapSearchDetails from '@/components/property-map/MapSearchDetails'
import { getPropertyType, normalizeLegacyPropertyType } from '@/data/propertyTaxonomy'
import { browseCategoryLabels, browseDefaults, browseHref, browseParams, type BrowseState } from '@/lib/propertyBrowse'
import type { BrowseResults } from '@/lib/propertyBrowseServer'
import { CATALOG_PAGE_SIZE } from '@/lib/propertyCatalog'
import { isDefaultMapOffers } from '@/lib/propertyMapSearch'
import { filterPropertyPrices, getPropertyPrices, propertyOffersLabel } from '@/lib/propertyPrices'
import { rememberPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import type { PropertySearchListing } from '@/lib/propertySearch'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {
  ArrowDown,
  Banknote,
  Bath,
  BedDouble,
  Check,
  ChevronDown,
  Grid2X2,
  Map as MapIcon,
  MapPin,
  Ruler,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import BrowseTypePicker from './BrowseTypePicker'
import styles from './PropertyBrowseResults.module.css'
import PropertyPagination from './PropertyPagination'
import PropertySearchOmnibox from './PropertySearchOmnibox'

const RESTORE_KEY = 'mapxprop:browse-position'
type Snapshot = { href: string; savedAt: number; y: number; rows: PropertySearchListing[]; page: number }

export default function PropertyBrowseResults({ state, initial }: { state: BrowseState; initial: BrowseResults }) {
  const { locale } = usePreferences(),
    th = locale === 'th'
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rows, setRows] = useState(initial.listings)
  const [lastPage, setLastPage] = useState(initial.page)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [typesOpen, setTypesOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const request = useRef<AbortController | null>(null)
  const searchRoot = useRef<HTMLDivElement>(null)
  const href = browseHref(state, initial.page)
  const categoryLabels = browseCategoryLabels(state.categories, th)
  const detailsCount =
    Number(!!(state.filters.minPrice || state.filters.maxPrice)) +
    Number(!!state.filters.bedrooms) +
    Number(!!state.filters.bathrooms) +
    Number(!!state.filters.minArea) +
    state.filters.features.length
  const filtered =
    !!state.query || state.categories.length > 0 || !isDefaultMapOffers(state.filters.offerTypes) || detailsCount > 0
  const invalidBudget = !!(
    state.filters.minPrice &&
    state.filters.maxPrice &&
    Number(state.filters.minPrice) > Number(state.filters.maxPrice)
  )
  const update = (next: BrowseState) => startTransition(() => router.push(browseHref(next), { scroll: false }))
  const reset = () => update({ ...state, query: '', station: '', categories: [], filters: { ...browseDefaults } })
  const savePosition = () => {
    try {
      sessionStorage.setItem(
        RESTORE_KEY,
        JSON.stringify({ href, savedAt: Date.now(), y: window.scrollY, rows, page: lastPage } satisfies Snapshot)
      )
      rememberPropertyResultsLocation(href)
    } catch {
      /* Storage denial must never block opening a listing. */
    }
  }
  useEffect(() => {
    let frame = 0
    try {
      const saved = JSON.parse(sessionStorage.getItem(RESTORE_KEY) || 'null') as Snapshot | null
      if (
        saved?.href === href &&
        Date.now() - saved.savedAt < 30 * 60_000 &&
        Array.isArray(saved.rows) &&
        saved.rows.length >= initial.listings.length
      ) {
        // Restoring a prior external browser history entry, including appended pages.
        setRows(saved.rows)
        setLastPage(saved.page)
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            window.scrollTo({ top: saved.y, behavior: 'instant' })
            sessionStorage.removeItem(RESTORE_KEY)
          })
        })
      }
    } catch {
      /* Native browser restoration remains the fallback. */
    }
    return () => {
      cancelAnimationFrame(frame)
      request.current?.abort()
    }
  }, [href, initial.listings.length])
  const loadMore = async () => {
    if (loadingMore) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoadingMore(true)
    setLoadError(false)
    try {
      const response = await fetch(`/api/property-browse?${browseParams(state, lastPage + 1)}`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Could not load listings')
      const result = (await response.json()) as BrowseResults
      if (!Array.isArray(result.listings)) throw new Error('Invalid listings')
      setRows((current) => [...new Map([...current, ...result.listings].map((row) => [row.id, row])).values()])
      setLastPage(result.page)
    } catch {
      if (!controller.signal.aborted) setLoadError(true)
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false)
    }
  }
  const countLabel = th
    ? `${initial.total.toLocaleString('th-TH')} ประกาศ`
    : `${initial.total.toLocaleString()} listings`
  return (
    <main className={styles.page} data-property-browse>
      <div className="container">
        <div className={styles.heading}>
          <div>
            <h1>{th ? 'รวมประกาศ' : 'Property listings'}</h1>
            <p>{th ? 'เลือกพื้นที่สำหรับชีวิตและธุรกิจของคุณ' : 'A place for your life or your next business.'}</p>
          </div>
          <div className={styles.views} aria-label={th ? 'มุมมองผลการค้นหา' : 'Results view'}>
            <span aria-current="page">
              <Grid2X2 size={17} />
              {th ? 'รายการ' : 'Listings'}
            </span>
            <Link data-browse-map href={browseHref(state, 1, true)} onClick={savePosition}>
              <MapIcon size={17} />
              {th ? 'แผนที่' : 'Map'}
            </Link>
          </div>
        </div>
        <div className={styles.tools}>
          <div ref={searchRoot} className={styles.search} data-browse-search>
            <PropertySearchOmnibox
              variant="sheet"
              initialQuery={state.query}
              allowEmptyQuery
              placeholder={th ? 'ค้นหาจากทุกข้อมูลในประกาศ' : 'Search all listing details'}
              buildSearchUrl={(query) => browseHref({ ...state, query, station: '' })}
            />
          </div>
          <div className={styles.filters} aria-label={th ? 'ตัวกรองประกาศ' : 'Listing filters'}>
            <Popover className="relative">
              <PopoverButton className={styles.filter} data-browse-offer>
                <span>
                  {state.filters.offerTypes.length === 1
                    ? state.filters.offerTypes[0] === 'sale'
                      ? th
                        ? 'ซื้อ'
                        : 'Buy'
                      : th
                        ? 'เช่า'
                        : 'Rent'
                    : th
                      ? 'ซื้อ / เช่า'
                      : 'Buy / rent'}
                </span>
                <ChevronDown size={15} />
              </PopoverButton>
              <PopoverPanel anchor="bottom start" className={styles.offerPanel}>
                {({ close }) => (
                  <>
                    {['', 'sale', 'rent'].map((value, i) => (
                      <button
                        key={value}
                        data-browse-offer-option={value || 'all'}
                        onClick={() => {
                          update({
                            ...state,
                            filters: {
                              ...state.filters,
                              offerTypes: value ? [value as 'sale' | 'rent'] : ['sale', 'rent'],
                            },
                          })
                          close()
                        }}
                      >
                        {(th ? ['ทั้งหมด', 'ซื้อ', 'เช่า'] : ['All', 'Buy', 'Rent'])[i]}
                        {(value
                          ? state.filters.offerTypes.length === 1 && state.filters.offerTypes[0] === value
                          : isDefaultMapOffers(state.filters.offerTypes)) && <Check size={16} />}
                      </button>
                    ))}
                  </>
                )}
              </PopoverPanel>
            </Popover>
            <button className={styles.filter} data-browse-types onClick={() => setTypesOpen(true)}>
              <span>
                {categoryLabels.length
                  ? th
                    ? `ประเภท (${categoryLabels.length})`
                    : `Types (${categoryLabels.length})`
                  : th
                    ? 'ประเภททรัพย์'
                    : 'Property type'}
              </span>
              <ChevronDown size={15} />
            </button>
            <button className={styles.filter} onClick={() => searchRoot.current?.querySelector('input')?.focus()}>
              <MapPin size={16} />
              {th ? 'ทำเล' : 'Location'}
            </button>
            <button className={styles.filter} data-browse-budget onClick={() => setDetailsOpen(true)}>
              <Banknote size={16} />
              {th ? 'งบประมาณ' : 'Budget'}
            </button>
            <button className={styles.filter} data-browse-details onClick={() => setDetailsOpen(true)}>
              <SlidersHorizontal size={16} />
              {th ? 'ตัวกรอง' : 'Filters'}
              {detailsCount > 0 && <b>{detailsCount}</b>}
            </button>
          </div>
        </div>
        {filtered && (
          <div className={styles.chips} data-browse-chips>
            {state.query && (
              <button onClick={() => update({ ...state, query: '', station: '' })}>
                {state.query}
                <X size={13} />
              </button>
            )}
            {categoryLabels.length > 0 && (
              <button onClick={() => update({ ...state, categories: [] })}>
                {categoryLabels.slice(0, 2).join(' · ')}
                {categoryLabels.length > 2 ? ` +${categoryLabels.length - 2}` : ''}
                <X size={13} />
              </button>
            )}
            {(state.filters.minPrice || state.filters.maxPrice) && (
              <button onClick={() => update({ ...state, filters: { ...state.filters, minPrice: '', maxPrice: '' } })}>
                {state.filters.minPrice ? Number(state.filters.minPrice).toLocaleString() : '0'}–
                {state.filters.maxPrice ? Number(state.filters.maxPrice).toLocaleString() : '∞'} {th ? 'บาท' : 'THB'}
                <X size={13} />
              </button>
            )}
            <button onClick={reset} className={styles.clear}>
              {th ? 'ล้างตัวกรอง' : 'Clear filters'}
            </button>
          </div>
        )}
        <div className={styles.resultsBar}>
          <p aria-live="polite" data-browse-count>
            {pending ? (th ? 'กำลังค้นหา…' : 'Searching…') : countLabel}
          </p>
          <label>
            {th ? 'เรียงตาม' : 'Sort'}
            <select
              data-browse-sort
              value={state.sort}
              disabled={pending}
              onChange={(event) => update({ ...state, sort: event.target.value as BrowseState['sort'] })}
            >
              <option value="newest">{th ? 'ล่าสุด' : 'Newest'}</option>
              <option value="price_low">{th ? 'ราคาต่ำไปสูง' : 'Price: low to high'}</option>
              <option value="price_high">{th ? 'ราคาสูงไปต่ำ' : 'Price: high to low'}</option>
            </select>
          </label>
        </div>
        <div aria-busy={pending} className={pending ? 'pointer-events-none opacity-50' : ''}>
          <ul className={styles.grid} data-browse-grid>
            {rows.map((listing, index) => (
              <BrowseCard
                key={listing.id}
                listing={listing}
                offers={state.filters.offerTypes}
                th={th}
                priority={index < 4}
                onOpen={savePosition}
              />
            ))}
          </ul>
          {!rows.length && (
            <div className={styles.empty}>
              <SearchX size={32} />
              <h2>{th ? 'ยังไม่พบประกาศที่ตรงกัน' : 'No matching listings yet'}</h2>
              <p>
                {invalidBudget
                  ? th
                    ? 'ราคาต่ำสุดต้องไม่มากกว่าราคาสูงสุด'
                    : 'Minimum price cannot exceed maximum price.'
                  : th
                    ? 'ลองขยายงบประมาณ เปลี่ยนทำเล หรือลดตัวกรอง'
                    : 'Try a wider budget, another location or fewer filters.'}
              </p>
              <button className={styles.more} onClick={reset}>
                {th ? 'ดูประกาศทั้งหมด' : 'View all listings'}
              </button>
            </div>
          )}
        </div>
        {lastPage * CATALOG_PAGE_SIZE < initial.total && (
          <div className={styles.loadMore}>
            <p>
              {th ? `แสดง ${rows.length} จาก ${initial.total} ประกาศ` : `Showing ${rows.length} of ${initial.total}`}
            </p>
            <button className={styles.more} data-browse-more disabled={loadingMore || pending} onClick={loadMore}>
              {loadingMore ? (th ? 'กำลังโหลด…' : 'Loading…') : th ? 'โหลดเพิ่มเติม' : 'Load more'}
              <ArrowDown size={17} />
            </button>
            {loadError && (
              <p role="alert">{th ? 'โหลดไม่สำเร็จ กดโหลดเพิ่มเติมเพื่อลองอีกครั้ง' : 'Could not load. Try again.'}</p>
            )}
          </div>
        )}
        <PropertyPagination
          page={initial.page}
          pages={Math.ceil(initial.total / CATALOG_PAGE_SIZE)}
          basePath={browseHref(state)}
        />
      </div>
      <MapSearchDetails
        open={detailsOpen}
        value={state.filters}
        onClose={() => setDetailsOpen(false)}
        onChange={(filters) => {
          if (JSON.stringify(filters) !== JSON.stringify(state.filters)) update({ ...state, filters })
        }}
      />
      {typesOpen && (
        <BrowseTypePicker
          value={state.categories}
          th={th}
          onClose={() => setTypesOpen(false)}
          onApply={(categories) => {
            setTypesOpen(false)
            update({ ...state, categories })
          }}
        />
      )}
    </main>
  )
}

function BrowseCard({
  listing,
  offers,
  th,
  priority,
  onOpen,
}: {
  listing: PropertySearchListing
  offers: string[]
  th: boolean
  priority: boolean
  onOpen: () => void
}) {
  const title = th ? listing.title : listing.title_en || listing.title
  const type = getPropertyType(normalizeLegacyPropertyType(listing.property_type_code))
  const prices = filterPropertyPrices(getPropertyPrices(listing), offers)
  const facts = [
    ...(listing.bedroom_count ? [{ icon: BedDouble, text: `${listing.bedroom_count} ${th ? 'นอน' : 'beds'}` }] : []),
    ...(listing.bathroom_count ? [{ icon: Bath, text: `${listing.bathroom_count} ${th ? 'น้ำ' : 'baths'}` }] : []),
    ...(listing.usable_area_sqm || listing.land_area_sqm
      ? [
          {
            icon: Ruler,
            text: listing.usable_area_sqm
              ? `${listing.usable_area_sqm.toLocaleString()} ${th ? 'ตร.ม.' : 'sq.m.'}`
              : `${((listing.land_area_sqm || 0) / 4).toLocaleString()} ${th ? 'ตร.ว.' : 'sq.wah'}`,
          },
        ]
      : []),
  ]
  return (
    <li className={styles.card} data-browse-card={listing.public_listing_id}>
      <Link
        href={`/real-estate-listings/${encodeURIComponent(listing.slug)}`}
        prefetch={false}
        onClick={onOpen}
        className={styles.cardLink}
      >
        <div className={styles.photo}>
          {listing.primary_image_url ? (
            <Image
              src={listing.primary_image_url}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width:743px) 48vw, (max-width:1099px) 32vw, 310px"
            />
          ) : (
            <ListingImageFallback />
          )}
          <span className={styles.offer}>{propertyOffersLabel(prices, th)}</span>
        </div>
        <div className={styles.body}>
          <PropertyPrices prices={prices} className={styles.prices} />
          <p className={styles.type}>{th ? type?.nameTh || 'อสังหาริมทรัพย์' : type?.nameEn || 'Property'}</p>
          <h2>{title}</h2>
          <p className={styles.location}>
            <MapPin size={14} />
            <span>
              {[
                th ? listing.district : listing.district_en || listing.district,
                th ? listing.province : listing.province_en || listing.province,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
          {facts.length > 0 && (
            <div className={styles.facts}>
              {facts.map(({ icon: Icon, text }) => (
                <span key={text}>
                  <Icon size={14} />
                  {text}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
      <BtnLikeIcon
        listingIdentifier={listing.slug || listing.public_listing_id}
        className={styles.save}
        colorClass="bg-white/95 text-neutral-700 shadow-sm hover:bg-white"
        sizeClass="size-10"
      />
    </li>
  )
}
