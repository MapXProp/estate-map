export const PROPERTY_ZONE_COOKIE = 'MAPX_PROPERTY_ZONE'
export const PROPERTY_ZONE_STORAGE_KEY = 'mapxprop_property_zone'

export type PropertyZone = 'homes' | 'rooms' | 'business'

export const isPropertyZone = (value: unknown): value is PropertyZone =>
  value === 'homes' || value === 'rooms' || value === 'business'

export const getPropertyZoneFromPathname = (pathname: string): PropertyZone | null => {
  if (pathname === '/rooms' || pathname.startsWith('/rooms/') || pathname === '/rent' || pathname.startsWith('/rent/')) {
    return 'rooms'
  }

  if (pathname === '/business' || pathname.startsWith('/business/')) return 'business'

  if (
    pathname === '/homes' ||
    pathname.startsWith('/homes/') ||
    pathname === '/buy' ||
    pathname.startsWith('/buy/')
  ) {
    return 'homes'
  }

  return null
}
