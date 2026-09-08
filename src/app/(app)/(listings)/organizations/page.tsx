import OrganizationDirectory from '@/components/organizations/OrganizationDirectory'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'องค์กรอสังหาริมทรัพย์และประกาศจากบริษัท',
  description: 'ค้นหาองค์กรอสังหาริมทรัพย์ ธนาคารทรัพย์ NPA บริษัทนายหน้า และประกาศที่แยกตามความเชี่ยวชาญ',
  path: '/organizations',
  keywords: ['บริษัทอสังหาริมทรัพย์', 'ทรัพย์ NPA', 'นายหน้าอสังหาริมทรัพย์', 'องค์กร MapxProp'],
})

export default function Page() {
  return <OrganizationDirectory />
}
