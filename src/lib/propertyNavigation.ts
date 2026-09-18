export const isOrganizationPath = (pathname: string) =>
  pathname === '/organizations' || pathname.startsWith('/organizations/')

export const isTransitDirectoryPath = (pathname: string) =>
  pathname === '/all-transits' || pathname === '/all-transits/'

export const usesMobilePrimaryNavigation = (pathname: string) =>
  ['/homes', '/rooms', '/business'].includes(pathname) ||
  isOrganizationPath(pathname) ||
  isTransitDirectoryPath(pathname)
