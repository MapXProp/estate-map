import { Metadata } from 'next'
import { ApplicationLayout } from '../application-layout'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Chisfis is a modern and elegant template for Next.js, Tailwind CSS, and TypeScript. It is designed to be simple and easy to use, with a focus on performance and accessibility.',
  keywords: ['MapxProp','หาที่ดิน','หาบ้าน','หาที่เช่าอยู่','หาพื้นที่เช่า','หาล็อคในตลาด','หาคอนโด','หาอพาทเม้นท์','หาตึกแถว','หาออฟฟิส','หาที่ทำธุรกิจ','Property finding','Property listing','Find property','Area','Land','House','Rowhouse','Condo','Apartment','Residence','Street market','Business area'],
}

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout>{children}</ApplicationLayout>
}
