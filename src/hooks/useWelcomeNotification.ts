'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

const WELCOME_NOTIFICATION_EVENT = 'mapxprop-welcome-notification-change'
const STORAGE_PREFIX = 'mapxprop:welcome-notification:v1'

type WelcomeNotificationOptions = {
  isAuthenticated: boolean
  locale: 'th' | 'en'
  userId?: string
}

export const useWelcomeNotification = ({ isAuthenticated, locale, userId }: WelcomeNotificationOptions) => {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${isAuthenticated ? `user:${userId || 'authenticated'}` : 'guest'}`,
    [isAuthenticated, userId]
  )
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleChange = (event: Event) => {
        const changedKey = (event as CustomEvent<string>).detail
        if (changedKey === storageKey) {
          onStoreChange()
        }
      }
      const handleStorage = (event: StorageEvent) => {
        if (event.key === storageKey) {
          onStoreChange()
        }
      }

      window.addEventListener(WELCOME_NOTIFICATION_EVENT, handleChange)
      window.addEventListener('storage', handleStorage)
      return () => {
        window.removeEventListener(WELCOME_NOTIFICATION_EVENT, handleChange)
        window.removeEventListener('storage', handleStorage)
      }
    },
    [storageKey]
  )
  const getSnapshot = useCallback(() => localStorage.getItem(storageKey) !== 'read', [storageKey])
  const getServerSnapshot = useCallback(() => true, [])
  const isUnread = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const markAsRead = useCallback(() => {
    localStorage.setItem(storageKey, 'read')
    window.dispatchEvent(new CustomEvent(WELCOME_NOTIFICATION_EVENT, { detail: storageKey }))
  }, [storageKey])

  const title = isAuthenticated
    ? locale === 'th'
      ? 'ยินดีต้อนรับกลับมา'
      : 'Welcome back'
    : locale === 'th'
      ? 'ยินดีต้อนรับสู่ MapxProp'
      : 'Welcome to MapxProp'
  const detail = isAuthenticated
    ? locale === 'th'
      ? 'ค้นหาหรือจัดการทรัพย์ของคุณได้จากเมนูบัญชี'
      : 'Search or manage your properties from the account menu.'
    : locale === 'th'
      ? 'ค้นหาอสังหาริมทรัพย์ที่ใช่ หรือลงประกาศได้ง่ายในที่เดียว'
      : 'Find the right property or create a listing, all in one place.'

  return {
    detail,
    doneLabel: locale === 'th' ? 'รับทราบ' : 'Done',
    isUnread,
    markAsRead,
    panelLabel: locale === 'th' ? 'การแจ้งเตือน' : 'Notifications',
    sourceLabel: locale === 'th' ? 'ข้อความจาก MapxProp' : 'A message from MapxProp',
    title,
    unreadCount: isUnread ? 1 : 0,
  }
}
