import AccountOverview from '@/components/account/AccountOverview'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เมนูและพื้นที่ของคุณ | MapXProp',
  description: 'ค้นหาอสังหา ดูรายการที่บันทึก และจัดการข้อมูลบัญชี MapXProp',
}

const Page = () => <AccountOverview />

export default Page
