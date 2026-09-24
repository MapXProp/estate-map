'use client'

import { contactSheetSnap } from '@/lib/contactSheetGesture'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ContactRound,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ListingContactSheetContext } from './ListingContactSheetContext'
import styles from './MobileListingContactSheet.module.css'

interface Props {
  analyticsListingId?: string
  analyticsPropertyType?: string
  contactName: string
  roleLabel: string
  authorityLabel?: string
  organizationName?: string
  organizationPublicId?: string
  verificationStatus: 'unverified' | 'identity_verified' | 'authority_verified' | ''
  trusted?: boolean
  phone?: string
  secondaryPhone?: string
  email?: string
  lineId?: string
  instagramHandle?: string
  websiteUrl?: string
  triggerLabel?: string
  showOnTablet?: boolean
  isThai?: boolean
  onOpenChange?: (open: boolean) => void
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('02'))
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

export default function MobileListingContactSheet(props: Props) {
  const dock = useContext(ListingContactSheetContext)
  const [localOpen, setLocalOpen] = useState(false)
  const open = dock?.open ?? localOpen
  const isThai = props.isThai ?? true
  const setOpen = (value: boolean) => {
    if (dock) dock.setOpen(value)
    else setLocalOpen(value)
    props.onOpenChange?.(value)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={isThai ? 'ติดต่อผู้ลงประกาศ' : 'Contact advertiser'}
        className={props.triggerLabel ? styles.trigger : styles.iconTrigger}
      >
        <ContactRound size={19} aria-hidden="true" />
        {props.triggerLabel && <span>{props.triggerLabel}</span>}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className={`relative z-[100] ${props.showOnTablet ? '' : 'min-[744px]:hidden'}`}
        data-analytics-surface="mobile_contact_sheet"
        data-analytics-listing-id={props.analyticsListingId}
        data-analytics-property-type={props.analyticsPropertyType}
      >
        <ContactPanel {...props} isThai={isThai} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  )
}

