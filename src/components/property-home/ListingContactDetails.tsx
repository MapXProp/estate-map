'use client'

import { getPropertyPreviewContactRole, getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { Building2, ChevronDown, Globe, Instagram, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const icons = { phone: Phone, line: MessageCircle, email: Mail, instagram: Instagram, website: Globe }
const englishLabels = { phone: 'Call', line: 'LINE', email: 'Email', instagram: 'Instagram', website: 'Website' }
type Contact = ReturnType<typeof getPropertyPreviewContacts>[number]

function ContactLink({
  contact,
  isThai,
  secondary = false,
}: {
  contact: Contact
  isThai: boolean
  secondary?: boolean
}) {
  const Icon = icons[contact.kind]
  const external = contact.href.startsWith('http')
  const label = secondary
    ? isThai
      ? 'โทรเบอร์สำรอง'
      : 'Alternate phone'
    : isThai
      ? contact.label
      : englishLabels[contact.kind]
  const digits = contact.value.replace(/\D/g, '')
  const value =
    contact.kind === 'phone' && digits.length === 10
      ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
      : contact.value
  return (
    <a
      href={contact.href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      data-contact-channel={contact.kind}
      className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <Icon className="size-[18px] shrink-0 text-[#176b50] dark:text-emerald-300" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="block text-sm font-medium [overflow-wrap:anywhere]">{value}</span>
      </span>
    </a>
  )
}

export function ListingContactChannels({
  listing,
  isThai,
  revealOnRequest = true,
}: {
  listing: Parameters<typeof getPropertyPreviewContacts>[0]
  isThai: boolean
  revealOnRequest?: boolean
}) {
  const contacts = getPropertyPreviewContacts(listing)
  const phones = contacts.filter((contact) => contact.kind === 'phone')
  return (
    <div data-listing-contact-channels className="grid gap-2.5">
      {contacts.map((contact) => {
        if (revealOnRequest && (contact.kind === 'phone' || contact.kind === 'email')) {
          if (contact.kind === 'phone' && contact !== phones[0]) return null
          const isPhone = contact.kind === 'phone'
          const Icon = icons[contact.kind]
          return (
            <details key={contact.href} data-contact-disclosure={contact.kind} className="group/contact">
              <summary
                className={`flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176b50] [&::-webkit-details-marker]:hidden ${isPhone ? 'border-[#176b50] bg-[#176b50] text-white hover:bg-[#145d46]' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                <span className="flex-1 group-open/contact:hidden">
                  {isPhone ? (isThai ? 'ดูเบอร์โทร' : 'Show phone numbers') : isThai ? 'ดูอีเมล' : 'Show email'}
                </span>
                <span className="hidden flex-1 group-open/contact:block">
                  {isPhone ? (isThai ? 'เบอร์โทรศัพท์' : 'Phone numbers') : isThai ? 'อีเมล' : 'Email'}
                </span>
                <ChevronDown
                  className="size-4 shrink-0 transition-transform group-open/contact:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="mt-2 grid gap-2">
                {(isPhone ? phones : [contact]).map((item, index) => (
                  <ContactLink key={item.href} contact={item} isThai={isThai} secondary={isPhone && index > 0} />
                ))}
              </div>
            </details>
          )
        }
        return (
          <ContactLink
            key={contact.href}
            contact={contact}
            isThai={isThai}
            secondary={contact.kind === 'phone' && contact !== phones[0]}
          />
        )
      })}
      {!contacts.length && (
        <p className="text-sm leading-6 text-neutral-500">
          {isThai ? 'ยังไม่มีช่องทางติดต่อในประกาศนี้' : 'No contact details provided for this listing.'}
        </p>
      )}
    </div>
  )
}

export default function ListingContactDetails({
  listing,
  isThai,
}: {
  listing: PropertyListingDetail
  isThai: boolean
}) {
  const organization = listing.organization_name || listing.contact_organization_name
  const name = listing.contact_name || organization || (isThai ? 'ผู้ลงประกาศ' : 'Advertiser')
  const reference = listing.category_details?.official_page_reference_code || listing.category_details?.reference_code
  const verifiedContact =
    listing.contact_verification_status === 'authority_verified'
      ? isThai
        ? 'ตรวจสอบตัวตนและสิทธิแล้ว'
        : 'Identity and authority verified'
      : listing.contact_verification_status === 'identity_verified'
        ? isThai
          ? 'ยืนยันตัวตนแล้ว'
          : 'Identity verified'
        : ''
  return (
    <section className="font-sarabun">
      <h2 className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {isThai ? 'ติดต่อและนัดชม' : 'Contact and viewings'}
      </h2>
      <p className="mt-2 font-semibold [overflow-wrap:anywhere] text-neutral-950 dark:text-white">{name}</p>
      {listing.contact_role_code && (
        <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {getPropertyPreviewContactRole(listing.contact_role_code, isThai)}
        </p>
      )}
      {organization &&
        (listing.organization_public_id ? (
          <Link
            href={`/organizations/${encodeURIComponent(listing.organization_public_id)}`}
            className="mt-1 flex items-start gap-1.5 text-sm text-[#176b50] hover:underline dark:text-emerald-300"
          >
            <Building2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {organization === name ? (isThai ? 'ดูข้อมูลองค์กร' : 'View organization') : organization}
          </Link>
        ) : organization !== name ? (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{organization}</p>
        ) : null)}
      {listing.organization_verification_status === 'verified' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-[#176b50] dark:text-emerald-300">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          {isThai ? 'องค์กรตรวจสอบแล้ว' : 'Verified organization'}
        </p>
      )}
      {verifiedContact && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{verifiedContact}</p>}
      {typeof reference === 'string' && reference && (
        <p className="mt-2 text-xs text-neutral-500">
          {isThai ? 'รหัสทรัพย์' : 'Property reference'} <span className="font-medium">{reference}</span>
        </p>
      )}
      <div className="mt-4">
        <ListingContactChannels key={listing.public_listing_id} listing={listing} isThai={isThai} />
      </div>
    </section>
  )
}
