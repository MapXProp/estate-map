import AdminListingModeration from '@/components/account/AdminListingModeration'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ตรวจและอนุมัติประกาศ | MapXProp',
  description: 'คิวตรวจสอบและอนุมัติประกาศสำหรับ Super Admin',
}

const Page = () => <AdminListingModeration />

export default Page
