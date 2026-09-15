'use client'

import { projectCategoryLabel, type MapProject } from '@/lib/propertyMapProjects'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  House,
  LoaderCircle,
  MapPin,
  PanelLeftClose,
  ShoppingBag,
} from 'lucide-react'
import styles from './PropertyMapSearch.module.css'

export default function MapProjectResults({
  projects,
  heading,
  areaLabel,
  loading,
  failed,
  expanded,
  th,
  onToggle,
  onCollapse,
  onChoose,
  onRetry,
  onClearArea,
}: {
  projects: MapProject[]
  heading: string
  areaLabel: string
  loading: boolean
  failed: boolean
  expanded: boolean
  th: boolean
  onToggle: () => void
  onCollapse: () => void
  onChoose: (project: MapProject) => void
  onRetry: () => void
  onClearArea?: () => void
}) {
  const count = `${projects.length} ${th ? 'โครงการ' : 'projects'}`
  return (
    <div className={styles.resultsList} data-map-project-results>
      <button
        type="button"
        data-map-mobile-panel-toggle
        data-sheet-drag-handle
        className={styles.mobilePanelToggle}
        aria-expanded={expanded}
        aria-controls="map-project-results-content"
        onClick={onToggle}
      >
        <span className="mx-auto mb-1.5 block h-1 w-9 rounded-full bg-neutral-300" aria-hidden="true" />
        <span className={styles.sheetSummaryRow}>
          <span className={styles.sheetSummary}>{heading}</span>
          <span className={styles.mobilePanelAction}>
            {expanded ? (th ? 'ดูแผนที่' : 'View map') : th ? 'ดูรายชื่อ' : 'View list'}
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </span>
        </span>
        <span className={styles.sheetSummaryRow}>
          <span className={styles.sheetArea}>
            <MapPin className="size-3.5 shrink-0" />
            <span>{areaLabel}</span>
          </span>
          <span className={styles.sheetCount}>
            {loading && <LoaderCircle className="size-3 animate-spin" />}
            {count}
          </span>
        </span>
      </button>
      <div id="map-project-results-content" className={styles.resultsContent}>
        <header className={styles.projectOverviewHeader}>
          <div className="flex items-start justify-between gap-2 pt-2">
            <div className="min-w-0">
              <h2 className="hidden text-base font-semibold lg:block">{heading}</h2>
              <p className="mt-1 text-xs text-neutral-500">
                {th ? 'โครงการที่มีประกาศตรงกับตัวกรอง' : 'Projects with matching listings'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCollapse}
              aria-label={th ? 'ย่อรายชื่อโครงการ' : 'Collapse project list'}
              className="hidden size-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 lg:grid"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
          <div
            className={`${onClearArea ? 'flex' : 'hidden lg:flex'} mt-2 min-h-9 items-center justify-between gap-2 text-xs text-neutral-500`}
          >
            <span className="hidden lg:inline" aria-live="polite">
              {loading ? (th ? `กำลังโหลด · ${count}` : `Loading · ${count}`) : count}
            </span>
            {onClearArea && (
              <button type="button" onClick={onClearArea} className="min-h-9 font-medium text-[#176b50]">
                {th ? 'ดูทุกบริเวณ' : 'All areas'}
              </button>
            )}
          </div>
        </header>
        <div data-sheet-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2" aria-busy={loading}>
          {failed && (
            <div role="alert" className="p-4 text-center text-sm">
              <p>{th ? 'โหลดโครงการยังไม่ครบ' : 'Some projects could not load'}</p>
              <button type="button" onClick={onRetry} className="min-h-11 font-semibold text-[#176b50]">
                {th ? 'ลองอีกครั้ง' : 'Retry'}
              </button>
            </div>
          )}
          {projects.map((project) => {
            const Icon =
              project.category === 'housing_estate'
                ? House
                : project.category === 'commercial_complex'
                  ? ShoppingBag
                  : Building2
            const name = project.nameEn || project.name
            return (
              <button
                type="button"
                key={`${project.id}:${project.location.lat}:${project.location.lon}`}
                data-project-result={project.id}
                onClick={() => onChoose(project)}
                className={styles.projectResult}
              >
                <span className={styles.projectIcon}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{name}</span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {projectCategoryLabel(project.category, th)} · {project.listingCount ?? project.listingIds.length}{' '}
                    {th ? 'ประกาศ' : 'listings'}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-[#176b50]" />
              </button>
            )
          })}
          {!loading && !failed && !projects.length && (
            <p className="px-5 py-8 text-center text-sm leading-6 text-neutral-500">
              {th
                ? 'ยังไม่มีโครงการที่ตรงกับตัวกรอง ลองขยายบริเวณค้นหาหรือปรับตัวกรอง'
                : 'No matching projects. Try a wider area or adjust the filters.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
