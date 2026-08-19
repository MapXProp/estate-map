'use client'

import { Instagram } from 'lucide-react'
import type { SVGProps } from 'react'

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.974h-1.513c-1.491 0-1.956.931-1.956 1.887v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
  </svg>
)

const LineIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M12 1.45C5.98 1.45 1.1 5.72 1.1 11.03c0 4.77 3.92 8.73 9.15 9.48l-.28 2.12c-.08.63.64 1.02 1.15.65l4.72-3.38c4.2-1.4 7.06-4.75 7.06-8.87 0-5.31-4.88-9.58-10.9-9.58Z"
      fill="currentColor"
    />
    <path
      d="M4.8 8.25v5.5h2.55M8.9 8.25v5.5M10.65 13.75v-5.5l3.05 5.5v-5.5M19.2 8.25h-3.35v5.5h3.35m-3.35-2.75h2.85"
      stroke="white"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const socialAccounts = [
  {
    name: 'Facebook',
    account: 'MapxProp',
    href: 'https://www.facebook.com/mapxprop',
    icon: FacebookIcon,
    hoverClass: 'hover:text-[#1877F2] dark:hover:text-[#4C9AFF]',
    iconClass: 'size-[22px]',
  },
  {
    name: 'Instagram',
    account: '@mapxprop',
    href: 'https://www.instagram.com/mapxprop',
    icon: Instagram,
    hoverClass: 'hover:text-[#E4405F] dark:hover:text-[#F0627D]',
    iconClass: 'size-[22px]',
  },
  {
    name: 'LINE',
    account: 'ID: mapxprop',
    href: 'https://line.me/ti/p/~mapxprop',
    icon: LineIcon,
    hoverClass: 'hover:text-[#06C755] dark:hover:text-[#06C755]',
    iconClass: 'size-6',
  },
] as const

const SocialMediaLinks = ({ className = '' }: { className?: string }) => (
  <div className={`-ml-2.5 flex items-center gap-2 ${className}`} aria-label="MapxProp social media">
    {socialAccounts.map(({ name, account, href, icon: Icon, hoverClass, iconClass }) => (
      <a
        key={name}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${name} ${account}`}
        title={`${name} ${account}`}
        className={`inline-flex size-10 items-center justify-center text-[#5b6574] transition-colors focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 ${hoverClass}`}
      >
        <Icon className={iconClass} aria-hidden="true" />
      </a>
    ))}
  </div>
)

export default SocialMediaLinks
