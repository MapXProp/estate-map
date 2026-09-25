'use client'

import {
  browseTypeGroups,
  browseTypeGroupState,
  normalizeBrowseTypeSelection,
  setBrowseTypeGroup,
} from '@/lib/browseTypeSelection'
import { browseCategoryLabels } from '@/lib/propertyBrowse'
import { toggleMapCategory } from '@/lib/propertyMapSearch'
import { Dialog, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from '@headlessui/react'
import { ArrowRight, BedDouble, Building2, Check, ChevronDown, House, LandPlot, Minus, Store, X } from 'lucide-react'
import { useId, useState } from 'react'
import styles from './BrowseTypePicker.module.css'

const groups = {
  homes: {
    icon: House,
    th: 'บ้านและคอนโด',
    en: 'Homes & condos',
    hintTh: 'บ้านเดี่ยว · ทาวน์โฮม · คอนโด',
    hintEn: 'Houses · townhomes · condos',
  },
  rooms: {
    icon: BedDouble,
    th: 'ห้องเช่ารายเดือน',
    en: 'Monthly rentals',
    hintTh: 'ห้องเช่า · อพาร์ตเมนต์ · หอพัก',
    hintEn: 'Rooms · apartments · dorms',
  },
  business: {
    icon: Store,
    th: 'พื้นที่ธุรกิจ',
    en: 'Business spaces',
    hintTh: 'ร้านค้า · ออฟฟิศ · โกดัง',
    hintEn: 'Shops · offices · warehouses',
  },
  land: { icon: LandPlot, th: 'ที่ดิน', en: 'Land', hintTh: 'รวมที่ดินทุกการใช้งาน', hintEn: 'Land for every use' },
}

export default function BrowseTypePicker({
  value,
  th,
  onClose,
  onApply,
}: {
  value: string[]
  th: boolean
  onClose: () => void
  onApply: (categories: string[]) => void
}) {
  const [selected, setSelected] = useState(() => normalizeBrowseTypeSelection(value))
  const [expanded, setExpanded] = useState<string | null>(null)
  const id = useId()
  const labels = browseCategoryLabels(selected, th)
  const all = selected.length === 0

  return (
    <Dialog open onClose={onClose} className={styles.dialog}>
      <DialogBackdrop className={styles.backdrop} />
      <div className={styles.position}>
        <DialogPanel className={styles.panel} data-browse-type-picker>
          <header className={styles.header}>
            <div>
              <DialogTitle>{th ? 'สนใจอสังหาฯ แบบไหน?' : 'What are you looking for?'}</DialogTitle>
              <DialogDescription>
                {th ? 'เลือกทั้งหมวด หรือเลือกย่อยได้ตามใจ' : 'Pick a whole group or choose specific types.'}
              </DialogDescription>
            </div>
            <button className={styles.close} data-autofocus aria-label={th ? 'ปิด' : 'Close'} onClick={onClose}>
              <X size={21} />
            </button>
          </header>

          <div className={styles.content}>
            <button className={styles.all} data-browse-all-types aria-pressed={all} onClick={() => setSelected([])}>
              <span>
                <Building2 size={19} />
                <strong>{th ? 'ทุกประเภท' : 'All property types'}</strong>
              </span>
              <span className={styles.check}>{all && <Check size={15} />}</span>
            </button>
            <div className={styles.list}>
              {browseTypeGroups.map((group) => {
                const meta = groups[group.code as keyof typeof groups]
                const Icon = meta.icon
                const state = browseTypeGroupState(selected, group.code)
                const isOpen = expanded === group.code
                const hasTypes = group.code !== 'land'
                const name = th ? meta.th : meta.en
                return (
                  <section
                    key={group.code}
                    className={styles.group}
                    data-selected={state.all || state.partial}
                    data-expanded={isOpen}
                  >
                    <div className={styles.groupRow}>
                      <button
                        className={styles.groupSelect}
                        role="checkbox"
                        aria-checked={state.partial ? 'mixed' : state.all}
                        aria-label={`${th ? 'เลือกทั้งหมวด' : 'Select group'} ${name}`}
                        data-browse-type-group={group.code}
                        onClick={() => setSelected((current) => setBrowseTypeGroup(current, group.code, !state.all))}
                      >
                        <span className={styles.icon}>
                          <Icon size={24} strokeWidth={1.65} />
                        </span>
                        <span className={styles.groupCopy}>
                          <strong>{name}</strong>
                          <span>
                            {state.all
                              ? th
                                ? 'เลือกทั้งหมวดแล้ว'
                                : 'Whole group selected'
                              : state.partial
                                ? th
                                  ? `เลือกแล้ว ${state.count} ประเภท`
                                  : `${state.count} types selected`
                                : th
                                  ? meta.hintTh
                                  : meta.hintEn}
                          </span>
                        </span>
                        <span className={styles.check}>
                          {state.all ? <Check size={15} /> : state.partial ? <Minus size={15} /> : null}
                        </span>
                      </button>
                      {hasTypes && (
                        <button
                          className={styles.expand}
                          aria-expanded={isOpen}
                          aria-controls={`${id}-${group.code}`}
                          aria-label={`${th ? 'เลือกประเภทย่อย' : 'Choose types in'} ${name}`}
                          data-browse-expand-types={group.code}
                          onClick={() => setExpanded(isOpen ? null : group.code)}
                        >
                          <span>{th ? 'เลือกย่อย' : 'Types'}</span>
                          <ChevronDown size={17} />
                        </button>
                      )}
                    </div>
                    {hasTypes && (
                      <div id={`${id}-${group.code}`} hidden={!isOpen} className={styles.subtypes}>
                        <div className={styles.subtypeHeader}>
                          <p>{th ? 'เลือกได้หลายประเภท' : 'Select as many as you like'}</p>
                          <button
                            data-browse-group-all={group.code}
                            onClick={() =>
                              setSelected((current) => setBrowseTypeGroup(current, group.code, !state.all))
                            }
                          >
                            {state.all ? (th ? 'ล้างหมวดนี้' : 'Clear group') : th ? 'เลือกทั้งหมวด' : 'Select group'}
                          </button>
                        </div>
                        {group.sections.map((section) => (
                          <div key={section.id} className={styles.subtypeSection}>
                            {section.nameTh && <h3>{th ? section.nameTh : section.nameEn}</h3>}
                            <div className={styles.options}>
                              {section.options.map((option) => (
                                <button
                                  key={option.id}
                                  data-browse-category={option.id}
                                  aria-pressed={selected.includes(option.id)}
                                  onClick={() =>
                                    setSelected((current) =>
                                      normalizeBrowseTypeSelection(toggleMapCategory(current, option.id))
                                    )
                                  }
                                >
                                  <span>{th ? option.nameTh : option.nameEn}</span>
                                  <span className={styles.check}>
                                    {selected.includes(option.id) && <Check size={14} />}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.summary} aria-live="polite" aria-atomic="true" data-browse-type-summary>
              <strong>
                {all
                  ? th
                    ? 'ดูได้ทุกประเภท'
                    : 'All property types'
                  : th
                    ? `เลือก ${labels.length} ประเภท`
                    : `${labels.length} types selected`}
              </strong>
              <p>{all ? (th ? 'ยังไม่จำกัดประเภททรัพย์' : 'No property type restriction') : labels.join(' · ')}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.reset} disabled={all} onClick={() => setSelected([])}>
                {th ? 'ล้างที่เลือก' : 'Reset'}
              </button>
              <button className={styles.apply} data-browse-apply-types onClick={() => onApply(selected)}>
                {th ? 'ดูประกาศ' : 'Show listings'}
                <ArrowRight size={18} />
              </button>
            </div>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
