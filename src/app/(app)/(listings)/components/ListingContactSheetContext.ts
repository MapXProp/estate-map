'use client'

import { createContext } from 'react'

export const ListingContactSheetContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)
