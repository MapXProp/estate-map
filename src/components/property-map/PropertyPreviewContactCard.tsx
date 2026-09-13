'use client'

import { listingAnalyticsAttributes } from '@/lib/contactAnalytics'
import { getPropertyPreviewContacts } from '@/lib/propertyPreviewDetails'
import type { PropertyListingDetail } from '@/lib/propertySearch'
import { Globe, Instagram, Mail, MessageCircle, Phone } from 'lucide-react'

const icons = { phone: Phone, line: MessageCircle, email: Mail, instagram: Instagram, website: Globe }
const englishLabels = { phone: 'Call', line: 'LINE', email: 'Email', instagram: 'Instagram', website: 'Website' }

export default function PropertyPreviewContactCard({
  listing,
  price,
  isThai,
}: {
  listing: PropertyListingDetail
  price: string
  isThai: boolean
}) {
  const contacts = getPropertyPreviewContacts(listing)
  const organization = listing.organization_name || listing.contact_organization_name
  const reference = listing.category_details?.official_page_reference_code || listing.category_details?.reference_code
  return (
    <div
      {...listingAnalyticsAttributes(listing, 'map_modal')}
      className="rounded-2xl border border-[#dbe8e2] bg-white p-5 shadow-[0_12px_32px_rgba(18,63,50,.09)] lg:sticky lg:top-5 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto dark:border-neutral-800 dark:bg-neutral-900"
    >
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{isThai ? 'ราคาประกาศ' : 'Listed price'}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-950 dark:text-white">{price}</p>
      <div className="my-5 h-px bg-neutral-200 dark:bg-neutral-800" />
      <h2 className="text-xs font-medium text-neutral-500">{isThai ? 'ติดต่อและนัดชม' : 'Contact and viewings'}</h2>
      {listing.contact_name && (
        <p className="mt-2 font-semibold text-neutral-950 dark:text-white">{listing.contact_name}</p>
      )}
      {organization && organization !== listing.contact_name && (
        <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{organization}</p>
      )}
      {typeof reference === 'string' && reference && (
        <p className="mt-2 text-xs text-neutral-500">
          {isThai ? 'รหัสทรัพย์' : 'Property reference'}{' '}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">{reference}</span>
        </p>
      )}
      <div className="mt-4 grid gap-2.5">
        {contacts.map((contact, index) => {
          const Icon = icons[contact.kind]
          const external = contact.href.startsWith('http')
          return (
            <a
              key={contact.href}
              href={contact.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 ${index === 0 && contact.kind === 'phone' ? 'border-[#123f32] bg-[#123f32] text-white hover:bg-[#176b50]' : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[11px] opacity-75">
                  {isThai ? contact.label : englishLabels[contact.kind]}
                </span>
                <span className="block text-sm font-medium [overflow-wrap:anywhere]">{contact.value}</span>
              </span>
            </a>
          )
        })}
        {!contacts.length && (
          <p className="text-sm leading-6 text-neutral-500">
            {isThai ? 'ยังไม่มีช่องทางติดต่อในประกาศนี้' : 'No contact details provided for this listing.'}
          </p>
        )}
      </div>
    </div>
  )
}
