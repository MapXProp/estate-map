import LegalPage from '@/components/legal/LegalPage'
import { privacySections } from '@/data/legalContent'
import { createPageMetadata } from '@/lib/seo'

const title = 'นโยบายความเป็นส่วนตัว'
const summary =
  'เราใช้ข้อมูลเพื่อให้คุณค้นหา ลงประกาศ และติดต่อได้สะดวก พร้อมอธิบายว่าข้อมูลใดถูกใช้ เปิดเผย และจัดการได้อย่างไร'
export const metadata = createPageMetadata({ title, description: summary, path: '/privacy' })
export default function Page() {
  return <LegalPage title={title} summary={summary} sections={privacySections} updated="26 กันยายน 2569"></LegalPage>
}
