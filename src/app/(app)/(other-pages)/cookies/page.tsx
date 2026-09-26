import LegalPage from '@/components/legal/LegalPage'
import CookieSettingsLink from '@/components/privacy/CookieSettingsLink'
import { cookieSections } from '@/data/legalContent'
import { createPageMetadata } from '@/lib/seo'

const title = 'นโยบายคุกกี้'
const summary = 'เลือกได้ว่าจะให้ใช้คุกกี้วิเคราะห์หรือไม่ บริการหลักยังใช้งานได้เมื่อเลือกเฉพาะที่จำเป็น'
export const metadata = createPageMetadata({ title, description: summary, path: '/cookies' })
export default function Page() {
  return (
    <LegalPage title={title} summary={summary} sections={cookieSections} updated="26 กันยายน 2569">
      <div id="preferences" className="mt-6">
        <CookieSettingsLink className="inline-flex min-h-11 items-center rounded-xl bg-[#176b50] px-5 py-3 text-sm font-semibold text-white hover:bg-[#125640]" />
      </div>
    </LegalPage>
  )
}
