import AdminRoleManagement from '@/components/account/AdminRoleManagement'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'จัดการสิทธิ์ผู้ใช้ | MapXProp',
  description: 'จัดการ Platform Roles สำหรับทีม MapXProp',
}

const Page = () => <AdminRoleManagement />

export default Page
