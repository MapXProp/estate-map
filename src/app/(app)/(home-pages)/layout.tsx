import { Metadata } from 'next'
import { ApplicationLayout } from '../application-layout'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'ศูนย์รวมพื้นที่และประกาศอสังหาริมทรัพย์ พื้นที่เช่า ที่ดิน ตลาด ตึกแถว คอนโด อพาทเม้นท์ บ้าน - Online property listing with innovation | Area, Land, House, Rowhouse, Condo, Apartment - MapxProp',
  keywords: ['MapxProp','หาที่ดิน','หาบ้าน','หาที่เช่าอยู่','หาพื้นที่เช่า','หาล็อคในตลาด','หาคอนโด','หาอพาทเม้นท์','หาตึกแถว','หาออฟฟิส','หาที่ทำธุรกิจ','Property finding','Property listing','Find property','Area','Land','House','Rowhouse','Condo','Apartment','Residence','Street market','Business area'],
}

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout>{children}</ApplicationLayout>
}
