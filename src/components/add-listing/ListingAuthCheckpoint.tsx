'use client'

import AuthModal from '@/components/auth/AuthModal'

type Props = {
  open: boolean
  onClose: () => void
  onAuthenticated: () => void
}

export default function ListingAuthCheckpoint({ open, onClose, onAuthenticated }: Props) {
  return (
    <AuthModal
      open={open}
      onClose={onClose}
      onAuthenticated={onAuthenticated}
      initialMode="login"
      purpose="listing"
      redirectPath="/add-listing/2"
    />
  )
}
