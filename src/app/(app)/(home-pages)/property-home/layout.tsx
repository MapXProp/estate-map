import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ค้นหาอสังหาริมทรัพย์',
  alternates: { canonical: '/homes' },
  robots: { index: false, follow: true },
}

export default function PropertyHomeLayout({ children }: { children: React.ReactNode }) {
  return children
}
