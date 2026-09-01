import ListingDraftAccountPanel from '@/components/account/ListingDraftAccountPanel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ร่างประกาศ | MapXProp',
  description: 'กลับมากรอกร่างประกาศ MapXProp ต่อ',
}

const Page = () => <ListingDraftAccountPanel />

export default Page
