import { ThemeProvider } from '@/components/theme-provider'
import { DirectionProvider } from '@/components/ui/direction'
import { cn } from '@/lib/utils'
import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import 'rc-slider/assets/index.css'
//import CustomizeControl from './customize-control'

const poppins = Poppins({ subsets: ['latin'], variable: '--font-sans', weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: {
    template: '%s - MapxProp',
    default: 'MapxProp - Online property listing',
  },
  description: 'ศูนย์รวมพื้นที่และประกาศอสังหาริมทรัพย์ พื้นที่เช่า ที่ดิน ตลาด ตึกแถว คอนโด อพาทเม้นท์ บ้าน - Online property listing with innovation | Area, Land, House, Rowhouse, Condo, Apartment - MapxProp',
  keywords: ['MapxProp','หาที่ดิน','หาบ้าน','หาที่เช่าอยู่','หาพื้นที่เช่า','หาล็อคในตลาด','หาคอนโด','หาอพาทเม้นท์','หาตึกแถว','หาออฟฟิส','หาที่ทำธุรกิจ','Property finding','Property listing','Find property','Area','Land','House','Rowhouse','Condo','Apartment','Residence','Street market','Business area'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={process.env.NEXT_PUBLIC_THEME_DIR === 'rtl' ? 'ar' : 'en'}
      dir={process.env.NEXT_PUBLIC_THEME_DIR || 'ltr'}
      suppressHydrationWarning
      className={cn('font-sans', poppins.variable)}
    >
      <body className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
