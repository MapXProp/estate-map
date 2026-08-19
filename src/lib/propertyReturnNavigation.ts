export const PROPERTY_RETURN_LOCATION_KEY = 'mapxprop:return-to-results'
const RETURN_LOCATION_MAX_AGE = 30 * 60 * 1000

type StoredReturnLocation = {
  href?: string
  savedAt?: number
}

export const rememberPropertyResultsLocation = (href: string) => {
  const value = JSON.stringify({ href, savedAt: Date.now() })
  sessionStorage.setItem(PROPERTY_RETURN_LOCATION_KEY, value)
  localStorage.setItem(PROPERTY_RETURN_LOCATION_KEY, value)
}

export const getPropertyResultsLocation = () => {
  const storedValue = sessionStorage.getItem(PROPERTY_RETURN_LOCATION_KEY) || localStorage.getItem(PROPERTY_RETURN_LOCATION_KEY)
  if (!storedValue) return null

  try {
    const savedLocation = JSON.parse(storedValue) as StoredReturnLocation
    if (!savedLocation.href || !savedLocation.savedAt || Date.now() - savedLocation.savedAt >= RETURN_LOCATION_MAX_AGE) {
      return null
    }

    const destination = new URL(savedLocation.href, window.location.origin)
    if (destination.origin !== window.location.origin) return null
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return null
  }
}

export const clearPropertyResultsLocation = () => {
  sessionStorage.removeItem(PROPERTY_RETURN_LOCATION_KEY)
  localStorage.removeItem(PROPERTY_RETURN_LOCATION_KEY)
}

export const closePropertyTabOrReturn = () => {
  const returnHref = getPropertyResultsLocation() || '/properties/map'
  clearPropertyResultsLocation()

  window.close()
  window.setTimeout(() => window.location.replace(returnHref), 180)
}
