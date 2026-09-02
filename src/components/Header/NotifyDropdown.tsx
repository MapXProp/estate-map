'use client'

import NotificationMessages from '@/components/Header/NotificationMessages'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationCenter } from '@/hooks/useNotificationCenter'
import { CloseButton, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { FC } from 'react'

interface Props {
  className?: string
}

const NotifyDropdown: FC<Props> = ({ className = '' }) => {
  const { isAuthenticated } = useAuth()
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const notificationCenter = useNotificationCenter({ isAuthenticated, locale })

  return (
    <Popover className={className}>
      <PopoverButton className="relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-hidden dark:hover:bg-neutral-800">
        {notificationCenter.isUnread ? (
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-neutral-900" />
        ) : null}
        <BellIcon className="h-6 w-6" />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom end', gap: 16 }}
        className="z-40 w-sm max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 transition duration-200 ease-in-out data-closed:translate-y-1 data-closed:opacity-0 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h3 className="font-sarabun text-lg font-semibold">{notificationCenter.panelLabel}</h3>
            <p className="mt-0.5 font-sarabun text-xs text-neutral-500">{notificationCenter.unreadSummary}</p>
          </div>
          {notificationCenter.unreadCount > 0 ? (
            <span className="grid min-w-7 place-items-center rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
              {notificationCenter.unreadCount}
            </span>
          ) : null}
        </div>

        <NotificationMessages
          notifications={notificationCenter.notifications}
          isThai={isThai}
          loading={notificationCenter.loading}
          error={notificationCenter.error}
          onRead={(id) => void notificationCenter.markAsRead(id)}
        />

        {notificationCenter.unreadCount > 0 ? (
          <div className="border-t border-neutral-100 p-3 dark:border-neutral-800">
            <CloseButton
              as="button"
              type="button"
              onClick={() => void notificationCenter.markAllAsRead()}
              className="min-h-10 w-full rounded-full bg-neutral-900 px-4 font-sarabun text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              {isThai ? 'อ่านทั้งหมดแล้ว' : 'Mark all as read'}
            </CloseButton>
          </div>
        ) : null}
      </PopoverPanel>
    </Popover>
  )
}

export default NotifyDropdown
