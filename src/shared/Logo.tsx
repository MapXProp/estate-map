import Link from 'next/link'
import React from 'react'
import LogoSvg from './LogoSvg'

interface LogoProps {
  className?: string
}

const Logo: React.FC<LogoProps> = ({ className = 'w-22 sm:w-24' }) => {
  return (
    <Link href="/" className={`inline-block text-primary-600 focus:ring-0 focus:outline-hidden ${className}`}>
      <LogoSvg />
    </Link>
  )
}

export default Logo
