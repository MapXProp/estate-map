'use client'

import type { PropertyMapMode } from '@/lib/propertyMapProjects'
import { Building2, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './PropertyMapSearch.module.css'

export default function MapViewControls({
  mode,
  th,
  onModeChange,
  children,
}: {
  mode: PropertyMapMode
  th: boolean
  onModeChange: (mode: PropertyMapMode) => void
  children?: ReactNode
}) {
  return (
    <div className={styles.mapViewBar} data-map-view-controls>
      {children}
      <div className={styles.mapViewSwitch} role="group" aria-label={th ? 'รูปแบบหมุดบนแผนที่' : 'Map view'}>
        <button
          type="button"
          data-map-mode="listings"
          aria-pressed={mode === 'listings'}
          onClick={() => onModeChange('listings')}
        >
          <MapPin className="size-4" />
          {th ? 'หมุดประกาศ' : 'Listing pins'}
        </button>
        <button
          type="button"
          data-map-mode="projects"
          title={
            th
              ? 'ดูโครงการบ้าน คอนโด ห้าง และโครงการประเภทอื่น'
              : 'View housing projects, condos, malls and other projects'
          }
          aria-pressed={mode === 'projects'}
          onClick={() => onModeChange('projects')}
        >
          <Building2 className="size-4" />
          {th ? 'ดูโครงการ' : 'Projects'}
        </button>
      </div>
    </div>
  )
}
