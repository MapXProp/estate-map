'use client'

import { motion, useIsPresent, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import styles from './PropertyMapSearch.module.css'

export default function MapPreviewPanel({
  mobile,
  label,
  children,
}: {
  mobile: boolean
  label: string
  children: ReactNode
}) {
  const present = useIsPresent()
  const reducedMotion = useReducedMotion()
  const animate = mobile && !reducedMotion

  return (
    <motion.aside
      data-map-preview-panel
      data-mobile-top-sheet={mobile}
      className={styles.previewPanel}
      aria-label={label}
      inert={!present}
      style={{ pointerEvents: present ? 'auto' : 'none' }}
      initial={animate ? { y: '-100%', opacity: 0 } : false}
      animate={{ y: '0%', opacity: 1 }}
      exit={{ y: animate ? '-100%' : '0%', opacity: 0 }}
      transition={{ duration: animate ? 0.26 : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.aside>
  )
}
