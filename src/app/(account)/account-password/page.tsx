import ChangePasswordForm from '@/components/account/ChangePasswordForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'เปลี่ยนรหัสผ่าน | MapXProp',
  description: 'จัดการรหัสผ่านบัญชี MapXProp',
}

const Page = () => <ChangePasswordForm />

export default Page
