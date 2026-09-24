export const OPEN_MOBILE_PROPERTY_SEARCH_EVENT = 'mapx:open-mobile-property-search'

export const isBlogPath = (pathname: string) => pathname === '/blog' || pathname.startsWith('/blog/')

export const isOrganizationPath = (pathname: string) =>
  pathname === '/organizations' || pathname.startsWith('/organizations/')

export const isTransitDirectoryPath = (pathname: string) =>
  pathname === '/all-transits' || pathname === '/all-transits/'

export const usesMobilePrimaryNavigation = (pathname: string) =>
  ['/homes', '/rooms', '/business'].includes(pathname) ||
  pathname === '/account' ||
  pathname.startsWith('/account-') ||
  isOrganizationPath(pathname) ||
  isTransitDirectoryPath(pathname)

// These pages contain public discovery tools or device-local saved listings.
// All other account routes still go through RequireAuth.
export const isPublicAccountPage = (pathname: string) => pathname === '/account' || pathname === '/account-savelists'
