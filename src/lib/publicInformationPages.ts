export const PUBLIC_INFORMATION_UPDATED_AT = '2026-09-25'
export const publicInformationPaths = ['/privacy', '/terms', '/cookies', '/listing-plans'] as const
export const isPublicInformationPath = (path: string) =>
  publicInformationPaths.some((item) => path === item || path === `${item}/`)
