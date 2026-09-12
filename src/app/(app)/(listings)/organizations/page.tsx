import OrganizationDirectory from '@/components/organizations/OrganizationDirectory'
import { getPublicOrganizations } from '@/lib/publicOrganizations'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'องค์กรอสังหาริมทรัพย์และประกาศจากบริษัท',
  description: 'ค้นหาองค์กรอสังหาริมทรัพย์ ธนาคารทรัพย์ NPA บริษัทนายหน้า และประกาศที่แยกตามความเชี่ยวชาญ',
  path: '/organizations',
  keywords: ['บริษัทอสังหาริมทรัพย์', 'ทรัพย์ NPA', 'นายหน้าอสังหาริมทรัพย์', 'องค์กร MapxProp'],
})

export default async function Page() {
  return <OrganizationDirectory initialOrganizations={await getPublicOrganizations()} />
}
