'use client'

import AuthModal, { type AuthMode, type AuthPurpose } from '@/components/auth/AuthModal'
import AuthStatusToast from '@/components/auth/AuthStatusToast'
import { showAuthNotice } from '@/lib/authNotice'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type OpenAuthOptions = {
  mode?: AuthMode
  purpose?: AuthPurpose
  redirectPath?: string
  onAuthenticated?: () => void | Promise<void>
}

type ModalState = Required<Pick<OpenAuthOptions, 'mode' | 'purpose'>> & Omit<OpenAuthOptions, 'mode' | 'purpose'>

type AuthModalContextValue = {
  openAuthModal: (options?: OpenAuthOptions) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState | null>(null)

  const openAuthModal = useCallback((options: OpenAuthOptions = {}) => {
    setModal({
      mode: options.mode ?? 'login',
      purpose: options.purpose ?? 'default',
      redirectPath: options.redirectPath,
      onAuthenticated: options.onAuthenticated,
    })
  }, [])

  const closeAuthModal = useCallback(() => setModal(null), [])
  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [closeAuthModal, openAuthModal])

  const handleAuthenticated = async () => {
    const completedModal = modal
    setModal(null)
    await completedModal?.onAuthenticated?.()
    showAuthNotice(completedModal?.mode === 'signup' ? 'signup' : 'login')
    router.refresh()
  }

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        key={`${modal?.mode ?? 'login'}:${modal?.purpose ?? 'default'}:${modal?.redirectPath ?? ''}`}
        open={Boolean(modal)}
        initialMode={modal?.mode}
        purpose={modal?.purpose}
        redirectPath={modal?.redirectPath}
        onClose={closeAuthModal}
        onAuthenticated={handleAuthenticated}
      />
      <AuthStatusToast />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used inside AuthModalProvider')
  return context
}
