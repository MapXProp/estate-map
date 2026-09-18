export const isOrganizationPath = (pathname: string) =>
  pathname === '/organizations' || pathname.startsWith('/organizations/')

export const usesMobilePrimaryNavigation = (pathname: string) =>
  ['/homes', '/rooms', '/business'].includes(pathname) || isOrganizationPath(pathname)
