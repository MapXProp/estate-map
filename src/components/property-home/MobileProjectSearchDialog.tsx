'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { getPropertyMapSearchUrl } from '@/lib/propertySearch'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Building2, House, Landmark, Search, ShoppingBag, Store, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PropertySearchOmnibox from './PropertySearchOmnibox'

type Props = {
  open: boolean
  onClose: () => void
}

const projectTypes = [
  { labelTh: 'โครงการคอนโด', labelEn: 'Condo projects', query: 'โครงการคอนโด', icon: Building2 },
  { labelTh: 'หมู่บ้านจัดสรร', labelEn: 'Housing projects', query: 'โครงการหมู่บ้านจัดสรร', icon: House },
  { labelTh: 'ห้าง / ศูนย์การค้า', labelEn: 'Malls', query: 'ห้าง ศูนย์การค้า', icon: ShoppingBag },
  { labelTh: 'อาคารสำนักงาน', labelEn: 'Office buildings', query: 'อาคารสำนักงาน', icon: Landmark },
  { labelTh: 'ตลาด', labelEn: 'Markets', query: 'ตลาด', icon: Store },
] as const

const projectExamples = [
  { name: 'เซ็นทรัล ลาดพร้าว', descriptionTh: 'ห้างและศูนย์การค้า · จตุจักร', descriptionEn: 'Shopping centre · Chatuchak' },
  { name: 'ศุภาลัย ดอนเมือง', descriptionTh: 'โครงการคอนโด · ดอนเมือง', descriptionEn: 'Condo project · Don Mueang' },
  { name: 'แสนสิริ ปทุมธานี', descriptionTh: 'โครงการที่อยู่อาศัย · ปทุมธานี', descriptionEn: 'Residential project · Pathum Thani' },
] as const

const MobileProjectSearchDialog = ({ open, onClose }: Props) => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'

  const search = (query: string) => {
    onClose()
    router.push(getPropertyMapSearchUrl(query))
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[130] min-[744px]:hidden">
      <DialogPanel
        transition
        className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f4f5f6] text-neutral-950 transition duration-200 dark:bg-neutral-950 dark:text-white data-closed:translate-y-8 data-closed:opacity-0"
      >
        <header className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold">
              {isThai ? 'ค้นหาโครงการ / ห้าง' : 'Search projects / malls'}
            </DialogTitle>
            <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {isThai ? 'ดูประกาศและพื้นที่ว่างทั้งหมดภายในสถานที่เดียวกัน' : 'See every listing within one place'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isThai ? 'ปิด' : 'Close'}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white transition active:scale-95 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <PropertySearchOmnibox
            suggestionsMode="inline"
            showSuggestionsOnEmpty={false}
            placeholder={isThai ? 'พิมพ์ชื่อโครงการ ห้าง อาคาร หรือตลาด' : 'Project, mall, building, or market name'}
            onSubmitQuery={onClose}
          />

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {isThai ? 'เลือกตามประเภทสถานที่' : 'Choose a place type'}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {projectTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.query}
                    type="button"
                    onClick={() => search(isThai ? type.query : type.labelEn)}
                    className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 text-start transition active:border-[#8ab6a7] active:bg-[#f0f7f4] dark:border-neutral-700 dark:bg-neutral-900 dark:active:border-emerald-700"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                      <Icon className="size-4.5" strokeWidth={1.8} />
                    </span>
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      {isThai ? type.labelTh : type.labelEn}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {isThai ? 'ตัวอย่างการค้นหา' : 'Example searches'}
            </h2>
            <div className="mt-2 grid gap-2">
              {projectExamples.map((project) => (
                <button
                  key={project.name}
                  type="button"
                  onClick={() => search(project.name)}
                  className="flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 text-start transition active:border-[#8ab6a7] active:bg-[#f0f7f4] dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                    <Building2 className="size-4.5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">{project.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {isThai ? project.descriptionTh : project.descriptionEn}
                    </span>
                  </span>
                  <Search className="size-4 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </DialogPanel>
    </Dialog>
  )
}

export default MobileProjectSearchDialog
