'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import styles from './DiscoverySectionNav.module.css'

const desktopQuery = '(min-width: 1280px) and (hover: hover) and (pointer: fine)'
const shortNames: Record<string, [string, string]> = {
  start: ['ค้นหา', 'Search'],
  latest: ['มาใหม่', 'New'],
  houses: ['บ้าน', 'Houses'],
  condos: ['คอนโด', 'Condos'],
  land: ['ที่ดิน', 'Land'],
  shophouses: ['ตึกแถว', 'Shophouses'],
  retail: ['ร้านค้า', 'Retail'],
  offices: ['ออฟฟิศ', 'Offices'],
  industrial: ['โกดัง', 'Industrial'],
  hospitality: ['โรงแรม', 'Hotels'],
  'rental-rooms': ['ห้องเช่า', 'Rooms'],
  apartments: ['อพาร์ตเมนต์', 'Apartments'],
  dormitories: ['หอพัก', 'Dorms'],
  flats: ['แฟลต', 'Flats'],
  'monthly-hotels': ['รายเดือน', 'Monthly'],
  locations: ['ทำเล', 'Locations'],
}
const wideNames: Record<string, [string, string]> = {
  latest: ['ประกาศมาใหม่', 'New listings'],
  retail: ['ร้านค้าและออกบูธ', 'Shops & booths'],
  shophouses: ['ตึกแถว / โฮมออฟฟิศ', 'Shops & home offices'],
  industrial: ['โกดัง / โรงงาน', 'Warehouses & factories'],
  hospitality: ['โรงแรม / อพาร์ตเมนต์', 'Hotels & apartments'],
}
type Stop = { id: string; key: string; label: string }

export default function DiscoverySectionNav({ th }: { th: boolean }) {
  const navRef = useRef<HTMLElement>(null)
  const [stops, setStops] = useState<Stop[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('main[data-discovery-channel]')
    if (!root) return
    const desktop = window.matchMedia(desktopQuery)
    let frame = 0,
      elements: HTMLElement[] = [],
      signature = '',
      activeIndex = -1
    let resizeObserver: ResizeObserver | undefined, mutationObserver: MutationObserver | undefined

    const update = () => {
      frame = 0
      const nav = navRef.current
      if (!nav || !elements.length || !desktop.matches) return
      const threshold = Math.max(120, Math.min(280, innerHeight * 0.3))
      const tops = elements.map((element) => element.getBoundingClientRect().top)
      let index = 0
      tops.forEach((top, i) => {
        if (top <= threshold) index = i
      })
      if (index !== activeIndex) {
        activeIndex = index
        setActive(index)
      }
      const between =
        index < tops.length - 1
          ? Math.max(0, Math.min(1, (threshold - tops[index]) / Math.max(1, tops[index + 1] - tops[index])))
          : 0
      nav.style.setProperty('--section-progress', String((index + between) / Math.max(1, tops.length - 1)))
      const height = nav.getBoundingClientRect().height
      const top = Math.min(Math.max(112, (innerHeight - height) / 2), root.getBoundingClientRect().bottom - height - 24)
      nav.style.top = `${top}px`
      const hidden = top + height < 112
      nav.style.visibility = hidden ? 'hidden' : 'visible'
      nav.setAttribute('aria-hidden', String(hidden))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const collect = () => {
      elements = Array.from(root.querySelectorAll<HTMLElement>('[data-section-nav]')).filter(
        (element) => element.id && element.getClientRects().length
      )
      const next = elements.map((element) => ({
        id: element.id,
        key: element.dataset.sectionNav || '',
        label: element.dataset.sectionLabel || '',
      }))
      const key = JSON.stringify(next)
      if (signature !== key) {
        signature = key
        activeIndex = -1
        setStops(next)
      }
      schedule()
    }
    const disconnect = () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      frame = 0
    }
    const setup = () => {
      disconnect()
      if (!desktop.matches) {
        signature = ''
        setStops([])
        return
      }
      collect()
      resizeObserver = new ResizeObserver(schedule)
      resizeObserver.observe(root)
      mutationObserver = new MutationObserver(collect)
      mutationObserver.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-section-label'],
      })
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule)
    }
    setup()
    desktop.addEventListener('change', setup)
    return () => {
      disconnect()
      desktop.removeEventListener('change', setup)
    }
  }, [])

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    })
    history.replaceState(history.state, '', `#${id}`)
    if (event.detail === 0) {
      const heading = target.querySelector<HTMLElement>('h1, h2')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    }
  }

  if (stops.length < 2) return null
  const next = stops[active + 1] || stops[0]
  return (
    <nav
      ref={navRef}
      className={styles.rail}
      aria-label={th ? 'สำรวจส่วนต่าง ๆ ในหน้านี้' : 'Explore this page'}
      data-discovery-section-nav
    >
      <p className={styles.caption}>{th ? 'ในหน้านี้' : 'On this page'}</p>
      <ol className={styles.stops}>
        {stops.map((stop, index) => (
          <li key={stop.id}>
            <a
              href={`#${stop.id}`}
              onClick={(event) => jump(event, stop.id)}
              aria-current={active === index ? 'location' : undefined}
              aria-label={stop.label}
              title={stop.label}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.label} aria-hidden="true">
                {wideNames[stop.key]?.[th ? 0 : 1] || stop.label}
              </span>
              <span className={styles.shortLabel} aria-hidden="true">
                {shortNames[stop.key]?.[th ? 0 : 1] || stop.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <a
        className={styles.next}
        href={`#${next.id}`}
        onClick={(event) => jump(event, next.id)}
        aria-label={
          active === stops.length - 1
            ? th
              ? 'กลับไปเริ่มค้นหา'
              : 'Back to search'
            : `${th ? 'ดูต่อ:' : 'Next:'} ${next.label}`
        }
      >
        {active === stops.length - 1 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
        <span>{active === stops.length - 1 ? (th ? 'ด้านบน' : 'Top') : th ? 'ดูต่อ' : 'Next'}</span>
      </a>
    </nav>
  )
}
