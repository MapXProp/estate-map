import type { Metadata } from 'next'
import PropertyHomePrototype from '../(home-pages)/property-home/page'

export const metadata: Metadata = {
  title: 'Mobile navigation prototype',
  description: 'หน้าทดลอง Mobile Navigation ของ MapxProp',
  robots: {
    index: false,
    follow: false,
  },
}

export default function Homes2Page() {
  return <PropertyHomePrototype />
}
