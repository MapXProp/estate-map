import LegalPage from '@/components/legal/LegalPage'
import { termsSections } from '@/data/legalContent'
import { createPageMetadata } from '@/lib/seo'

const title = 'เงื่อนไขการใช้บริการ'
const summary = 'ข้อตกลงสำหรับการค้นหา ลงประกาศ และใช้บริการ MapxProp เพื่อให้ทุกคนใช้งานได้อย่างเข้าใจตรงกัน'
export const metadata = createPageMetadata({ title, description: summary, path: '/terms' })
export default function Page() {
  return <LegalPage title={title} summary={summary} sections={termsSections}></LegalPage>
}
