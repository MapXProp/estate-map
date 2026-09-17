'use client'

import { PopoverBackdrop, Portal } from '@headlessui/react'

const TopNavPopoverBackdrop = () => (
  // Escape the mobile header's transform and cover the desktop header's stacking context.
  <Portal>
    <PopoverBackdrop
      transition
      data-top-nav-backdrop
      className="fixed inset-0 z-[60] bg-[rgba(15,23,42,0.10)] transition-opacity duration-150 ease-out min-[744px]:bg-[rgba(15,23,42,0.12)] dark:bg-black/30 min-[744px]:dark:bg-black/35 data-closed:opacity-0"
    />
  </Portal>
)

export default TopNavPopoverBackdrop
