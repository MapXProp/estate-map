import DeferredGoogleAnalytics from '@/components/analytics/DeferredGoogleAnalytics'
import { AuthModalProvider } from '@/components/auth/AuthModalProvider'
import { PreferencesProvider } from '@/components/preferences/PreferencesProvider'
import { SavedListingsProvider } from '@/components/saved-listings/SavedListingsProvider'
import JsonLd from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/theme-provider'
import { DirectionProvider } from '@/components/ui/direction'
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo'
import { cn } from '@/lib/utils'
import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Inter, Noto_Sans_Thai, Sarabun } from 'next/font/google'
import 'rc-slider/assets/index.css'
//import CustomizeControl from './customize-control'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-next',
})
const sarabun = Sarabun({
  subsets: ['thai'],
  display: 'swap',
  variable: '--font-sarabun-next',
  weight: ['400', '500', '600', '700'],
})
const notoSansThaiFallback = Noto_Sans_Thai({
  subsets: ['thai'],
  display: 'swap',
  variable: '--font-noto-sans-thai-fallback',
  preload: false,
})

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | MapxProp',
    default: 'MapxProp | ค้นหาบ้าน ที่ดิน ห้องเช่า และพื้นที่ธุรกิจ',
  },
  description:
    'ค้นหาบ้าน คอนโด ที่ดิน ห้องเช่า ร้านค้า ออฟฟิศ โกดัง และพื้นที่ออกบูธทั่วไทย พร้อมราคา รูปภาพ ทำเล และแผนที่บน MapxProp',
  keywords: [
    'MapxProp',
    'อสังหาริมทรัพย์',
    'บ้านขาย',
    'บ้านให้เช่า',
    'คอนโด',
    'ที่ดิน',
    'ห้องเช่า',
    'พื้นที่ให้เช่า',
    'พื้นที่ธุรกิจ',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'real estate',
  formatDetection: { address: false, email: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'MapxProp | ค้นหาบ้าน ที่ดิน ห้องเช่า และพื้นที่ธุรกิจ',
    description: 'ค้นหาอสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ พร้อมราคา รูปภาพ ทำเล และแผนที่ทั่วประเทศไทย',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MapxProp | ค้นหาอสังหาริมทรัพย์สำหรับชีวิตและธุรกิจ',
    description: 'ค้นหาบ้าน ที่ดิน ห้องเช่า และพื้นที่ธุรกิจทั่วไทยบน MapxProp',
    images: [DEFAULT_OG_IMAGE],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
}

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/M5.png`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ['th-TH', 'en'],
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/real-estate-categories/all?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={process.env.NEXT_PUBLIC_THEME_DIR === 'rtl' ? 'ar' : 'th'}
      dir={process.env.NEXT_PUBLIC_THEME_DIR || 'ltr'}
      suppressHydrationWarning
      className={cn('font-sans', inter.variable, sarabun.variable, notoSansThaiFallback.variable)}
    >
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
        <JsonLd data={websiteStructuredData} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <PreferencesProvider>
            <AuthModalProvider>
              <SavedListingsProvider>
                <DirectionProvider
                  dir={process.env.NEXT_PUBLIC_THEME_DIR || 'ltr'}
                  direction={process.env.NEXT_PUBLIC_THEME_DIR || 'ltr'}
                >
                  <div>
                    {children}

                    {/* For Chisfis's demo  -- you can remove it  */}
                    {/* <CustomizeControl /> */}
                  </div>
                </DirectionProvider>
              </SavedListingsProvider>
            </AuthModalProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
      {process.env.NODE_ENV === 'production' && googleAnalyticsId ? (
        <DeferredGoogleAnalytics gaId={googleAnalyticsId} />
      ) : null}
    </html>
  )
}
