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

export const initialListingMediaProgress: ListingMediaProgressState = {
  phase: 'idle',
  pendingCount: 0,
  uploadedCount: 0,
  completedCount: 0,
  totalCount: 0,
  currentFileName: '',
}

type ListingFlowProgressValue = {
  mediaProgress: ListingMediaProgressState
  setMediaProgress: Dispatch<SetStateAction<ListingMediaProgressState>>
}

const ListingFlowProgressContext = createContext<ListingFlowProgressValue | null>(null)

export const ListingFlowProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const [mediaProgress, setMediaProgress] = useState(initialListingMediaProgress)
  const value = useMemo(() => ({ mediaProgress, setMediaProgress }), [mediaProgress])

  return <ListingFlowProgressContext.Provider value={value}>{children}</ListingFlowProgressContext.Provider>
}

export const useListingFlowProgress = () => {
  const context = useContext(ListingFlowProgressContext)
  if (!context) throw new Error('useListingFlowProgress must be used inside ListingFlowProgressProvider')
  return context
}
