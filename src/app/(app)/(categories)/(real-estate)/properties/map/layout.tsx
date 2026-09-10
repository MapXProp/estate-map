import { ReactNode } from 'react'

const Layout = async ({ children, modal }: { children: ReactNode; modal: ReactNode }) => {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white dark:bg-neutral-900">
      {children}
      {modal}
    </div>
  )
}

export default Layout
