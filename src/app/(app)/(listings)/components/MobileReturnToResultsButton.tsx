'use client'

import { closePropertyTabOrReturn } from '@/lib/propertyReturnNavigation'
import { ArrowLeft } from 'lucide-react'

const MobileReturnToResultsButton = () => {
  return (
    <button
      type="button"
      onClick={closePropertyTabOrReturn}
      className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-full border border-[#cfe0d9] bg-white px-3 text-xs font-semibold whitespace-nowrap text-[#31594e] transition active:scale-[0.98] active:bg-[#edf5f1] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">กลับผลค้นหา</span>
    </button>
  )
}

export default MobileReturnToResultsButton
