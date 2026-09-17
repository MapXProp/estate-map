'use client'

import {
  normalizeProjectCategoryFilter,
  projectCategoryFilters,
  projectCategoryLabel,
  type MapProject,
  type ProjectCategoryFilter,
} from '@/lib/propertyMapProjects'
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
  onHover,
  hoveredProjectId,
  onRetry,
  onClearArea,
  category = 'all',
  onCategoryChange,
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
  onHover: (id: string) => void
  hoveredProjectId: string
  onRetry: () => void
  onClearArea?: () => void
  category: ProjectCategoryFilter
  onCategoryChange: (category: ProjectCategoryFilter) => void
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
          <div className="hidden items-start justify-between gap-2 pt-2 lg:flex">
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
            data-project-results-toolbar
            className="flex min-h-11 items-center justify-between gap-2 text-xs text-neutral-500 lg:mt-2 lg:min-h-9"
          >
            <span className="min-w-0" aria-live="polite" data-project-results-count>
              {loading ? (th ? `กำลังโหลด · ${count}` : `Loading · ${count}`) : count}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {onClearArea && (
                <button type="button" onClick={onClearArea} className="min-h-9 font-medium text-[#176b50]">
                  {th ? 'ดูทุกบริเวณ' : 'All areas'}
                </button>
              )}
              <select
                data-map-project-category
                value={category}
                onChange={(event) => onCategoryChange(normalizeProjectCategoryFilter(event.target.value))}
                aria-label={th ? 'ประเภทโครงการ' : 'Project type'}
                className={`h-11 w-36 max-w-[43vw] cursor-pointer rounded-lg border px-2 py-0 pr-7 text-xs font-medium focus:border-[#176b50] focus:ring-[#176b50] lg:h-9 ${category === 'all' ? 'border-neutral-200 bg-white text-neutral-700' : 'border-[#c5dbcf] bg-[#edf6f1] text-[#176b50]'}`}
              >
                {projectCategoryFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {th ? option.th : option.en}
                  </option>
                ))}
              </select>
            </div>
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
            const name = project.displayName || project.nameEn || project.name
            return (
              <button
                type="button"
                key={`${project.id}:${project.location.lat}:${project.location.lon}`}
                data-project-result={project.id}
                data-hovered={hoveredProjectId === project.id}
                onClick={() => onChoose(project)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') onHover(project.id)
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') onHover('')
                }}
                onFocus={() => onHover(project.id)}
                onBlur={() => onHover('')}
                className={styles.projectResult}
              >
                <span className={styles.projectIcon}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 font-semibold">{name}</span>
                  <span className={styles.projectResultMeta}>
                    {projectCategoryLabel(project.category, th)} · {project.listingCount ?? project.listingIds.length}{' '}
                    {th ? 'ประกาศ' : 'listings'}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0" />
              </button>
            )
          })}
          {!loading && !failed && !projects.length && (
            <div className="px-5 py-8 text-center text-sm leading-6 text-neutral-500">
              <p>
                {th
                  ? 'ยังไม่มีโครงการที่ตรงกับตัวกรอง ลองขยายบริเวณค้นหาหรือปรับตัวกรอง'
                  : 'No matching projects. Try a wider area or adjust the filters.'}
              </p>
              {category !== 'all' && (
                <button
                  type="button"
                  onClick={() => onCategoryChange('all')}
                  className="mt-2 min-h-11 font-semibold text-[#176b50]"
                >
                  {th ? 'ดูทุกประเภทโครงการ' : 'Show all project types'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
