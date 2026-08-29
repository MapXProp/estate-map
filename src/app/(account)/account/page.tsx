import AccountProfileForm from '@/components/account/AccountProfileForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'บัญชีของฉัน | MapXProp',
  description: 'จัดการข้อมูลบัญชี MapXProp',
}

const Page = () => <AccountProfileForm />

export default Page
