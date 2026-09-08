import OrganizationPublicProfile from '@/components/organizations/OrganizationPublicProfile'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ข้อมูลองค์กรและประกาศอสังหาริมทรัพย์',
  description: 'ดูข้อมูลองค์กร สถานะการตรวจสอบ ช่องทางติดต่อ ความเชี่ยวชาญ และประกาศอสังหาริมทรัพย์',
  path: '/organizations',
})

export default async function Page({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = await params
  return <OrganizationPublicProfile key={identifier} identifier={identifier} />
}
