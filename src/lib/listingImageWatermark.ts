const MAX_IMAGE_EDGE = 3840
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

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

const drawRoundedRectangle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
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
    const barHeight = Math.max(34, Math.min(138, Math.round(shortEdge * 0.105)))
    const horizontalMargin = Math.max(12, Math.round(width * 0.055))
    const bottomMargin = Math.max(12, Math.round(height * 0.045))
    const barX = horizontalMargin
    const barY = height - bottomMargin - barHeight
    const barWidth = width - horizontalMargin * 2
    const cornerRadius = Math.max(8, Math.round(barHeight * 0.22))

    const overlay = context.createLinearGradient(barX, barY, barX + barWidth, barY)
    overlay.addColorStop(0, 'rgba(5, 45, 36, 0.76)')
    overlay.addColorStop(1, 'rgba(9, 66, 52, 0.68)')
    context.fillStyle = overlay
    drawRoundedRectangle(context, barX, barY, barWidth, barHeight, cornerRadius)
    context.fill()

    const innerPadding = Math.max(12, Math.round(barHeight * 0.24))
    const logo = await loadBrandLogo()
    const logoHeight = Math.max(14, Math.round(barHeight * 0.34))
    const logoWidth = logo ? Math.round(logoHeight * (logo.naturalWidth / logo.naturalHeight)) : 0
    const logoX = barX + barWidth - innerPadding - logoWidth
    const logoY = barY + (barHeight - logoHeight) / 2

    if (logo) {
      context.globalAlpha = 0.96
      context.drawImage(logo, logoX, logoY, logoWidth, logoHeight)
      context.globalAlpha = 1
    }

    const fontSize = Math.max(12, Math.round(barHeight * 0.29))
    const sarabunFont = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-sarabun-next')
      .trim()
    const fontFamily = sarabunFont || 'Sarabun'
    if (document.fonts) {
      await document.fonts.load(`600 ${fontSize}px ${fontFamily}`).catch(() => undefined)
    }
    context.font = `600 ${fontSize}px ${fontFamily}, "Noto Sans Thai", Tahoma, sans-serif`
    context.fillStyle = 'rgba(255, 255, 255, 0.96)'
    context.textBaseline = 'middle'
    const textX = barX + innerPadding
    const textRight = logo ? logoX - innerPadding : barX + barWidth - innerPadding
    const displayName = truncateText(context, publisherName, Math.max(0, textRight - textX))
    context.fillText(displayName, textX, barY + barHeight / 2)

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
