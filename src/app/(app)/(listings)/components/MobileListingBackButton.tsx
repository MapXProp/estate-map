'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const RETURN_LOCATION_KEY = 'mapxprop:return-to-results'
const RETURN_LOCATION_MAX_AGE = 30 * 60 * 1000

const MobileListingBackButton = () => {
  const router = useRouter()

  const handleBack = () => {
    const savedValue = sessionStorage.getItem(RETURN_LOCATION_KEY)
    sessionStorage.removeItem(RETURN_LOCATION_KEY)

    if (savedValue) {
      try {
        const savedLocation = JSON.parse(savedValue) as { href?: string; savedAt?: number }
        if (savedLocation.href && savedLocation.savedAt && Date.now() - savedLocation.savedAt < RETURN_LOCATION_MAX_AGE) {
          router.back()
          return
        }
      } catch {
        // Fall back to the main property search when the saved history is invalid.
      }
    }

    router.push('/properties/map')
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
