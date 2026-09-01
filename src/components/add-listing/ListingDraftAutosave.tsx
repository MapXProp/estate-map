'use client'

import { useAuth } from '@/hooks/useAuth'
import {
  getListingDraft,
  getListingDraftResumeStep,
  saveListingDraftToCloud,
  saveListingFormSnapshot,
} from '@/lib/listingDraft'
import { useEffect } from 'react'

const AUTOSAVE_DELAY_MS = 900

const ListingDraftAutosave = ({ step }: { step: number }) => {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let disposed = false
    let form: HTMLFormElement | null = null

    const persist = (saveToCloud: boolean) => {
      if (!form?.isConnected) return
      const draft = saveListingFormSnapshot(step, form)
      if (saveToCloud && isAuthenticated && !disposed) {
        void saveListingDraftToCloud(draft).catch(() => undefined)
      }
    }
    const schedule = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => persist(true), AUTOSAVE_DELAY_MS)
    }
    const saveBeforeLeaving = () => {
      if (getListingDraftResumeStep(getListingDraft()) > step) return
      persist(false)
    }
    const attachToForm = () => {
      const candidate = document.getElementById('add-listing-form')
      if (!(candidate instanceof HTMLFormElement)) {
        if (form && !form.isConnected) {
          form.removeEventListener('input', schedule)
          form.removeEventListener('change', schedule)
          form.removeEventListener('click', schedule)
          form = null
        }
        return
      }
      if (candidate === form) return
      form = candidate
      form.addEventListener('input', schedule)
      form.addEventListener('change', schedule)
      form.addEventListener('click', schedule)
    }

    attachToForm()
    const observer = new MutationObserver(attachToForm)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('beforeunload', saveBeforeLeaving)

    return () => {
      disposed = true
      if (timeoutId) clearTimeout(timeoutId)
      saveBeforeLeaving()
      observer.disconnect()
      form?.removeEventListener('input', schedule)
      form?.removeEventListener('change', schedule)
      form?.removeEventListener('click', schedule)
      window.removeEventListener('beforeunload', saveBeforeLeaving)
    }
  }, [isAuthenticated, step])

  return null
}

export default ListingDraftAutosave
