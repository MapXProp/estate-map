'use client'

import { CheckCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SuccessToastProps {
  message: string
  clearParam?: string
  duration?: number
}

export default function SuccessToast({ message, clearParam, duration = 2800 }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (clearParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete(clearParam)
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    }

    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [clearParam, duration])

  if (!isVisible) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 left-1/2 z-[100] flex min-h-14 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#37a14f]/45 bg-gradient-to-r from-[#edf8f0] via-white to-[#f3faf4] px-4 py-3 text-sm text-[#174c2b] shadow-[0_18px_48px_-18px_rgba(55,161,79,0.58)] ring-1 ring-[#37a14f]/15 dark:border-[#37a14f]/70 dark:from-[#163a20] dark:via-neutral-900 dark:to-[#17351e] dark:text-[#eaf7ed] dark:shadow-black/40 dark:ring-[#37a14f]/40"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#37a14f] text-white shadow-sm ring-4 ring-[#dff3e4] dark:bg-[#37a14f] dark:ring-[#245d31]">
        <CheckCircle className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 grow font-sarabun leading-5 font-semibold">{message}</span>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
        className="-m-1 rounded-full p-1.5 text-[#2b7e3e] transition hover:bg-[#dff3e4] hover:text-[#174c2b] dark:text-[#aee0b9] dark:hover:bg-[#245d31] dark:hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
