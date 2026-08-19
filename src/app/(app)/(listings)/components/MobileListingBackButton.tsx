'use client'

import { clearPropertyResultsLocation, closePropertyTabOrReturn, getPropertyResultsLocation } from '@/lib/propertyReturnNavigation'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MobileListingBackButton = () => {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length <= 1 && getPropertyResultsLocation()) {
      closePropertyTabOrReturn()
      return
    }

    clearPropertyResultsLocation()
    router.back()
  }

  return (
    <div className="flex min-h-12 items-center min-[744px]:hidden">
      <button
        type="button"
        onClick={handleBack}
        className="-ms-2 inline-flex min-h-10 touch-manipulation items-center gap-1 rounded-full px-2 text-sm font-medium text-[#31594e] transition active:scale-[0.97] active:bg-[#edf5f1]"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        กลับสู่ผลการค้นหา
      </button>
    </div>
  )
}

export default MobileListingBackButton
