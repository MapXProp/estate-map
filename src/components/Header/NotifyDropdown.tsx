'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { useWelcomeNotification } from '@/hooks/useWelcomeNotification'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { FC } from 'react'

interface Props {
  className?: string
}

const NotifyDropdown: FC<Props> = ({ className = '' }) => {
  const { isAuthenticated, user } = useAuth()
  const { locale } = usePreferences()
  const welcomeNotification = useWelcomeNotification({
    isAuthenticated,
    locale,
    userId: user?.public_user_id || user?.email,
  })

  return (
    <Popover className={className}>
      <>
        <PopoverButton
          className={
            'relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800'
          }
        >
          {welcomeNotification.isUnread && (
            <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-neutral-900" />
          )}
          <BellIcon className="h-6 w-6" />
        </PopoverButton>

        <PopoverPanel
          transition
          anchor={{
            to: 'bottom end',
            gap: 16,
          }}
          className="z-40 w-sm max-w-[calc(100vw-1rem)] rounded-3xl shadow-lg ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0"
        >
          <div className="relative bg-white p-6 dark:bg-neutral-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{welcomeNotification.panelLabel}</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {welcomeNotification.unreadSummary}
                </p>
              </div>
              {welcomeNotification.unreadCount > 0 && (
                <span className="grid min-w-7 place-items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                  {welcomeNotification.unreadCount}
                </span>
              )}
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl bg-blue-50/70 px-4 py-4 dark:bg-blue-950/25">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                <BellIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {welcomeNotification.title}
                </span>
                <span className="mt-1 block text-xs/5 text-neutral-600 dark:text-neutral-400">
                  {welcomeNotification.detail}
                </span>
              </span>
              {welcomeNotification.isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />}
            </div>

            <CloseButton
              as="button"
              type="button"
              onClick={welcomeNotification.markAsRead}
              className="mt-5 min-h-11 w-full rounded-full bg-[#124e3c] px-4 text-sm font-semibold text-white transition hover:bg-[#0d3d2f] focus-visible:ring-3 focus-visible:ring-[#176b50]/30 focus-visible:outline-hidden"
            >
              {welcomeNotification.doneLabel}
            </CloseButton>
          </div>
        </PopoverPanel>
      </>
    </Popover>
  )
}

export default NotifyDropdown
