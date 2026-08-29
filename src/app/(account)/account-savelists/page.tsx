import SavedListingsPanel from '@/components/account/SavedListingsPanel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ประกาศที่บันทึก | MapXProp',
  description: 'ดูประกาศอสังหาริมทรัพย์ที่คุณบันทึกไว้บน MapXProp',
}

const Page = () => <SavedListingsPanel />

export default Page
