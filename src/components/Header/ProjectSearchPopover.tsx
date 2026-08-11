'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import {
  fetchPropertySearchSuggestions,
  getPropertyMapSearchUrl,
  PropertySearchSuggestion,
} from '@/lib/propertySearch'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Building2, ChevronDown, House, Landmark, Search, ShoppingBag, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type ProjectCategory = 'all' | 'condo' | 'village' | 'mall' | 'building' | 'market'

type ProjectOption = {
  name: string
  descriptionTh: string
  descriptionEn: string
  category: Exclude<ProjectCategory, 'all'>
}

const categories = [
  { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All', icon: Landmark },
  { id: 'condo', labelTh: 'คอนโด', labelEn: 'Condo', icon: Building2 },
  { id: 'village', labelTh: 'หมู่บ้าน', labelEn: 'Housing', icon: House },
  { id: 'mall', labelTh: 'ห้าง', labelEn: 'Mall', icon: ShoppingBag },
  { id: 'building', labelTh: 'อาคาร', labelEn: 'Building', icon: Building2 },
  { id: 'market', labelTh: 'ตลาด', labelEn: 'Market', icon: Store },
] as const

const sampleProjects: ProjectOption[] = [
  {
    name: 'เซ็นทรัล ลาดพร้าว',
    descriptionTh: 'ห้างและศูนย์การค้า · จตุจักร',
    descriptionEn: 'Shopping centre · Chatuchak',
    category: 'mall',
  },
  {
    name: 'ศุภาลัย ดอนเมือง',
    descriptionTh: 'โครงการคอนโด · ดอนเมือง',
    descriptionEn: 'Condo project · Don Mueang',
    category: 'condo',
  },
  {
    name: 'แสนสิริ ปทุมธานี',
    descriptionTh: 'โครงการที่อยู่อาศัย · ปทุมธานี',
    descriptionEn: 'Residential project · Pathum Thani',
    category: 'village',
  },
  {
    name: 'อาคารสำนักงานย่านสาทร',
    descriptionTh: 'อาคารสำนักงานและพื้นที่เช่า · สาทร',
    descriptionEn: 'Office buildings and spaces · Sathon',
    category: 'building',
  },
] as const

const ProjectSearchPopover = () => {
  const router = useRouter()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('all')
  const [apiSuggestions, setApiSuggestions] = useState<PropertySearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setApiSuggestions([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const suggestions = await fetchPropertySearchSuggestions(query, controller.signal)
      setApiSuggestions(
        suggestions.filter(
          (suggestion) =>
            suggestion.type.toLowerCase() === 'project' || suggestion.description.toLowerCase() === 'project'
        )
      )
      setLoading(false)
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const matchingSamples = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th-TH')
    return sampleProjects.filter((project) => {
      const categoryMatches = category === 'all' || project.category === category
      const queryMatches =
        !normalizedQuery ||
        `${project.name} ${project.descriptionTh} ${project.descriptionEn}`.toLocaleLowerCase('th-TH').includes(normalizedQuery)
      return categoryMatches && queryMatches
    })
  }, [category, query])

  const goToProject = (value: string, close: () => void) => {
    const nextQuery = value.trim()
    if (!nextQuery) return
    close()
    router.push(getPropertyMapSearchUrl(nextQuery))
  }

  return (
    <Popover className="relative hidden min-[744px]:block">
      {({ close }) => (
        <>
          <PopoverButton
            className="group flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap text-neutral-800 transition hover:text-[#176b50] focus-visible:outline-none dark:text-neutral-100 dark:hover:text-emerald-300"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <Building2 className="size-4 text-[#537066]" strokeWidth={1.8} />
            <span className="min-[1100px]:hidden">{isThai ? 'โครงการ' : 'Projects'}</span>
            <span className="hidden min-[1100px]:inline">{isThai ? 'โครงการ / ห้าง' : 'Projects / malls'}</span>
            <ChevronDown className="size-3.5 text-neutral-400 transition group-data-open:rotate-180" />
          </PopoverButton>

          <PopoverPanel
            transition
            anchor={{ to: 'bottom', gap: 12 }}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            className="z-[70] w-[min(35rem,calc(100vw-2rem))] rounded-[28px] border border-neutral-200/90 bg-white p-5 shadow-[0_28px_80px_-24px_rgba(15,23,42,0.35)] transition duration-200 dark:border-neutral-700 dark:bg-neutral-900 data-closed:translate-y-1 data-closed:opacity-0"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                <Landmark className="size-5" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-neutral-950 dark:text-white">
                  {isThai ? 'ค้นหาตามโครงการหรือสถานที่' : 'Search by project or place'}
                </h2>
                <p className="mt-0.5 text-xs/5 text-neutral-500 dark:text-neutral-400">
                  {isThai
                    ? 'เลือกโครงการแม่ แล้วดูทุกประกาศและพื้นที่ว่างภายในที่เดียว'
                    : 'Choose a parent project to see every listing and available space inside'}
                </p>
              </div>
            </div>

            <form
              className="mt-4 flex h-12 items-center rounded-2xl border border-neutral-200 bg-neutral-50 ps-4 pe-1.5 transition focus-within:border-[#8ab6a7] focus-within:bg-white focus-within:shadow-[0_6px_20px_rgba(18,63,50,0.10)] dark:border-neutral-700 dark:bg-neutral-800 dark:focus-within:border-emerald-700 dark:focus-within:bg-neutral-900"
              onSubmit={(event: FormEvent) => {
                event.preventDefault()
                goToProject(query, close)
              }}
            >
              <Search className="size-4.5 shrink-0 text-[#176b50] dark:text-emerald-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:ring-0 dark:text-white"
                placeholder={isThai ? 'พิมพ์ชื่อโครงการ ห้าง อาคาร หรือตลาด' : 'Project, mall, building, or market name'}
                aria-label={isThai ? 'ค้นหาชื่อโครงการหรือห้าง' : 'Search project or mall'}
                autoComplete="off"
              />
              <button
                type="submit"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#123f32] text-white transition hover:bg-[#0b3227] active:scale-95 dark:bg-emerald-200 dark:text-emerald-950"
                aria-label={isThai ? 'ค้นหาโครงการ' : 'Search project'}
              >
                <Search className="size-4" />
              </button>
            </form>

            <div className="hidden-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((item) => {
                const Icon = item.icon
                const active = category === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                      active
                        ? 'border-[#176b50] bg-[#176b50] text-white shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#a8c8bc] hover:bg-[#f5faf7] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    <Icon className="size-3.5" strokeWidth={1.8} />
                    {isThai ? item.labelTh : item.labelEn}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
              <p className="px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {query.trim()
                  ? isThai
                    ? 'ผลลัพธ์ที่ตรงกับชื่อ'
                    : 'Matching names'
                  : isThai
                    ? 'ตัวอย่างโครงการและสถานที่'
                    : 'Example projects and places'}
              </p>
              <div className="mt-1.5 grid max-h-64 gap-1 overflow-y-auto">
                {apiSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.query}`}
                    type="button"
                    onClick={() => goToProject(suggestion.query, close)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition hover:bg-[#f0f7f4] dark:hover:bg-emerald-950/40"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                      <Building2 className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {suggestion.label}
                      </span>
                      <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {suggestion.description}
                      </span>
                    </span>
                  </button>
                ))}

                {!loading && apiSuggestions.length === 0 &&
                  matchingSamples.map((project) => (
                    <button
                      key={project.name}
                      type="button"
                      onClick={() => goToProject(project.name, close)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition hover:bg-[#f0f7f4] dark:hover:bg-emerald-950/40"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                        <Building2 className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {project.name}
                        </span>
                        <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {isThai ? project.descriptionTh : project.descriptionEn}
                        </span>
                      </span>
                    </button>
                  ))}

                {loading && (
                  <div className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {isThai ? 'กำลังค้นหาชื่อโครงการ…' : 'Searching project names…'}
                  </div>
                )}

                {query.trim() && !loading && apiSuggestions.length === 0 && matchingSamples.length === 0 && (
                  <button
                    type="button"
                    onClick={() => goToProject(query, close)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-start transition hover:bg-[#f0f7f4] dark:hover:bg-emerald-950/40"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf4ef] text-[#176b50] dark:bg-emerald-950 dark:text-emerald-200">
                      <Search className="size-4" />
                    </span>
                    <span className="min-w-0 text-sm font-semibold text-neutral-900 dark:text-white">
                      {isThai ? `ค้นหา “${query}” ในชื่อโครงการและสถานที่` : `Search “${query}” in projects and places`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}

export default ProjectSearchPopover
