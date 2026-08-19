'use client'

import { Dialog, DialogPanel } from '@headlessui/react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const FullPropertyDetailView = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  return (
    <Dialog open onClose={() => router.back()} className="relative z-[85]">
      <div className="fixed inset-0 overflow-y-auto overscroll-contain bg-white dark:bg-neutral-950">
        <DialogPanel className="relative min-h-full w-full">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="ปิดหน้ารายละเอียด"
            className="fixed top-4 right-4 z-50 hidden size-11 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-600 shadow-sm backdrop-blur transition hover:bg-neutral-100 min-[744px]:flex dark:border-neutral-700 dark:bg-neutral-900/95 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <X className="size-5" />
          </button>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default FullPropertyDetailView
