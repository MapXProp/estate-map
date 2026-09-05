'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  CheckCircle2,
  ChevronRight,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'

type VerificationStatus = 'unverified' | 'identity_verified' | 'authority_verified' | ''

interface MobileListingContactSheetProps {
  contactName: string
  roleLabel: string
  authorityLabel?: string
  organizationName?: string
  verificationStatus: VerificationStatus
  trusted?: boolean
  phone?: string
  secondaryPhone?: string
  email?: string
  lineId?: string
  instagramHandle?: string
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value
}

const MobileListingContactSheet = ({
  contactName,
  roleLabel,
  authorityLabel,
  organizationName,
  verificationStatus,
  trusted = false,
  phone,
  secondaryPhone,
  email,
  lineId,
  instagramHandle,
}: MobileListingContactSheetProps) => {
  const [open, setOpen] = useState(false)
  const lineHandle = lineId?.replace(/^@/, '') || ''
  const instagram = instagramHandle?.replace(/^@/, '') || ''
  const isAuthorityVerified = verificationStatus === 'authority_verified' || trusted
  const isIdentityVerified = verificationStatus === 'identity_verified'

  const verification = isAuthorityVerified
    ? {
        title: 'ตรวจสอบตัวตนและสิทธิแล้ว',
        description: 'ระบบตรวจสอบตัวตนและสิทธิในการลงประกาศแล้ว',
        icon: ShieldCheck,
        className: 'border-[#cfe5dc] bg-[#eff7f3] text-[#176b50]',
      }
    : isIdentityVerified
      ? {
          title: 'ยืนยันตัวตนแล้ว',
          description: 'ยืนยันตัวตนแล้ว แต่ยังไม่ได้ตรวจสอบสิทธิในการลงประกาศ',
          icon: CheckCircle2,
          className: 'border-amber-200 bg-amber-50 text-amber-700',
        }
      : {
          title: 'ยังไม่ได้รับการตรวจสอบ',
          description: 'บทบาทและความเกี่ยวข้องเป็นข้อมูลที่ผู้ลงประกาศระบุเอง',
          icon: ShieldQuestion,
          className: 'border-neutral-200 bg-neutral-50 text-neutral-600',
        }
  const VerificationIcon = verification.icon

  const contactLinks = [
    ...(phone
      ? [
          {
            label: 'โทรศัพท์',
            value: formatPhone(phone),
            href: `tel:${phone.replace(/[^+\d]/g, '')}`,
            icon: Phone,
          },
        ]
      : []),
    ...(secondaryPhone
      ? [
          {
            label: 'โทรศัพท์สำรอง',
            value: formatPhone(secondaryPhone),
            href: `tel:${secondaryPhone.replace(/[^+\d]/g, '')}`,
            icon: Phone,
          },
        ]
      : []),
    ...(lineHandle
      ? [
          {
            label: 'LINE',
            value: `@${lineHandle}`,
            href: `https://line.me/R/ti/p/%40${encodeURIComponent(lineHandle)}`,
            icon: MessageCircle,
            external: true,
          },
        ]
      : []),
    ...(email
      ? [
          {
            label: 'อีเมล',
            value: email,
            href: `mailto:${email}`,
            icon: Mail,
          },
        ]
      : []),
    ...(instagram
      ? [
          {
            label: 'Instagram',
            value: `@${instagram}`,
            href: `https://www.instagram.com/${encodeURIComponent(instagram)}`,
            icon: Instagram,
            external: true,
          },
        ]
      : []),
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="ข้อมูลผู้ติดต่อ"
        title="ข้อมูลผู้ติดต่อ"
        className="grid size-10 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition active:scale-95"
      >
        <UserRound className="size-[18px]" />
      </button>

      <Dialog open={open} onClose={setOpen} className="relative z-[100] min-[744px]:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-neutral-950/45 transition duration-200 ease-out data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-end justify-center">
          <DialogPanel
            transition
            className="relative flex max-h-[86dvh] min-h-[68dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.20)] transition duration-300 ease-out data-closed:translate-y-full"
          >
            <div className="shrink-0 px-4 pt-2.5">
              <div className="mx-auto h-1.5 w-11 rounded-full bg-neutral-200" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3 py-3">
                <div>
                  <DialogTitle className="text-lg font-semibold text-neutral-950">ข้อมูลผู้ลงประกาศ</DialogTitle>
                  <p className="mt-0.5 text-xs text-neutral-500">ตรวจสอบความเกี่ยวข้องก่อนตัดสินใจติดต่อ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="ปิดข้อมูลผู้ติดต่อ"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition active:scale-95"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <section className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7f3ee] text-[#176b50]">
                    <UserRound className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">ผู้ลงประกาศ</p>
                    <h2 className="mt-0.5 text-lg font-semibold text-neutral-950">{contactName || 'ไม่ระบุชื่อ'}</h2>
                    <p className="mt-1 text-sm font-medium text-[#176b50]">{roleLabel || 'ไม่ได้ระบุบทบาท'}</p>
                  </div>
                </div>

                <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-100 text-sm">
                  {authorityLabel && (
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3">
                      <dt className="text-neutral-500">สิทธิลงประกาศจาก</dt>
                      <dd className="font-medium text-neutral-800">{authorityLabel}</dd>
                    </div>
                  )}
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3">
                    <dt className="text-neutral-500">บริษัท / สังกัด</dt>
                    <dd className="font-medium text-neutral-800">{organizationName || 'ไม่ได้ระบุ'}</dd>
                  </div>
                </dl>
              </section>

              <section className={`mt-3 rounded-2xl border p-4 ${verification.className}`}>
                <div className="flex items-start gap-3">
                  <VerificationIcon className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <h2 className="font-semibold">{verification.title}</h2>
                    <p className="mt-1 text-xs leading-5 opacity-80">{verification.description}</p>
                  </div>
                </div>
              </section>

              <section className="mt-5">
                <h2 className="text-sm font-semibold text-neutral-950">ช่องทางติดต่อ</h2>
                {contactLinks.length > 0 ? (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    {contactLinks.map((item) => (
                      <a
                        key={`${item.label}-${item.value}`}
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                        className="flex min-h-14 items-center gap-3 border-b border-neutral-100 px-3.5 transition last:border-b-0 active:bg-neutral-50"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eff7f3] text-[#176b50]">
                          <item.icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-neutral-500">{item.label}</span>
                          <span className="block truncate text-sm font-semibold text-neutral-800">{item.value}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-neutral-300" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-500">
                    ยังไม่มีช่องทางติดต่อเพิ่มเติม
                  </p>
                )}
              </section>

              <p className="mt-4 text-xs leading-5 text-neutral-400">
                ควรตรวจสอบเอกสารสิทธิและอำนาจของผู้ลงประกาศก่อนชำระเงินหรือทำสัญญา
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default MobileListingContactSheet
