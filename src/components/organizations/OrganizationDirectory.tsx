'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { organizationSpecialties, organizationTypeLabel, organizationTypes } from '@/lib/organizationTaxonomy'
import { listOrganizations, type Organization } from '@/lib/organizations'
import { BadgeCheck, Building2, Search } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OrganizationDirectory() {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationType, setOrganizationType] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    listOrganizations({ organizationType, specialty })
      .then((items) => {
        if (!cancelled) setOrganizations(items)
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Cannot load organizations')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organizationType, specialty])

  return (
    <main className="py-10 sm:py-14 lg:py-16">
      <div className="rounded-[30px] bg-[#eef6f2] px-5 py-8 sm:px-8 sm:py-10 dark:bg-[#17372d]">
        <p className="font-sarabun text-sm font-semibold text-[#176b50] dark:text-emerald-300">
          MapxProp Organizations
        </p>
        <h1 className="mt-2 max-w-3xl font-sarabun text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl dark:text-white">
          {isThai ? 'ค้นหาอสังหาฯ จากองค์กรที่ตรงกับความต้องการ' : 'Find property from the right organization'}
        </h1>
        <p className="mt-3 max-w-2xl font-sarabun text-sm leading-6 text-neutral-600 sm:text-base dark:text-neutral-300">
          {isThai
            ? 'เลือกตามประเภทองค์กร หรือความเชี่ยวชาญ เช่น ทรัพย์ NPA คอนโดให้เช่า ที่ดิน และทรัพย์ติดทะเล'
            : 'Browse by organization type or specialties such as NPA, condo rentals, land, and beachfront property.'}
        </p>
      </div>

      <section className="mt-7 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="font-sarabun text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <span className="mb-1.5 block">{isThai ? 'ประเภทองค์กร' : 'Organization type'}</span>
          <select
            value={organizationType}
            onChange={(event) => {
              setLoading(true)
              setError('')
              setOrganizationType(event.target.value)
            }}
            className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 outline-none focus:border-[#176b50] dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="">{isThai ? 'ทุกประเภท' : 'All types'}</option>
            {organizationTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {isThai ? type.nameTh : type.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="font-sarabun text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <span className="mb-1.5 block">{isThai ? 'ความเชี่ยวชาญ' : 'Specialty'}</span>
          <select
            value={specialty}
            onChange={(event) => {
              setLoading(true)
              setError('')
              setSpecialty(event.target.value)
            }}
            className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 outline-none focus:border-[#176b50] dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="">{isThai ? 'ทั้งหมด' : 'All specialties'}</option>
            {organizationSpecialties.map((item) => (
              <option key={item.code} value={item.code}>
                {isThai ? item.nameTh : item.nameEn}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? <div className="mt-8 h-48 animate-pulse rounded-3xl bg-neutral-100 dark:bg-neutral-800" /> : null}
      {error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p> : null}
      {!loading && !error && organizations.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <Search className="mx-auto size-8 text-neutral-400" />
          <p className="mt-3 font-sarabun text-neutral-600 dark:text-neutral-300">
            {isThai ? 'ยังไม่พบองค์กรในกลุ่มนี้' : 'No organizations found in this group.'}
          </p>
        </div>
      ) : null}

      {!loading && organizations.length > 0 ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => (
            <Link
              key={organization.public_organization_id}
              href={`/organizations/${organization.slug}`}
              className="group rounded-3xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9bc7b5] hover:shadow-[0_16px_40px_rgba(18,63,50,0.10)] dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#edf5f1] text-[#176b50] dark:bg-emerald-950/40 dark:text-emerald-300">
                  {organization.logo_url ? (
                    <img src={organization.logo_url} alt="" className="size-full object-contain" />
                  ) : (
                    <Building2 className="size-6" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-sarabun text-lg font-semibold text-neutral-950 dark:text-white">
                    <span className="truncate">{organization.display_name}</span>
                    {organization.verification_status === 'verified' ? (
                      <BadgeCheck className="size-5 shrink-0 text-blue-600" />
                    ) : null}
                  </span>
                  <span className="mt-1 block font-sarabun text-sm text-neutral-500">
                    {organizationTypeLabel(organization.organization_type, isThai)}
                  </span>
                </span>
              </div>
              {organization.specialty_codes?.length ? (
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {organization.specialty_codes.slice(0, 5).map((code) => (
                    <span
                      key={code}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 font-sarabun text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {organizationSpecialties.find((item) => item.code === code)?.[isThai ? 'nameTh' : 'nameEn'] ||
                        code}
                    </span>
                  ))}
                </span>
              ) : null}
              <span className="mt-5 block border-t border-neutral-100 pt-4 font-sarabun text-sm font-semibold text-[#176b50] dark:border-neutral-800 dark:text-emerald-300">
                {organization.listing_count.toLocaleString()} {isThai ? 'ประกาศที่กำลังเผยแพร่' : 'active listings'}
              </span>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  )
}
