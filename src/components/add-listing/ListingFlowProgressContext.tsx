'use client'

import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

export type ListingMediaProgressPhase = 'idle' | 'uploading' | 'saving' | 'error'

export type ListingMediaProgressState = {
  phase: ListingMediaProgressPhase
  pendingCount: number
  uploadedCount: number
  completedCount: number
  totalCount: number
  currentFileName: string
}

export type ListingPendingMedia = {
  photos: File[]
  videos: File[]
  panoramas: File[]
}

export const initialListingMediaProgress: ListingMediaProgressState = {
  phase: 'idle',
  pendingCount: 0,
  uploadedCount: 0,
  completedCount: 0,
  totalCount: 0,
  currentFileName: '',
}

export const initialListingPendingMedia: ListingPendingMedia = {
  photos: [],
  videos: [],
  panoramas: [],
}

type ListingFlowProgressValue = {
  mediaProgress: ListingMediaProgressState
  setMediaProgress: Dispatch<SetStateAction<ListingMediaProgressState>>
  pendingMedia: ListingPendingMedia
  setPendingMedia: Dispatch<SetStateAction<ListingPendingMedia>>
  submittingStep: number | null
  setSubmittingStep: Dispatch<SetStateAction<number | null>>
}

const ListingFlowProgressContext = createContext<ListingFlowProgressValue | null>(null)

export const ListingFlowProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const [mediaProgress, setMediaProgress] = useState(initialListingMediaProgress)
  const [pendingMedia, setPendingMedia] = useState(initialListingPendingMedia)
  const [submittingStep, setSubmittingStep] = useState<number | null>(null)
  const value = useMemo(
    () => ({ mediaProgress, setMediaProgress, pendingMedia, setPendingMedia, submittingStep, setSubmittingStep }),
    [mediaProgress, pendingMedia, submittingStep]
  )

  return <ListingFlowProgressContext.Provider value={value}>{children}</ListingFlowProgressContext.Provider>
}

export const useListingFlowProgress = () => {
  const context = useContext(ListingFlowProgressContext)
  if (!context) throw new Error('useListingFlowProgress must be used inside ListingFlowProgressProvider')
  return context
}
