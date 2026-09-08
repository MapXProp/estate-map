const PHOTO_URL_TOKEN_PREFIX = 'url:'
const PHOTO_FILE_TOKEN_PREFIX = 'file:'

export const listingPhotoFileIdentity = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

export const listingPhotoURLToken = (url: string) => `${PHOTO_URL_TOKEN_PREFIX}${url}`

export const listingPhotoFileToken = (file: File) =>
  `${PHOTO_FILE_TOKEN_PREFIX}${listingPhotoFileIdentity(file)}`

export const listingPhotoURLFromToken = (token: string) =>
  token.startsWith(PHOTO_URL_TOKEN_PREFIX) ? token.slice(PHOTO_URL_TOKEN_PREFIX.length) : ''

export const normalizeListingPhotoOrder = (order: string[], urls: string[], files: File[]) => {
  const availableTokens = [
    ...urls.filter(Boolean).map(listingPhotoURLToken),
    ...files.map(listingPhotoFileToken),
  ]
  const available = new Set(availableTokens)
  const seen = new Set<string>()
  const normalized = order.filter((token) => {
    if (!available.has(token) || seen.has(token)) return false
    seen.add(token)
    return true
  })

  availableTokens.forEach((token) => {
    if (seen.has(token)) return
    seen.add(token)
    normalized.push(token)
  })

  return normalized
}

export const listingPhotoURLsFromOrder = (order: string[]) => {
  const seen = new Set<string>()
  return order.flatMap((token) => {
    const url = listingPhotoURLFromToken(token)
    if (!url || seen.has(url)) return []
    seen.add(url)
    return [url]
  })
}

export const replaceListingPhotoFileWithURL = (order: string[], file: File, url: string) => {
  const fileToken = listingPhotoFileToken(file)
  const urlToken = listingPhotoURLToken(url)
  let replaced = false
  const next = order.map((token) => {
    if (token !== fileToken) return token
    replaced = true
    return urlToken
  })

  return replaced ? next : [...next, urlToken]
}

export const moveListingPhoto = (order: string[], fromIndex: number, toIndex: number) => {
  if (
    fromIndex < 0 ||
    fromIndex >= order.length ||
    toIndex < 0 ||
    toIndex >= order.length ||
    fromIndex === toIndex
  ) {
    return order
  }

  const next = [...order]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
