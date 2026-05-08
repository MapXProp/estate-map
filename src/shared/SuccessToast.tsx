'use client'

import { CheckCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SuccessToastProps {
  message: string
  clearParam?: string
  duration?: number
}

export default function SuccessToast({ message, clearParam, duration = 3500 }: SuccessToastProps) {
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
      className="fixed top-5 right-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm items-start gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-950 shadow-2xl shadow-green-950/15 ring-1 ring-green-100 dark:border-green-700 dark:bg-green-950 dark:text-green-50 dark:shadow-black/30 dark:ring-green-800"
    >
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500">
        <CheckCircle className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 grow font-medium">{message}</span>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
        className="-m-1 rounded-full p-1 text-green-700 transition hover:bg-green-100 hover:text-green-950 dark:text-green-200 dark:hover:bg-green-900 dark:hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
