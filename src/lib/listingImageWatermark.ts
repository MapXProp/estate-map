const MAX_IMAGE_EDGE = 3840
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const PUBLISHER_WATERMARK_OPACITY = 0.5
const BRAND_WATERMARK_OPACITY = 0.68
const WATERMARK_COLOR = 'rgb(243, 244, 246)'
const WATERMARK_DOMAIN = 'mapxprop.com'
const WATERMARK_FONT_FAMILY = 'Arial, "Noto Sans Thai", Tahoma, sans-serif'

type LoadedImage = {
  source: CanvasImageSource
  width: number
  height: number
  release: () => void
}

let brandLogoPromise: Promise<HTMLImageElement | null> | null = null

const loadBrandLogo = () => {
  if (brandLogoPromise) return brandLogoPromise

  brandLogoPromise = new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = '/M5-dark-small.webp'
  })

  return brandLogoPromise
}

const loadImage = async (file: File): Promise<LoadedImage> => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      }
    } catch {
      // Older mobile browsers can expose createImageBitmap without supporting
      // image-orientation options. The regular image decoder below is safer.
    }
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectUrl
  await image.decode()

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(objectUrl),
  }
}

const truncateText = (context: CanvasRenderingContext2D, value: string, maxWidth: number) => {
  if (context.measureText(value).width <= maxWidth) return value

  const characters = Array.from(value)
  let lower = 0
  let upper = characters.length
  while (lower < upper) {
    const middle = Math.ceil((lower + upper) / 2)
    const candidate = `${characters.slice(0, middle).join('')}…`
    if (context.measureText(candidate).width <= maxWidth) lower = middle
    else upper = middle - 1
  }

  return lower > 0 ? `${characters.slice(0, lower).join('')}…` : ''
}

const drawCenteredText = (
  context: CanvasRenderingContext2D,
  value: string,
  centerX: number,
  top: number,
  maxWidth: number
) => {
  const displayValue = truncateText(context, value, maxWidth)
  context.textAlign = 'center'
  context.textBaseline = 'top'
  context.fillText(displayValue, centerX, top)
}

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Cannot create watermarked image'))),
      mimeType,
      quality
    )
  })

const encodeWatermarkedImage = async (canvas: HTMLCanvasElement, preferredType: string) => {
  const normalizedType = ['image/jpeg', 'image/png', 'image/webp'].includes(preferredType)
    ? preferredType
    : 'image/jpeg'
  let blob = await canvasToBlob(canvas, normalizedType, normalizedType === 'image/png' ? undefined : 0.92)

  if (blob.size <= MAX_UPLOAD_BYTES) return blob

  blob = await canvasToBlob(canvas, 'image/webp', 0.88)
  if (blob.size <= MAX_UPLOAD_BYTES) return blob

  return canvasToBlob(canvas, 'image/jpeg', 0.86)
}

const extensionForMimeType = (mimeType: string) => {
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  return '.jpg'
}

const watermarkedFileName = (fileName: string, mimeType: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'listing-photo'
  return `${baseName}-mapxprop${extensionForMimeType(mimeType)}`
}

export const applyListingImageWatermark = async (file: File, rawPublisherName: string) => {
  const publisherName = rawPublisherName.trim().replace(/\s+/g, ' ') || 'ผู้ลงประกาศ'
  const loadedImage = await loadImage(file)

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(loadedImage.width, loadedImage.height))
    const width = Math.max(1, Math.round(loadedImage.width * scale))
    const height = Math.max(1, Math.round(loadedImage.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Cannot prepare image watermark')

    context.drawImage(loadedImage.source, 0, 0, width, height)

    const shortEdge = Math.min(width, height)
    const logo = await loadBrandLogo()
    const publisherFontSize = Math.max(10, Math.round(shortEdge * 0.028))
    const domainFontSize = Math.max(9, Math.round(shortEdge * 0.024))

    context.save()
    context.fillStyle = WATERMARK_COLOR

    // Publisher mark: centered in the upper-left area, matching the supplied reference.
    context.globalAlpha = PUBLISHER_WATERMARK_OPACITY
    const publisherCenterX = width * 0.275
    const publisherTop = height * 0.238
    const publisherLogoWidth = Math.max(64, Math.round(shortEdge * 0.158))
    const publisherLogoHeight = logo ? Math.round(publisherLogoWidth * (logo.naturalHeight / logo.naturalWidth)) : 0
    const publisherLogoTop = publisherTop + publisherFontSize + shortEdge * 0.002

    context.font = `400 ${publisherFontSize}px ${WATERMARK_FONT_FAMILY}`
    drawCenteredText(
      context,
      publisherName,
      publisherCenterX,
      publisherTop,
      Math.min(width * 0.36, publisherLogoWidth * 1.65)
    )
    if (logo) {
      context.drawImage(
        logo,
        publisherCenterX - publisherLogoWidth / 2,
        publisherLogoTop,
        publisherLogoWidth,
        publisherLogoHeight
      )
    }

    // Brand mark: larger logo with the website address in the lower-right corner.
    context.globalAlpha = BRAND_WATERMARK_OPACITY
    const brandRight = width * 0.06
    const brandBottom = height * 0.066
    const brandLogoWidth = Math.max(88, Math.round(shortEdge * 0.223))
    const brandLogoHeight = logo ? Math.round(brandLogoWidth * (logo.naturalHeight / logo.naturalWidth)) : 0
    const brandGap = Math.max(3, Math.round(shortEdge * 0.009))
    const brandGroupHeight = brandLogoHeight + brandGap + domainFontSize
    const brandLeft = width - brandRight - brandLogoWidth
    const brandTop = height - brandBottom - brandGroupHeight
    const brandCenterX = brandLeft + brandLogoWidth / 2

    if (logo) {
      context.drawImage(logo, brandLeft, brandTop, brandLogoWidth, brandLogoHeight)
    }
    context.font = `400 ${domainFontSize}px ${WATERMARK_FONT_FAMILY}`
    drawCenteredText(context, WATERMARK_DOMAIN, brandCenterX, brandTop + brandLogoHeight + brandGap, brandLogoWidth)
    context.restore()

    const blob = await encodeWatermarkedImage(canvas, file.type.toLowerCase())
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error('Watermarked image is too large')

    return new File([blob], watermarkedFileName(file.name, blob.type), {
      type: blob.type,
      lastModified: file.lastModified,
    })
  } finally {
    loadedImage.release()
  }
}
