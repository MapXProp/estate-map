import type { Metadata } from 'next'
import React, { FC } from 'react'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ',
  robots: { index: false, follow: false },
}

interface Props {
  children?: React.ReactNode
}

const Layout: FC<Props> = ({ children }) => {
  return <>{children}</>
}

export default Layout
