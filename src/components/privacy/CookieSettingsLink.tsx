'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { COOKIE_SETTINGS_EVENT } from '@/lib/analyticsConsent'

export default function CookieSettingsLink({ className = '' }: { className?: string }) {
  const { locale } = usePreferences()
  return (
    <a
      href="/cookies#preferences"
      className={className}
      onClick={(event) => {
        event.preventDefault()
        window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
      }}
    >
      {locale === 'th' ? 'ตั้งค่าคุกกี้' : 'Cookie settings'}
    </a>
  )
}
