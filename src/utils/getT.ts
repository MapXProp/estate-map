import { en } from '../../public/locales/en'
import { th } from '../../public/locales/th'

const getLocale = (): string => {
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'))
    // ตรวจสอบว่าต้องเป็น en หรือ th เท่านั้น
    if (match && (match[2] === 'en' || match[2] === 'th')) {
      return match[2]
    }
  }
  // บังคับให้เป็นภาษาไทย ('th') เมื่อเข้าเว็บครั้งแรก
  return 'th'
}

const locale = getLocale()

// ใช้ spread operator เพื่อให้ภาษาอังกฤษเป็นค่าเริ่มต้น (Fallback) 
// หากไฟล์ th.ts ขาด Key ไหนไป จะได้ไม่เกิด Error undefined
const T = locale === 'en' ? en : { ...en, ...th }

export default T
