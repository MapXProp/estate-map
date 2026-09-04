'use client'

import { PopoverBackdrop } from '@headlessui/react'

const TopNavPopoverBackdrop = () => (
  <PopoverBackdrop
    transition
    className="fixed inset-x-0 top-16 bottom-0 z-30 bg-[rgba(15,23,42,0.12)] transition-opacity duration-150 ease-out min-[744px]:top-20 dark:bg-black/35 data-closed:opacity-0"
  />
)

export default TopNavPopoverBackdrop
