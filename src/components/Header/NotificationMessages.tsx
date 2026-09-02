'use client'

import type { LocalizedNotification } from '@/hooks/useNotificationCenter'
import { ArrowPathIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

type Props = {
  notifications: LocalizedNotification[]
  isThai: boolean
  loading: boolean
  error: string
  onRead: (notificationId: number) => void
  onNavigate?: () => void
}

const NotificationMessages = ({ notifications, isThai, loading, error, onRead, onNavigate }: Props) => {
  if (loading) {
    return (
      <div className="py-10 text-center font-sarabun text-sm text-neutral-500">
        <ArrowPathIcon className="mx-auto mb-2 size-5 animate-spin" />
        {isThai ? 'กำลังโหลดข้อความ…' : 'Loading messages…'}
      </div>
    )
  }

  if (error && notifications.length === 0) {
    return <p className="py-8 text-center font-sarabun text-sm text-red-600">{error}</p>
  }

  if (notifications.length === 0) {
    return (
      <div className="py-10 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
          <ChatBubbleLeftRightIcon className="size-5" />
        </span>
        <p className="mt-3 font-sarabun text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {isThai ? 'ยังไม่มีข้อความใหม่' : 'No messages yet'}
        </p>
        <p className="mt-1 font-sarabun text-xs text-neutral-500">
          {isThai ? 'สถานะประกาศจะแจ้งให้ทราบที่นี่' : 'Listing updates will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-[min(58vh,34rem)] divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
      {notifications.map((notification) => {
        const unread = !notification.read_at
        const content = (
          <>
            <span
              className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                unread
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              MX
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className="font-sarabun text-sm font-semibold text-neutral-950 dark:text-white">
                  {notification.title}
                </span>
                {unread ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange-500" /> : null}
              </span>
              <span className="mt-1 block font-sarabun text-xs/5 text-neutral-600 dark:text-neutral-300">
                {notification.body}
              </span>
              <span className="mt-2 block font-sarabun text-[11px] text-neutral-400">
                {formatNotificationTime(notification.created_at, isThai)}
              </span>
            </span>
          </>
        )

        return notification.action_url ? (
          <Link
            key={notification.id}
            href={notification.action_url}
            onClick={() => {
              if (unread) onRead(notification.id)
              onNavigate?.()
            }}
            className={`flex gap-3 px-4 py-4 text-start transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60 ${
              unread ? 'bg-orange-50/35 dark:bg-orange-950/10' : 'bg-white dark:bg-neutral-900'
            }`}
          >
            {content}
          </Link>
        ) : (
          <button
            key={notification.id}
            type="button"
            onClick={() => {
              if (unread) onRead(notification.id)
            }}
            className={`flex w-full gap-3 px-4 py-4 text-start transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60 ${
              unread ? 'bg-orange-50/35 dark:bg-orange-950/10' : 'bg-white dark:bg-neutral-900'
            }`}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

const formatNotificationTime = (value: string, isThai: boolean) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default NotificationMessages