function ContactPanel({ isThai = true, onClose, ...props }: Props & { onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [delta, setDelta] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(460)
  const [bounds, setBounds] = useState({ compact: 460, full: 720 })
  const panelRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    startY: number
    lastY: number
    lastTime: number
    velocity: number
    height: number
    moved: boolean
  } | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => {
    const measure = () => {
      const viewport = window.visualViewport?.height || window.innerHeight
      setBounds({ compact: Math.min(460, viewport * 0.74), full: Math.min(800, viewport - 24) })
    }
    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [])

  const start = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    if (
      event.target !== event.currentTarget &&
      (event.target as HTMLElement).closest('a,button,input,summary') !== event.currentTarget &&
      (event.target as HTMLElement).closest('a,button,input,summary')
    )
      return
    suppressClick.current = false
    const y = event.clientY
    const currentHeight = panelRef.current?.getBoundingClientRect().height || bounds.compact
    setDragStartHeight(currentHeight)
    gesture.current = {
      startY: y,
      lastY: y,
      lastTime: performance.now(),
      velocity: 0,
      height: currentHeight,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) return
    const state = gesture.current
    if (!state) return
    const next = event.clientY - state.startY
    if (Math.abs(next) < 5 && !state.moved) return
    const now = performance.now()
    state.velocity = (event.clientY - state.lastY) / Math.max(1, now - state.lastTime)
    state.lastY = event.clientY
    state.lastTime = now
    state.moved = true
    setDragging(true)
    setDelta(next)
  }
  const end = (event: ReactPointerEvent<HTMLElement>, cancelled = false) => {
    if (!event.isPrimary) return
    const state = gesture.current
    if (!state) return
    gesture.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    suppressClick.current = state.moved
    setDragging(false)
    if (cancelled || !state.moved) {
      setDelta(0)
      return
    }
    const snap = contactSheetSnap({
      startHeight: state.height,
      compactHeight: bounds.compact,
      expandedHeight: bounds.full,
      delta: event.clientY - state.startY,
      velocity: performance.now() - state.lastTime < 100 ? state.velocity : 0,
    })
    if (snap === 'closed') {
      setDelta(Math.max(0, event.clientY - state.startY - (state.height - bounds.compact)))
      setExpanded(false)
      onClose()
      return
    }
    setExpanded(snap === 'expanded')
    setDelta(0)
  }
  const dragHandlers = {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => end(e),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => end(e, true),
  }
  const startHeight = dragging ? dragStartHeight : expanded ? bounds.full : bounds.compact
  const height = dragging ? Math.max(bounds.compact, Math.min(bounds.full, startHeight - delta)) : startHeight
  const offset = dragging ? Math.max(0, delta - (startHeight - bounds.compact)) : Math.max(0, delta)
  const icons = { phone: Phone, line: MessageCircle, email: Mail, instagram: Instagram, website: Globe }
  const labels = { phone: 'Phone', line: 'LINE', email: 'Email', instagram: 'Instagram', website: 'Website' }
  const contacts = getPropertyPreviewContacts({
    contact_phone: props.phone || '',
    contact_phone_secondary: props.secondaryPhone || '',
    contact_email: props.email || '',
    line_id: props.lineId || '',
    instagram_handle: props.instagramHandle || '',
    organization_website_url: props.websiteUrl,
  }).map((item) => ({
    ...item,
    icon: icons[item.kind],
    label: isThai ? item.label : labels[item.kind],
    value: item.kind === 'phone' ? formatPhone(item.value) : item.value,
  }))
  const primaryPhone = contacts.find((item) => item.kind === 'phone')
  const primary = contacts.filter((item) => item === primaryPhone || item.kind === 'line')
  const others = contacts.filter((item) => !primary.includes(item))
  const authorityVerified = props.verificationStatus === 'authority_verified'
  const identityVerified = props.verificationStatus === 'identity_verified'
  const VerificationIcon = authorityVerified ? ShieldCheck : identityVerified ? CheckCircle2 : ShieldQuestion
  const verificationTitle = authorityVerified
    ? isThai
      ? 'ตรวจสอบตัวตนและสิทธิแล้ว'
      : 'Identity and authority verified'
    : identityVerified
      ? isThai
        ? 'ยืนยันตัวตนแล้ว'
        : 'Identity verified'
      : isThai
        ? 'ยังไม่ได้รับการตรวจสอบ'
        : 'Not yet verified'

  return (
    <>
      <DialogBackdrop
        transition
        className={styles.backdrop}
        style={{ opacity: Math.max(0.1, 1 - offset / bounds.compact) }}
      />
      <div className={styles.position}>
        <DialogPanel
          ref={panelRef}
          transition
          className={styles.panel}
          data-dragging={dragging || undefined}
          data-snap={expanded ? 'expanded' : 'compact'}
          style={{ height, '--sheet-offset': `${offset}px` } as CSSProperties}
        >
          <div className={styles.header}>
            <button
              type="button"
              {...dragHandlers}
              data-contact-drag-handle
              className={styles.grip}
              aria-label={
                isThai
                  ? expanded
                    ? 'ย่อแผงติดต่อ'
                    : 'ขยายแผงติดต่อ'
                  : expanded
                    ? 'Collapse contact panel'
                    : 'Expand contact panel'
              }
              aria-expanded={expanded}
              onClick={() => {
                if (!suppressClick.current) setExpanded(!expanded)
                suppressClick.current = false
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  setExpanded(event.key === 'ArrowUp')
                }
              }}
            >
              <span aria-hidden="true" />
            </button>
            <div className={styles.headingRow}>
              <DialogTitle className={styles.title}>{isThai ? 'คุยกับผู้ลงประกาศ' : 'Contact advertiser'}</DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label={isThai ? 'ปิดข้อมูลผู้ติดต่อ' : 'Close contact details'}
                className={styles.close}
                data-autofocus
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={styles.content}>
            <section aria-label={isThai ? 'ข้อมูลผู้ลงประกาศ' : 'Advertiser details'}>
              <div className={styles.identity} {...dragHandlers}>
                <span className={styles.avatar} aria-hidden="true">
                  {props.organizationName ? <Building2 size={24} /> : <ContactRound size={24} />}
                </span>
                <div className={styles.identityText}>
                  <h2>{props.contactName || props.organizationName || (isThai ? 'ผู้ลงประกาศ' : 'Advertiser')}</h2>
                  <p>{props.roleLabel || (isThai ? 'ติดต่อสอบถามข้อมูลทรัพย์' : 'Ask about this property')}</p>
                </div>
              </div>
              <div className={styles.verification} data-verified={authorityVerified || identityVerified}>
                <VerificationIcon size={15} aria-hidden="true" />
                <span>{verificationTitle}</span>
              </div>
            </section>
            <section aria-label={isThai ? 'ช่องทางติดต่อ' : 'Contact channels'} className={styles.channels}>
              {primary.length > 0 && (
                <div className={styles.primary} data-count={primary.length}>
                  {primary.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      data-contact-channel={item.kind}
                      className={item.kind === 'phone' ? styles.call : styles.line}
                    >
                      <span className={styles.actionLabel}>
                        <item.icon size={21} aria-hidden="true" />
                        {item.kind === 'phone'
                          ? isThai
                            ? 'โทรสอบถาม'
                            : 'Call'
                          : isThai
                            ? 'คุยทาง LINE'
                            : 'Chat on LINE'}
                      </span>
                      <span className={styles.actionValue}>{item.value}</span>
                    </a>
                  ))}
                </div>
              )}
              {contacts.length === 0 && (
                <p className={styles.empty}>
                  {isThai ? 'ยังไม่มีช่องทางติดต่อเพิ่มเติม' : 'No contact channels provided.'}
                </p>
              )}
              {(expanded || primary.length === 0) && others.length > 0 && (
                <div className={styles.otherContacts}>
                  {others.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      data-contact-channel={item.kind}
                    >
                      <item.icon size={19} aria-hidden="true" />
                      <span>
                        <small>
                          {item.kind === 'phone' ? (isThai ? 'โทรเบอร์สำรอง' : 'Alternate phone') : item.label}
                        </small>
                        <strong>{item.value}</strong>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </section>
            <button
              type="button"
              className={styles.more}
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <span>
                {expanded
                  ? isThai
                    ? 'แสดงแบบกระชับ'
                    : 'Show less'
                  : isThai
                    ? 'ช่องทางและข้อมูลเพิ่มเติม'
                    : 'More contacts and details'}
              </span>
              <ChevronDown size={17} className={expanded ? '' : styles.up} aria-hidden="true" />
            </button>
            {expanded && (
              <section className={styles.details} aria-label={isThai ? 'ข้อมูลเพิ่มเติม' : 'More details'}>
                {props.organizationName &&
                  (props.organizationPublicId ? (
                    <Link
                      href={`/organizations/${encodeURIComponent(props.organizationPublicId)}`}
                      className={styles.organization}
                    >
                      <Building2 size={18} aria-hidden="true" />
                      <span>
                        {props.organizationName}
                        <small>{isThai ? 'ดูข้อมูลองค์กรและประกาศอื่น' : 'Organization and other listings'}</small>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  ) : (
                    <p>{props.organizationName}</p>
                  ))}
                {props.authorityLabel && (
                  <p>
                    <span>{isThai ? 'สิทธิลงประกาศจาก: ' : 'Authority from: '}</span>
                    {props.authorityLabel}
                  </p>
                )}
                {!authorityVerified && (
                  <p>
                    {identityVerified
                      ? isThai
                        ? 'ยืนยันตัวตนแล้ว แต่ยังไม่ได้ตรวจสอบสิทธิในการลงประกาศ'
                        : 'Identity checked; authority to list has not been verified.'
                      : isThai
                        ? 'บทบาทและสังกัดเป็นข้อมูลที่ผู้ลงประกาศระบุ'
                        : 'Role and affiliation are provided by the advertiser.'}
                  </p>
                )}
                <p className={styles.note}>
                  {isThai
                    ? 'ก่อนโอนเงินหรือทำสัญญา ควรตรวจสอบเอกสารสิทธิและอำนาจผู้ลงประกาศ'
                    : 'Check ownership documents and listing authority before paying or signing.'}
                </p>
              </section>
            )}
          </div>
        </DialogPanel>
      </div>
    </>
  )
}
