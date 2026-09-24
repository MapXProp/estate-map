'use client'

import { useKeyboardFocus } from '@/hooks/useKeyboardFocus'
import { useSwipeDismiss } from '@/hooks/useMobileSheets'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  Building2,
  CheckCircle2,
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
import { useContext, useEffect, useState } from 'react'
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
  const keyboardFocus = useKeyboardFocus()
  const dock = useContext(ListingContactSheetContext)
  const [localOpen, setLocalOpen] = useState(false)
  const open = dock?.open ?? localOpen
  const isThai = props.isThai ?? true
  const updateOpen = dock?.setOpen ?? setLocalOpen
  const { showOnTablet, onOpenChange } = props
  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia(`(min-width: ${showOnTablet ? 1100 : 744}px)`)
    const closeOnDesktop = () => {
      if (!desktop.matches) return
      updateOpen(false)
      onOpenChange?.(false)
    }
    closeOnDesktop()
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [open, showOnTablet, updateOpen, onOpenChange])
  const setOpen = (value: boolean) => {
    updateOpen(value)
    onOpenChange?.(value)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-keyboard-focus={keyboardFocus || undefined}
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
  const { panelRef, backdropRef, dismiss } = useSwipeDismiss(onClose, true, props.showOnTablet ? 1099 : 743)
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
      <DialogBackdrop ref={backdropRef} transition className={styles.backdrop} />
      <div className={styles.position}>
        <DialogPanel ref={panelRef} transition className={styles.panel} data-contact-sheet>
          <div className={styles.header} data-sheet-drag-handle>
            <button
              type="button"
              data-sheet-drag-handle
              data-contact-drag-handle
              className={styles.grip}
              aria-label={isThai ? 'ปิดข้อมูลผู้ติดต่อ' : 'Close contact details'}
              onClick={dismiss}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  dismiss()
                }
              }}
            >
              <span aria-hidden="true" />
            </button>
            <div className={styles.headingRow}>
              <DialogTitle className={styles.title}>{isThai ? 'ข้อมูลผู้ลงประกาศ' : 'Advertiser details'}</DialogTitle>
              <button
                type="button"
                onClick={dismiss}
                aria-label={isThai ? 'ปิดข้อมูลผู้ติดต่อ' : 'Close contact details'}
                className={styles.close}
                data-autofocus
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={styles.content} data-sheet-scroll>
            <section className={styles.identityCard} aria-label={isThai ? 'ข้อมูลผู้ลงประกาศ' : 'Advertiser details'}>
              <div className={styles.identity}>
                <span className={styles.avatar} aria-hidden="true">
                  <ContactRound size={22} />
                </span>
                <div className={styles.identityText}>
                  <small>{isThai ? 'ผู้ลงประกาศ' : 'Advertiser'}</small>
                  <h2>{props.contactName || (isThai ? 'ไม่ระบุชื่อ' : 'Name not provided')}</h2>
                  <p>{props.roleLabel || (isThai ? 'ไม่ได้ระบุบทบาท' : 'Role not provided')}</p>
                </div>
              </div>
              <dl className={styles.facts}>
                {props.authorityLabel && (
                  <div>
                    <dt>{isThai ? 'สิทธิลงประกาศจาก' : 'Authority from'}</dt>
                    <dd>{props.authorityLabel}</dd>
                  </div>
                )}
                <div>
                  <dt>{isThai ? 'บริษัท / สังกัด' : 'Organization'}</dt>
                  <dd>
                    {props.organizationPublicId && props.organizationName ? (
                      <Link
                        href={`/organizations/${encodeURIComponent(props.organizationPublicId)}`}
                        className={styles.organization}
                      >
                        <Building2 size={16} aria-hidden="true" />
                        <span>{props.organizationName}</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    ) : (
                      props.organizationName || (isThai ? 'ไม่ได้ระบุ' : 'Not provided')
                    )}
                  </dd>
                </div>
              </dl>
            </section>
            <section className={styles.verification} data-status={props.verificationStatus}>
              <VerificationIcon size={20} aria-hidden="true" />
              <div>
                <h2>{verificationTitle}</h2>
                <p>
                  {authorityVerified
                    ? isThai
                      ? 'ระบบตรวจสอบตัวตนและสิทธิในการลงประกาศแล้ว'
                      : 'Identity and authority to list have been checked.'
                    : identityVerified
                      ? isThai
                        ? 'ยืนยันตัวตนแล้ว แต่ยังไม่ได้ตรวจสอบสิทธิในการลงประกาศ'
                        : 'Identity checked; authority to list has not been verified.'
                      : isThai
                        ? 'บทบาทและความเกี่ยวข้องเป็นข้อมูลที่ผู้ลงประกาศระบุเอง'
                        : 'Role and affiliation are provided by the advertiser.'}
                </p>
              </div>
            </section>
            <section aria-label={isThai ? 'ช่องทางติดต่อ' : 'Contact channels'} className={styles.channels}>
              <h2>{isThai ? 'ช่องทางติดต่อ' : 'Contact channels'}</h2>
              {contacts.length === 0 && (
                <p className={styles.empty}>
                  {isThai ? 'ยังไม่มีช่องทางติดต่อเพิ่มเติม' : 'No contact channels provided.'}
                </p>
              )}
              {contacts.length > 0 && (
                <div className={styles.contactList}>
                  {contacts.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      data-contact-channel={item.kind}
                    >
                      <span className={styles.channelIcon}>
                        <item.icon size={17} aria-hidden="true" />
                      </span>
                      <span>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </section>
            <p className={styles.note}>
              {isThai
                ? 'ก่อนโอนเงินหรือทำสัญญา ควรตรวจสอบเอกสารสิทธิและอำนาจผู้ลงประกาศ'
                : 'Check ownership documents and listing authority before paying or signing.'}
            </p>
          </div>
        </DialogPanel>
      </div>
    </>
  )
}
