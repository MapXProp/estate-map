'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import type { PropertySearchListing } from '@/lib/propertySearch'
import {
  fetchMySavedListings,
  mergeMySavedListings,
  readGuestSavedListings,
  saveMyListing,
  type SavedListingReference,
  type SavedListingsResponse,
  unsaveMyListing,
  writeGuestSavedListings,
} from '@/lib/savedListings'
import { Heart, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type SavedListingsContextValue = {
  listings: PropertySearchListing[]
  isReady: boolean
  error: string
  isSaved: (identifier?: string) => boolean
  isBusy: (identifier?: string) => boolean
  refresh: () => Promise<void>
  toggleSaved: (identifier: string) => Promise<void>
}

type SavedToast = {
  id: number
  message: string
  showLogin?: boolean
}

const SavedListingsContext = createContext<SavedListingsContextValue | null>(null)

const referenceMatches = (reference: SavedListingReference, identifier: string) =>
  reference.slug === identifier || reference.public_listing_id === identifier

const referencesFromGuest = (identifiers: string[]): SavedListingReference[] =>
  identifiers.map((identifier) => ({ public_listing_id: '', slug: identifier }))

const SavedListingsToast = ({ notice, onClose, onLogin }: { notice: SavedToast; onClose: () => void; onLogin: () => void }) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, notice.showLogin ? 4200 : 2200)
    return () => window.clearTimeout(timer)
  }, [notice, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 z-[110] flex min-h-12 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 shadow-[0_16px_45px_-20px_rgba(15,23,42,0.45)] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-300">
        <Heart className="size-4 fill-current" aria-hidden="true" />
      </span>
      <span className="min-w-0 grow font-sarabun leading-5">{notice.message}</span>
      {notice.showLogin ? (
        <button type="button" onClick={onLogin} className="shrink-0 font-sarabun font-semibold text-[#176b50] hover:underline">
          เข้าสู่ระบบ
        </button>
      ) : null}
      <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function SavedListingsProvider({ children }: { children: ReactNode }) {
  const { locale } = usePreferences()
  const { status, user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [references, setReferences] = useState<SavedListingReference[]>([])
  const [listings, setListings] = useState<PropertySearchListing[]>([])
  const [busyIdentifiers, setBusyIdentifiers] = useState<Set<string>>(new Set())
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<SavedToast | null>(null)
  const referencesRef = useRef(references)
  const busyRef = useRef(busyIdentifiers)

  const updateReferences = useCallback((next: SavedListingReference[]) => {
    referencesRef.current = next
    setReferences(next)
  }, [])

  const updateBusy = useCallback((next: Set<string>) => {
    busyRef.current = next
    setBusyIdentifiers(next)
  }, [])

  const applyResponse = useCallback(
    (response: SavedListingsResponse) => {
      updateReferences(response.references)
      setListings(response.listings)
      setError('')
      setIsReady(true)
    },
    [updateReferences]
  )

  const refresh = useCallback(async () => {
    if (status !== 'authenticated') {
      const guestIdentifiers = readGuestSavedListings()
      updateReferences(referencesFromGuest(guestIdentifiers))
      setListings([])
      setIsReady(true)
      return
    }
    try {
      applyResponse(await fetchMySavedListings())
    } catch {
      setError(locale === 'th' ? 'โหลดประกาศที่บันทึกไว้ไม่สำเร็จ' : 'Could not load saved listings')
      setIsReady(true)
    }
  }, [applyResponse, locale, status, updateReferences])

  useEffect(() => {
    if (status === 'loading') return
    let cancelled = false

    const load = async () => {
      if (status === 'guest') {
        const guestIdentifiers = readGuestSavedListings()
        if (cancelled) return
        updateReferences(referencesFromGuest(guestIdentifiers))
        setListings([])
        setError('')
        setIsReady(true)
        return
      }

      setIsReady(false)
      const guestIdentifiers = readGuestSavedListings()
      try {
        const response = guestIdentifiers.length
          ? await mergeMySavedListings(guestIdentifiers)
          : await fetchMySavedListings()
        if (cancelled) return
        if (guestIdentifiers.length) writeGuestSavedListings([])
        applyResponse(response)
      } catch {
        if (cancelled) return
        setError(locale === 'th' ? 'โหลดประกาศที่บันทึกไว้ไม่สำเร็จ' : 'Could not load saved listings')
        setIsReady(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [applyResponse, locale, status, updateReferences, user?.public_user_id])

  const isSaved = useCallback(
    (identifier?: string) => Boolean(identifier && references.some((reference) => referenceMatches(reference, identifier))),
    [references]
  )
  const isBusy = useCallback((identifier?: string) => Boolean(identifier && busyIdentifiers.has(identifier)), [busyIdentifiers])

  const toggleSaved = useCallback(
    async (identifier: string) => {
      const cleanedIdentifier = identifier.trim()
      if (!cleanedIdentifier || cleanedIdentifier.includes('/') || cleanedIdentifier.length > 160) return
      if (busyRef.current.has(cleanedIdentifier)) return

      const previousReferences = referencesRef.current
      const wasSaved = previousReferences.some((reference) => referenceMatches(reference, cleanedIdentifier))

      if (status !== 'authenticated') {
        const current = readGuestSavedListings()
        const next = wasSaved ? current.filter((item) => item !== cleanedIdentifier) : [cleanedIdentifier, ...current]
        writeGuestSavedListings(next)
        updateReferences(referencesFromGuest(next))
        setNotice({
          id: Date.now(),
          message: wasSaved
            ? locale === 'th'
              ? 'นำออกจากที่บันทึกไว้แล้ว'
              : 'Removed from saved listings'
            : locale === 'th'
              ? 'บันทึกไว้ในเครื่องนี้แล้ว'
              : 'Saved on this device',
          showLogin: !wasSaved,
        })
        return
      }

      updateBusy(new Set([...busyRef.current, cleanedIdentifier]))
      const previousListings = listings
      if (wasSaved) {
        updateReferences(previousReferences.filter((reference) => !referenceMatches(reference, cleanedIdentifier)))
        setListings((current) =>
          current.filter(
            (listing) => listing.slug !== cleanedIdentifier && listing.public_listing_id !== cleanedIdentifier
          )
        )
      } else {
        updateReferences([{ public_listing_id: '', slug: cleanedIdentifier }, ...previousReferences])
      }

      try {
        if (wasSaved) await unsaveMyListing(cleanedIdentifier)
        else await saveMyListing(cleanedIdentifier)
        applyResponse(await fetchMySavedListings())
        setNotice({
          id: Date.now(),
          message: wasSaved
            ? locale === 'th'
              ? 'นำออกจากที่บันทึกไว้แล้ว'
              : 'Removed from saved listings'
            : locale === 'th'
              ? 'บันทึกประกาศแล้ว'
              : 'Listing saved',
        })
      } catch {
        updateReferences(previousReferences)
        setListings(previousListings)
        setNotice({
          id: Date.now(),
          message: locale === 'th' ? 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Could not update saved listing',
        })
      } finally {
        const nextBusy = new Set(busyRef.current)
        nextBusy.delete(cleanedIdentifier)
        updateBusy(nextBusy)
      }
    },
    [applyResponse, listings, locale, status, updateBusy, updateReferences]
  )

  const value = useMemo(
    () => ({ listings, isReady, error, isSaved, isBusy, refresh, toggleSaved }),
    [error, isBusy, isReady, isSaved, listings, refresh, toggleSaved]
  )

  return (
    <SavedListingsContext.Provider value={value}>
      {children}
      {notice ? (
        <SavedListingsToast
          key={notice.id}
          notice={notice}
          onClose={() => setNotice(null)}
          onLogin={() => {
            setNotice(null)
            openAuthModal({ mode: 'login' })
          }}
        />
      ) : null}
    </SavedListingsContext.Provider>
  )
}

export const useSavedListings = () => {
  const context = useContext(SavedListingsContext)
  if (!context) throw new Error('useSavedListings must be used inside SavedListingsProvider')
  return context
}
