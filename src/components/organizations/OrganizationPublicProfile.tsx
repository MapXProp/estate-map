'use client'

import ListingImageFallback from '@/components/ListingImageFallback'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyType } from '@/data/propertyTaxonomy'
import { getListingMediaUrl } from '@/lib/myListings'
import { organizationSpecialtyLabel, organizationTypeLabel } from '@/lib/organizationTaxonomy'
import {
  getOrganization,
  getOrganizationListings,
  type Organization,
  type OrganizationContact,
  type OrganizationListing,
} from '@/lib/organizations'
import { BadgeCheck, Building2, ExternalLink, Globe2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OrganizationPublicProfile({
  identifier,
  initialData,
}: {
  identifier: string
  initialData?: { organization: Organization; contacts: OrganizationContact[]; listings: OrganizationListing[] }
}) {
  const { locale, formatCurrencyFrom } = usePreferences()
  const isThai = locale === 'th'
  const [organization, setOrganization] = useState<Organization | null>(initialData?.organization || null)
  const [contacts, setContacts] = useState<OrganizationContact[]>(initialData?.contacts || [])
  const [listings, setListings] = useState<OrganizationListing[]>(initialData?.listings || [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) return
    let cancelled = false
    Promise.all([getOrganization(identifier), getOrganizationListings(identifier)])
      .then(([detail, organizationListings]) => {
        if (cancelled) return
        setOrganization(detail.organization)
        setContacts(detail.contacts || [])
        setListings(organizationListings)
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Cannot load organization')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [identifier, initialData])

  if (loading) return <div className="my-12 h-80 animate-pulse rounded-[32px] bg-neutral-100 dark:bg-neutral-800" />
  if (error || !organization) {
    return (
      <div className="my-12 rounded-3xl border border-neutral-200 p-10 text-center dark:border-neutral-800">
        <Building2 className="mx-auto size-10 text-neutral-400" />
        <h1 className="mt-3 font-sarabun text-xl font-semibold">
          {isThai ? 'ไม่พบข้อมูลองค์กร' : 'Organization not found'}
        </h1>
        <Link href="/organizations" className="mt-4 inline-flex font-sarabun font-semibold text-[#176b50]">
          {isThai ? 'ดูองค์กรทั้งหมด' : 'Browse organizations'}
        </Link>
      </div>
    )
  }

  return (
    <main
      data-analytics-surface="organization"
      data-analytics-organization-id={organization.public_organization_id}
      className="py-9 sm:py-12 lg:py-14"
    >
      <nav className="mb-5 font-sarabun text-sm text-neutral-500">
        <Link href="/organizations" className="hover:text-[#176b50]">
          {isThai ? 'องค์กร' : 'Organizations'}
        </Link>{' '}
        / <span className="text-neutral-700 dark:text-neutral-300">{organization.display_name}</span>
      </nav>

      <section className="overflow-hidden rounded-[32px] border border-[#dce9e4] bg-gradient-to-br from-[#eef6f2] to-white p-5 sm:p-8 dark:border-[#315f50] dark:from-[#17372d] dark:to-neutral-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-3xl border border-white/80 bg-white text-[#176b50] shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt="" className="size-full object-contain p-2" />
            ) : (
              <Building2 className="size-9" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-sarabun text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
                {organization.display_name}
              </h1>
              {organization.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-sarabun text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  <BadgeCheck className="size-4" /> {isThai ? 'องค์กรตรวจสอบแล้ว' : 'Verified organization'}
                </span>
              ) : null}
            </div>
            <p className="mt-2 font-sarabun text-sm font-medium text-[#176b50] dark:text-emerald-300">
              {organizationTypeLabel(organization.organization_type, isThai)}
            </p>
            {organization.legal_name ? (
              <p className="mt-1 font-sarabun text-sm text-neutral-500 dark:text-neutral-400">
                {organization.legal_name}
              </p>
            ) : null}
            {organization.description ? (
              <p className="mt-4 max-w-3xl font-sarabun text-sm leading-7 whitespace-pre-line text-neutral-700 sm:text-base dark:text-neutral-200">
                {organization.description}
              </p>
            ) : null}
            {organization.specialty_codes?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {organization.specialty_codes.map((code) => (
                  <span
                    key={code}
                    className="rounded-full border border-[#cfe3da] bg-white/80 px-3 py-1.5 font-sarabun text-sm font-medium text-[#176b50] dark:border-[#315f50] dark:bg-neutral-900/80 dark:text-emerald-300"
                  >
                    {organizationSpecialtyLabel(code, isThai)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl bg-white/85 px-5 py-4 text-center shadow-sm dark:bg-neutral-900/85">
            <p className="font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
              {organization.listing_count.toLocaleString(isThai ? 'th-TH' : 'en-US')}
            </p>
            <p className="font-sarabun text-xs text-neutral-500">
              {isThai ? 'ประกาศที่กำลังเผยแพร่' : 'Active listings'}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section>
          <h2 className="font-sarabun text-2xl font-semibold text-neutral-950 dark:text-white">
            {isThai ? `ประกาศจาก ${organization.display_name}` : `Listings from ${organization.display_name}`}
          </h2>
          {listings.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <OrganizationListingCard
                  key={listing.public_listing_id}
                  listing={listing}
                  isThai={isThai}
                  formatAmount={formatCurrencyFrom}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-3xl border border-dashed border-neutral-300 p-8 text-center font-sarabun text-sm text-neutral-500 dark:border-neutral-700">
              {isThai ? 'องค์กรนี้ยังไม่มีประกาศที่กำลังเผยแพร่' : 'This organization has no active listings yet.'}
            </p>
          )}
        </section>

        <aside>
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-24 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-sarabun text-lg font-semibold">
              {isThai ? 'ช่องทางขององค์กร' : 'Organization contacts'}
            </h2>
            <div className="mt-4 grid gap-2">
              {contacts.map((contact) => {
                const link = contactLink(contact)
                const Icon = contactIcon(contact.channel_type)
                return link ? (
                  <a
                    key={`${contact.channel_type}-${contact.channel_value}`}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-3 py-3 transition hover:border-[#9bc7b5] hover:bg-[#f4f9f7] dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-sarabun text-sm font-semibold">{contact.channel_value}</span>
                      {contact.label ? (
                        <span className="block font-sarabun text-xs text-neutral-500">{contact.label}</span>
                      ) : null}
                    </span>
                    {link.external ? <ExternalLink className="size-4 text-neutral-400" /> : null}
                  </a>
                ) : null
              })}
              {organization.website_url && !contacts.some((contact) => contact.channel_type === 'website') ? (
                <a
                  href={organization.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-3 py-3 transition hover:border-[#9bc7b5] hover:bg-[#f4f9f7] dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Globe2 className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sarabun text-sm font-semibold">
                    {isThai ? 'เว็บไซต์องค์กร' : 'Organization website'}
                  </span>
                  <ExternalLink className="size-4 text-neutral-400" />
                </a>
              ) : null}
              {!contacts.length && !organization.website_url ? (
                <p className="font-sarabun text-sm text-neutral-500">
                  {isThai ? 'ยังไม่มีช่องทางติดต่อสาธารณะ' : 'No public contact details yet.'}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function OrganizationListingCard({
  listing,
  isThai,
  formatAmount,
}: {
  listing: OrganizationListing
  isThai: boolean
  formatAmount: (amount: number, sourceCurrency?: string) => string
}) {
  const propertyType = getPropertyType(listing.property_type_code)
  const propertyLabel = isThai
    ? propertyType?.nameTh || listing.property_type_code
    : propertyType?.nameEn || listing.property_type_code
  const imageURL = getListingMediaUrl(listing.primary_image_url)
  const title = isThai ? listing.title : listing.title_en || listing.title
  const address = isThai ? listing.address : listing.address_en || listing.address
  const district = isThai ? listing.district : listing.district_en || listing.district
  const province = isThai ? listing.province : listing.province_en || listing.province
  const location = [district, province].filter(Boolean).join(', ') || address
  return (
    <Link
      href={`/real-estate-listings/${encodeURIComponent(listing.slug || listing.public_listing_id)}`}
      className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {imageURL ? (
          <img
            src={imageURL}
            alt=""
            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <ListingImageFallback className="size-full" />
        )}
      </div>
      <div className="p-4">
        <p className="font-sarabun text-xs font-semibold text-[#176b50] dark:text-emerald-300">{propertyLabel}</p>
        <h3 className="mt-1 line-clamp-2 font-sarabun text-lg font-semibold text-neutral-950 dark:text-white">
          {title}
        </h3>
        {location ? (
          <p className="mt-2 flex items-start gap-1.5 font-sarabun text-sm text-neutral-500">
            <MapPin className="mt-0.5 size-4 shrink-0" /> <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        <p className="mt-3 font-sarabun text-base font-semibold text-neutral-950 dark:text-white">
          {formatListingPrice(listing, isThai, formatAmount)}
        </p>
      </div>
    </Link>
  )
}

function formatListingPrice(
  listing: OrganizationListing,
  isThai: boolean,
  formatAmount: (amount: number, sourceCurrency?: string) => string
) {
  if (listing.offer_amount === undefined) return isThai ? 'สอบถามราคา' : 'Price on request'
  const amount = formatAmount(listing.offer_amount, listing.currency)
  const unit = listing.price_unit === 'month' ? (isThai ? '/เดือน' : '/month') : ''
  return `${amount}${unit}`
}

function contactIcon(channel: OrganizationContact['channel_type']) {
  if (channel === 'phone') return Phone
  if (channel === 'email') return Mail
  if (channel === 'line') return MessageCircle
  return Globe2
}

function contactLink(contact: OrganizationContact) {
  if (contact.channel_type === 'phone')
    return { href: `tel:${contact.channel_value.replace(/[^+\d]/g, '')}`, external: false }
  if (contact.channel_type === 'email') return { href: `mailto:${contact.channel_value}`, external: false }
  if (contact.channel_type === 'line') {
    const handle = contact.channel_value.replace(/^@/, '')
    return { href: `https://line.me/R/ti/p/%40${encodeURIComponent(handle)}`, external: true }
  }
  if (contact.channel_type === 'website') return { href: contact.channel_value, external: true }
  return null
}
