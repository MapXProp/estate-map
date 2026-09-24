'use client'

import { useEffect, useState } from 'react'

/** Keep restored dialog focus without painting a keyboard ring after a touch gesture. */
export function useKeyboardFocus() {
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) setKeyboardFocus(true)
    }
    const pointer = () => setKeyboardFocus(false)
    window.addEventListener('keydown', keyboard, true)
    window.addEventListener('pointerdown', pointer, true)
    window.addEventListener('touchstart', pointer, { capture: true, passive: true })
    return () => {
      window.removeEventListener('keydown', keyboard, true)
      window.removeEventListener('pointerdown', pointer, true)
      window.removeEventListener('touchstart', pointer, true)
    }
  }, [])
  return keyboardFocus
}
