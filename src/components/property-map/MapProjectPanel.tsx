'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { toRealEstateListing, type TRealEstateListing } from '@/data/listings'
import {
  fetchMapProject,
  fetchMapProjectListings,
  hasProjectOffer,
  projectCategoryLabel,
  validProjectLocation,
  type MapProject,
  type MapProjectDetails,
} from '@/lib/propertyMapProjects'
import { hasMapCoordinates } from '@/lib/propertyMapSearch'
import type { PropertySearchListing } from '@/lib/propertySearch'
import { ArrowLeft, Building2, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import MapResultCard from './MapResultCard'
import styles from './PropertyMapSearch.module.css'

export default function MapProjectPanel({
  identifier,
  seed,
  expanded,
  onToggle,
  onClose,
  onHover,
  onLocate,
}: {
  identifier: string
  seed?: MapProject
  expanded: boolean
  onToggle: () => void
  onClose: () => void
  onHover: (id: string) => void
  onLocate: (listing: TRealEstateListing) => void
}) {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [data, setData] = useState<{ project: MapProjectDetails; rows: PropertySearchListing[] }>()
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [offer, setOffer] = useState<'all' | 'sale' | 'rent'>('all')
  const [sort, setSort] = useState<'newest' | 'price_low'>('newest')
  const [visible, setVisible] = useState(20)
  const scrollRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }))
    return () => window.cancelAnimationFrame(frame)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetchMapProject(identifier, controller.signal),
      fetchMapProjectListings(identifier, controller.signal),
    ])
      .then(([project, rows]) => {
        if (!controller.signal.aborted) setData({ project, rows })
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [identifier, retry])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [offer, sort])
  const project = data?.project
  const name =
    project?.display_name || seed?.displayName || project?.name_en || seed?.nameEn || project?.name_th || seed?.name
  const category = project?.project_category || seed?.category
  const categoryLabel = projectCategoryLabel(category || '', th)
  const counts = {
    all: data?.rows.length || 0,
    sale: data?.rows.filter((row) => hasProjectOffer(row, 'sale')).length || 0,
    rent: data?.rows.filter((row) => hasProjectOffer(row, 'rent')).length || 0,
  }
  const rows = useMemo(() => {
    const selected = (data?.rows || [])
      .filter((row) => offer === 'all' || hasProjectOffer(row, offer))
      .map((row) => {
        const listing = toRealEstateListing(row)
        if (offer === 'rent') {
          listing.priceAmount = row.rent_price_monthly || row.offer_amount
          listing.priceUnit = 'month'
          listing.offer = 'เช่า'
        } else if (offer === 'sale') {
          listing.priceAmount = row.sale_price || row.offer_amount
          listing.priceUnit = ''
          listing.offer = 'ขาย'
        }
        // A project pin can locate a unit with no precise unit coordinate.
        const location = hasMapCoordinates(row)
          ? { lat: row.latitude!, lng: row.longitude! }
          : validProjectLocation(project?.latitude, project?.longitude)
            ? { lat: project!.latitude!, lng: project!.longitude! }
            : null
        return { listing: { ...listing, map: location || listing.map }, canLocate: Boolean(location) }
      })
    return selected.sort((a, b) =>
      sort === 'price_low'
        ? !a.listing.priceAmount || !b.listing.priceAmount
          ? Number(!a.listing.priceAmount) - Number(!b.listing.priceAmount)
          : a.listing.priceAmount - b.listing.priceAmount
        : new Date(b.listing.date || 0).getTime() - new Date(a.listing.date || 0).getTime()
    )
  }, [data, offer, project, sort])

  return (
    <div
      id="map-project-listings"
      data-map-project-panel
      className={styles.resultsList}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <button
        type="button"
        data-map-mobile-panel-toggle
        data-sheet-drag-handle
        className={styles.mobilePanelToggle}
        aria-expanded={expanded}
        aria-controls="map-project-content"
        onClick={onToggle}
      >
        <span className="mx-auto mb-1.5 block h-1 w-9 rounded-full bg-neutral-300" aria-hidden="true" />
        <span className={styles.sheetSummaryRow}>
          <span className={styles.sheetSummary}>{name || (th ? 'ประกาศในโครงการ' : 'Project listings')}</span>
          <span className={styles.mobilePanelAction}>
            {expanded ? (th ? 'ดูแผนที่' : 'View map') : th ? 'ดูประกาศ' : 'View listings'}
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </span>
        </span>
        <span className={styles.sheetSummaryRow}>
          <span className={styles.sheetArea}>
            <Building2 className="size-3.5" />
            {categoryLabel}
          </span>
          <span className={styles.sheetCount}>
            {data
              ? `${counts.all} ${th ? 'ประกาศ' : 'listings'}`
              : failed
                ? th
                  ? 'โหลดไม่สำเร็จ'
                  : 'Unable to load'
                : th
                  ? 'กำลังโหลด…'
                  : 'Loading…'}
          </span>
        </span>
      </button>
      <div id="map-project-content" className={styles.resultsContent}>
        <header className={styles.projectHeader}>
          <button type="button" ref={backRef} onClick={onClose} data-map-project-back className={styles.projectBack}>
            <ArrowLeft className="size-4" />
            {th ? 'กลับไปดูบริเวณนี้' : 'Back to area results'}
          </button>
          <div className={styles.projectIdentity}>
            <span className={styles.projectIcon}>
              <Building2 className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-[#638171]">{categoryLabel}</p>
              <h2 className="mt-0.5 text-base leading-6 font-semibold">
                {name || (th ? 'ประกาศในโครงการ' : 'Project listings')}
              </h2>
              {project && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {[project.district, project.province].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          <div className={styles.projectOffers} aria-label={th ? 'ประเภทประกาศในโครงการ' : 'Project listing offer'}>
            {(['all', 'sale', 'rent'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={offer === value}
                data-project-offer={value}
                onClick={() => {
                  setOffer(value)
                  setVisible(20)
                }}
              >
                {value === 'all'
                  ? th
                    ? 'ทั้งหมด'
                    : 'All'
                  : value === 'sale'
                    ? th
                      ? 'ขาย'
                      : 'For sale'
                    : th
                      ? 'เช่า'
                      : 'For rent'}
                <span>{data ? counts[value] : '–'}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-neutral-500">
            <p aria-live="polite">
              {data
                ? th
                  ? `${rows.length} ประกาศในโครงการนี้`
                  : `${rows.length} listings in this project`
                : th
                  ? 'กำลังโหลดประกาศในโครงการ'
                  : 'Loading project listings'}
            </p>
            <select
              aria-label={th ? 'เรียงประกาศในโครงการ' : 'Sort project listings'}
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="min-h-9 max-w-[45%] rounded-lg border-neutral-200 py-0 text-xs dark:bg-neutral-900"
            >
              <option value="newest">{th ? 'ใหม่ล่าสุด' : 'Newest'}</option>
              <option value="price_low">{th ? 'ราคาต่ำก่อน' : 'Lowest price'}</option>
            </select>
          </div>
        </header>
        <div
          ref={scrollRef}
          data-sheet-scroll
          data-map-project-rows
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
          aria-busy={!data && !failed}
        >
          {failed ? (
            <div role="alert" className="p-5 text-center text-sm">
              <p>{th ? 'โหลดประกาศในโครงการไม่สำเร็จ' : 'Unable to load this project'}</p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false)
                  setRetry(retry + 1)
                }}
                className="mt-3 min-h-11 rounded-xl bg-[#176b50] px-5 text-white"
              >
                {th ? 'ลองอีกครั้ง' : 'Retry'}
              </button>
            </div>
          ) : !data ? (
            <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-neutral-500">
              <LoaderCircle className="size-5 animate-spin" />
              {th ? 'กำลังโหลด…' : 'Loading…'}
            </div>
          ) : !rows.length ? (
            <div className="px-5 py-7 text-center text-sm text-neutral-500">
              <Building2 className="mx-auto mb-3 size-8 text-[#638171]" />
              <p>
                {offer === 'all'
                  ? th
                    ? 'ยังไม่มีประกาศที่เปิดอยู่ในโครงการนี้'
                    : 'No active listings in this project'
                  : th
                    ? `ยังไม่มีประกาศ${offer === 'sale' ? 'ขาย' : 'เช่า'}ในโครงการนี้`
                    : `No listings for ${offer} in this project`}
              </p>
              {offer !== 'all' && (
                <button
                  type="button"
                  onClick={() => setOffer('all')}
                  className="mt-3 min-h-11 font-semibold text-[#176b50]"
                >
                  {th ? 'ดูประกาศทั้งหมด' : 'View all listings'}
                </button>
              )}
            </div>
          ) : (
            rows
              .slice(0, visible)
              .map(({ listing, canLocate }) => (
                <MapResultCard
                  key={listing.id}
                  compact
                  listing={listing}
                  onHover={onHover}
                  onLocate={canLocate ? () => onLocate(listing) : undefined}
                />
              ))
          )}
          {rows.length > visible && (
            <button
              type="button"
              onClick={() => setVisible(visible + 20)}
              className="min-h-11 w-full rounded-xl text-sm font-semibold text-[#176b50]"
            >
              {th ? 'ดูประกาศเพิ่มเติม' : 'Show more listings'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
