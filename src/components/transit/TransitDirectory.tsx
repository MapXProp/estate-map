'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getTransitDirectoryGroups, getTransitDirectoryMapUrl } from '@/lib/transitDirectory'
import {
  transitCatalogReviewedAt,
  transitLineCatalog,
  transitLineStations,
  transitStations,
} from '@/lib/transitStations'
import { ArrowRight, ChevronRight, MapPin, Search, TrainFront, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState, type CSSProperties } from 'react'
import styles from './TransitDirectory.module.css'

const lineCounts = Object.fromEntries(
  transitLineCatalog.map((line) => [line.id, transitLineStations.filter((stop) => stop.lineId === line.id).length])
)

export default function TransitDirectory() {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const [query, setQuery] = useState('')
  const [lineId, setLineId] = useState('')
  const groups = useMemo(() => getTransitDirectoryGroups(query, lineId), [query, lineId])
  const resultCount = new Set(groups.flatMap((group) => group.stops.map((stop) => stop.stationId))).size
  const reset = () => {
    setQuery('')
    setLineId('')
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumb} aria-label={th ? 'เส้นทางนำทาง' : 'Breadcrumb'}>
          <Link href="/homes">{th ? 'หน้าแรก' : 'Home'}</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{th ? 'อสังหาฯ ใกล้รถไฟฟ้า' : 'Property near transit'}</span>
        </nav>

        <section className={styles.hero} aria-labelledby="transit-title">
          <div className={styles.intro}>
            <p className={styles.eyebrow}>
              <TrainFront size={16} aria-hidden="true" />{' '}
              {th ? 'ทำเลที่ใช่ เดินทางสะดวก' : 'Your place. Better connected.'}
            </p>
            <h1 id="transit-title">{th ? 'ค้นหาอสังหาฯ ใกล้สถานีรถไฟฟ้า' : 'Find property near a transit station'}</h1>
            <p>
              {th
                ? 'รวมสาย BTS, MRT, Airport Rail Link และสายสีแดงในกรุงเทพฯ และปริมณฑล เลือกสถานีเพื่อดูพิกัดและสำรวจบ้าน คอนโด ห้องเช่า หรือพื้นที่ธุรกิจบนแผนที่'
                : 'Browse BTS, MRT, Airport Rail Link and SRT Red Line stations in Greater Bangkok. Select a station to explore homes, rooms and business spaces on the map.'}
            </p>
            <div className={styles.stats}>
              <span>
                <strong>{transitLineCatalog.length}</strong> {th ? 'สายที่เปิดให้บริการ' : 'operating lines'}
              </span>
              <span>
                <strong>{transitStations.length}</strong> {th ? 'สถานี พร้อมพิกัด' : 'mapped stations'}
              </span>
            </div>
          </div>
          <div className={styles.art} aria-hidden="true">
            <svg viewBox="0 0 340 220" fill="none">
              <path d="M10 35H140Q180 35 180 75V180Q180 200 215 200H330" stroke="#83b4a0" strokeWidth="11" />
              <path d="M10 145H88Q120 145 142 123L220 45Q235 30 260 30H330" stroke="#9dc6dc" strokeWidth="11" />
              <path d="M65 0V67Q65 95 95 95H260Q290 95 290 125V220" stroke="#e6bb82" strokeWidth="11" />
              <g fill="white" stroke="#527b68" strokeWidth="4">
                <circle cx="65" cy="35" r="8" />
                <circle cx="180" cy="95" r="11" />
                <circle cx="240" cy="200" r="8" />
              </g>
              <g fill="white" stroke="#648ba3" strokeWidth="4">
                <circle cx="65" cy="145" r="8" />
                <circle cx="220" cy="45" r="8" />
              </g>
            </svg>
            <div className={styles.artPin}>
              <TrainFront size={25} />
              <span>{th ? 'เริ่มต้นที่สถานี' : 'Start at a station'}</span>
              <MapPin size={17} />
            </div>
          </div>
        </section>

        <section className={styles.explorer} aria-labelledby="transit-lines-title">
          <div className={styles.sectionHeading}>
            <h2 id="transit-lines-title">{th ? 'เลือกสายรถไฟฟ้า' : 'Choose your transit line'}</h2>
            <button type="button" aria-pressed={!lineId} onClick={() => setLineId('')}>
              {th ? 'ทุกสาย' : 'All lines'} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.lines} role="group" aria-label={th ? 'เลือกสายรถไฟฟ้า' : 'Select a transit line'}>
            {transitLineCatalog.map((line) => (
              <button
                key={line.id}
                type="button"
                aria-pressed={lineId === line.id}
                className={styles.lineChoice}
                style={{ '--line-color': line.color } as CSSProperties}
                onClick={() => setLineId((current) => (current === line.id ? '' : line.id))}
              >
                <span className={styles.lineIcon}>
                  <TrainFront size={23} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className={styles.lineText}>
                  <small>{line.system}</small>
                  <strong>{th ? line.nameTh : line.nameEn}</strong>
                  <span>
                    {lineCounts[line.id]} {th ? 'สถานี' : 'stations'}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={21} aria-hidden="true" />
              <label htmlFor="transit-station-search" className="sr-only">
                {th ? 'ค้นหาสถานี ชื่อสาย หรือรหัสสถานี' : 'Search station, line or station code'}
              </label>
              <input
                id="transit-station-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  th ? 'ชื่อสถานี สาย หรือรหัส เช่น อารีย์, BTS, BL20' : 'Station, line or code, e.g. Ari, BTS, BL20'
                }
                maxLength={120}
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label={th ? 'ล้างคำค้นหา' : 'Clear search'}>
                  <X size={17} />
                </button>
              ) : null}
            </div>
            <p aria-live="polite" role="status">
              {resultCount} {th ? 'สถานี' : 'stations'} · {groups.length} {th ? 'สาย' : 'lines'}
            </p>
          </div>
        </section>

        <div className={styles.results}>
          {groups.map(({ line, stops }) => (
            <section
              key={line.id}
              className={styles.lineSection}
              style={{ '--line-color': line.color } as CSSProperties}
              aria-labelledby={`line-${line.id}`}
            >
              <div className={styles.lineHeading}>
                <div className={styles.headingName}>
                  <span className={styles.system}>{line.system}</span>
                  <h2 id={`line-${line.id}`}>{th ? line.nameTh : line.nameEn}</h2>
                </div>
                <span>
                  {stops.length} {th ? 'สถานี' : 'stations'}
                </span>
              </div>
              {['main', ...line.branches.map((branch) => branch.id)].map((branchId) => {
                const branchStops = stops.filter((stop) => stop.branchId === branchId)
                if (!branchStops.length) return null
                const branch = line.branches.find((item) => item.id === branchId)
                return (
                  <div key={branchId}>
                    {branch ? <h3 className={styles.branch}>{th ? branch.nameTh : branch.nameEn}</h3> : null}
                    <div className={styles.stations}>
                      {branchStops.map(({ station, code }) => (
                        <article key={station.id} className={styles.station}>
                          <Link
                            href={getTransitDirectoryMapUrl(station.id)}
                            className={styles.stationLink}
                            aria-label={
                              th
                                ? `ดูอสังหาฯ ใกล้ ${station.system} ${station.nameTh} บนแผนที่`
                                : `Explore property near ${station.system} ${station.nameEn} on the map`
                            }
                          >
                            <span className={styles.stationCode}>{code}</span>
                            <span className={styles.stationName}>
                              <strong>{th ? station.nameTh : station.nameEn}</strong>
                              <span>{th ? station.nameEn : station.nameTh}</span>
                            </span>
                            <ArrowRight className={styles.stationArrow} size={17} aria-hidden="true" />
                          </Link>
                          {station.lines.length > 1 ? (
                            <p className={styles.interchange}>
                              {th ? 'สถานีร่วม' : 'Shared station'} ·{' '}
                              {station.lines
                                .filter((id) => id !== line.id)
                                .map((id) => {
                                  const other = transitLineCatalog.find((item) => item.id === id)
                                  return th ? other?.nameTh : other?.nameEn
                                })
                                .join(' / ')}
                            </p>
                          ) : null}
                          <div className={styles.stationActions}>
                            <Link
                              href={getTransitDirectoryMapUrl(station.id, 'sale')}
                              aria-label={
                                th
                                  ? `ประกาศขายใกล้ ${station.system} ${station.nameTh}`
                                  : `For sale near ${station.system} ${station.nameEn}`
                              }
                            >
                              {th ? 'ประกาศขาย' : 'For sale'} <ChevronRight size={13} aria-hidden="true" />
                            </Link>
                            <Link
                              href={getTransitDirectoryMapUrl(station.id, 'rent')}
                              aria-label={
                                th
                                  ? `ประกาศเช่าใกล้ ${station.system} ${station.nameTh}`
                                  : `For rent near ${station.system} ${station.nameEn}`
                              }
                            >
                              {th ? 'ประกาศเช่า' : 'For rent'} <ChevronRight size={13} aria-hidden="true" />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
          {!groups.length ? (
            <div className={styles.empty}>
              <Search size={30} aria-hidden="true" />
              <h2>{th ? 'ไม่พบสถานีที่ตรงกับการค้นหา' : 'No matching stations'}</h2>
              <p>
                {th
                  ? 'ลองชื่อไทย อังกฤษ รหัสสถานี หรือเลือกค้นหาจากทุกสาย'
                  : 'Try a Thai or English name, station code, or search all lines.'}
              </p>
              <button type="button" onClick={reset}>
                {th ? 'ล้างตัวกรองและดูทุกสถานี' : 'Clear filters and show all stations'}
              </button>
            </div>
          ) : null}
        </div>
        <p className={styles.source}>
          {th
            ? 'รวมสายรถไฟฟ้าที่เปิดให้บริการในกรุงเทพฯ และปริมณฑล · อ้างอิงข้อมูลจาก '
            : 'Operating electric rail in Bangkok and surrounding provinces · Sources: '}
          <a href="https://data.go.th/en/dataset/rail_station" target="_blank" rel="noopener noreferrer">
            {th ? 'กรมการขนส่งทางราง' : 'Department of Rail Transport'}
          </a>
          {th ? ' และผู้ให้บริการ' : ' and rail operators'}
          {transitCatalogReviewedAt ? (
            <>
              {th ? ' · ตรวจข้อมูลล่าสุด ' : ' · Last reviewed '}
              <time dateTime={transitCatalogReviewedAt}>
                {new Intl.DateTimeFormat(th ? 'th-TH' : 'en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(`${transitCatalogReviewedAt}T00:00:00Z`))}
              </time>
            </>
          ) : null}
        </p>
      </div>
    </main>
  )
}
