'use client'

import type { AuthMode, AuthPurpose } from '@/lib/authForm'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useId, useState } from 'react'
import AuthCard from './AuthCard'
export type { AuthMode, AuthPurpose } from '@/lib/authForm'

type Props = {
  open: boolean
  onClose: () => void
  onAuthenticated: (mode: AuthMode) => void | Promise<void>
  initialMode?: AuthMode
  purpose?: AuthPurpose
  redirectPath?: string
}

export default function AuthModal({
  open,
  onClose,
  onAuthenticated,
  initialMode = 'login',
  purpose = 'default',
  redirectPath,
}: Props) {
  const [busy, setBusy] = useState(false)
  const titleId = useId()
  const close = () => {
    if (!busy) onClose()
  }
  return (
    <Dialog open={open} onClose={close} aria-labelledby={titleId} className="relative z-[100]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[3px] transition duration-200 motion-reduce:transition-none data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            transition
            className="w-full max-w-[460px] transition duration-200 motion-reduce:transform-none motion-reduce:transition-none data-closed:translate-y-3 data-closed:opacity-0"
          >
            <AuthCard
              initialMode={initialMode}
              purpose={purpose}
              redirectPath={redirectPath}
              titleId={titleId}
              onClose={close}
              onBusyChange={setBusy}
              onAuthenticated={onAuthenticated}
            />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
