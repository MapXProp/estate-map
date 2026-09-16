type MediaKind = 'image' | 'video' | '360'
type MediaFile = Pick<File, 'name' | 'type' | 'size'>

const imageExtensions: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
}
const videoExtensions: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}
const mimeAliases: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
  'image/x-ms-bmp': 'image/bmp',
  'video/x-m4v': 'video/mp4',
  'video/m4v': 'video/mp4',
}
const accept = (extensions: Record<string, string>) =>
  [...new Set(Object.values(extensions)), ...Object.keys(extensions).map((extension) => `.${extension}`)].join(',')

export const listingImageAccept = accept(imageExtensions)
export const listingVideoAccept = `${accept(videoExtensions)},video/x-m4v`
export const listingImageFormatsLabel = 'JPG, PNG, WebP, AVIF, GIF, BMP'
export const listingVideoFormatsLabel = 'MP4, MOV, WebM, M4V'
export const listingMediaMaxBytes = (kind: MediaKind) => (kind === 'video' ? 50 : kind === '360' ? 15 : 8) * 1024 * 1024

export function listingMediaMimeType(file: MediaFile, kind: MediaKind): string {
  const extensions = kind === 'video' ? videoExtensions : imageExtensions
  const declared = file.type.toLowerCase().split(';')[0].trim()
  const mime = mimeAliases[declared] || declared
  if (Object.values(extensions).includes(mime)) return mime
  // Some phone/file pickers provide no MIME type. The decoder/server still validates actual bytes.
  if (!mime || mime === 'application/octet-stream') {
    const extension = file.name.match(/\.([^.]+)$/)?.[1].toLowerCase() || ''
    return Object.hasOwn(extensions, extension) ? extensions[extension] : ''
  }
  return ''
}

export function listingMediaFileIssue(file: MediaFile, kind: MediaKind) {
  if (!listingMediaMimeType(file, kind)) return 'unsupported_format'
  if (file.size <= 0 || file.size > listingMediaMaxBytes(kind)) return 'file_too_large'
  return null
}
