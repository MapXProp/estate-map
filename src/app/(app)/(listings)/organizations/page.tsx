import OrganizationDirectory from '@/components/organizations/OrganizationDirectory'
import JsonLd from '@/components/seo/JsonLd'
import { getPublicOrganizations } from '@/lib/publicOrganizations'
import { collectionPageStructuredData, createPageMetadata } from '@/lib/seo'

const page = {
  title: 'องค์กรอสังหาริมทรัพย์และประกาศจากบริษัท',
  description:
    'ค้นหาบริษัทนายหน้า ผู้พัฒนาโครงการ ธนาคาร และบริษัทบริหารสินทรัพย์ เลือกตามความเชี่ยวชาญ พร้อมดูประกาศอสังหาริมทรัพย์และช่องทางติดต่อองค์กร',
  path: '/organizations',
  keywords: ['บริษัทอสังหาริมทรัพย์', 'ทรัพย์ NPA', 'นายหน้าอสังหาริมทรัพย์', 'องค์กร MapxProp'],
}

export const metadata = createPageMetadata(page)

export default async function Page() {
  const organizations = await getPublicOrganizations()
  return (
    <>
      <JsonLd
        data={collectionPageStructuredData(
          page,
          organizations.map((organization) => ({
            name: organization.display_name,
            path: `/organizations/${encodeURIComponent(organization.slug || organization.public_organization_id)}`,
          }))
        )}
      />
      <OrganizationDirectory initialOrganizations={organizations} />
    </>
  )
}
