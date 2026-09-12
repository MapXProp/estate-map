import OrganizationPublicProfile from '@/components/organizations/OrganizationPublicProfile'
import JsonLd from '@/components/seo/JsonLd'
import { getPublicOrganization } from '@/lib/publicOrganizations'
import { absoluteUrl, createPageMetadata } from '@/lib/seo'
import { notFound, permanentRedirect } from 'next/navigation'

type Props = { params: Promise<{ identifier: string }> }
export async function generateMetadata({ params }: Props) {
  const { identifier } = await params
  const detail = await getPublicOrganization(identifier)
  if (!detail) notFound()
  const organization = detail.organization
  return createPageMetadata({
    title: `${organization.display_name} — ข้อมูลและประกาศอสังหาริมทรัพย์`,
    description:
      organization.description ||
      `ดูข้อมูล ${organization.display_name} พร้อมประกาศอสังหาริมทรัพย์ ช่องทางติดต่อ และข้อมูลองค์กรบน MapxProp`,
    path: `/organizations/${encodeURIComponent(organization.slug || organization.public_organization_id)}`,
    images: organization.logo_url ? [organization.logo_url] : undefined,
  })
}
export default async function Page({ params }: Props) {
  const { identifier } = await params
  const detail = await getPublicOrganization(identifier)
  if (!detail) notFound()
  const organization = detail.organization
  const canonicalIdentifier = organization.slug || organization.public_organization_id
  const url = absoluteUrl(`/organizations/${encodeURIComponent(canonicalIdentifier)}`)
  if (identifier !== canonicalIdentifier) permanentRedirect(url)
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          '@id': url,
          url,
          name: organization.display_name,
          mainEntity: {
            '@type': 'Organization',
            '@id': `${url}#organization`,
            name: organization.display_name,
            legalName: organization.legal_name || undefined,
            description: organization.description || undefined,
            url: organization.website_url || url,
            logo: organization.logo_url ? absoluteUrl(organization.logo_url) : undefined,
          },
        }}
      />
      <OrganizationPublicProfile key={canonicalIdentifier} identifier={canonicalIdentifier} initialData={detail} />
    </>
  )
}
