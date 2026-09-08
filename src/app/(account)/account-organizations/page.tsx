import OrganizationManagementPanel from '@/components/account/OrganizationManagementPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'องค์กรและทีมงาน | MapXProp',
  description: 'จัดการองค์กร สมาชิก สิทธิ์ และประกาศของทีมบน MapXProp',
}

export default function Page() {
  return <OrganizationManagementPanel />
}
