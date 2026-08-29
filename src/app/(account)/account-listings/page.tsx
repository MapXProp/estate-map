import MyListingsPanel from '@/components/account/MyListingsPanel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ประกาศของฉัน | MapXProp',
  description: 'ติดตามและจัดการประกาศที่ส่งผ่าน MapXProp',
}

const Page = () => <MyListingsPanel />

export default Page
