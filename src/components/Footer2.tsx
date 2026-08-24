'use client'

import SocialMediaLinks from '@/components/SocialMediaLinks'
import Logo from '@/shared/Logo'
import T from '@/utils/getT'
import { usePathname } from 'next/navigation'

const navigation: {
  solutions: { name: string; href: string }[]
  support: { name: string; href: string }[]
  company: { name: string; href: string }[]
  legal: { name: string; href: string }[]
} = {
  solutions: [
    { name: 'Marketing', href: '#' },
    { name: 'Analytics', href: '#' },
    { name: 'Automation', href: '#' },
    { name: 'Commerce', href: '#' },
  ],
  support: [
    { name: 'Submit ticket', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
  ],
  legal: [
    { name: 'Terms of service', href: '#' },
    { name: 'Privacy policy', href: '#' },
    { name: 'License', href: '#' },
    { name: 'Insights', href: '#' },
  ],
}

export default function Footer2() {
  const pathname = usePathname()

  // Keep the listing wizard focused on one task. Navigation back to the site
  // remains available in the wizard actions, so a large footer only adds exits.
  if (pathname.startsWith('/add-listing')) return null

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-700">
      <div className="container pt-16 pb-8 sm:pt-24 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Logo className="w-20" />
            <p className="text-sm/6 text-balance text-gray-600 dark:text-neutral-400">
              Making the world a better place through constructing elegant hierarchies.
            </p>
            <SocialMediaLinks />
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-neutral-300">Solutions</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.solutions.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-neutral-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-neutral-300">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-neutral-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-neutral-300">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-neutral-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-neutral-300">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-neutral-400">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-gray-900/10 pt-8 sm:mt-20 lg:mt-24 dark:border-gray-700">
          <p className="font-sarabun! text-sm/6 text-gray-600 dark:text-neutral-400">{T.Footer2.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
