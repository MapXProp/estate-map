import { createPageMetadata } from '@/lib/seo'
import ContactPageContent from './ContactPageContent'

export const metadata = createPageMetadata({
  title: 'ติดต่อ MapxProp และสอบถามการลงประกาศ',
  description:
    'ติดต่อทีมงาน MapxProp เพื่อสอบถามการใช้งาน การค้นหาอสังหาริมทรัพย์ การลงประกาศ หรือแจ้งปัญหา ผ่านโทรศัพท์ อีเมล LINE และโซเชียลมีเดีย',
  path: '/contact',
  keywords: ['ติดต่อ MapxProp', 'สอบถามลงประกาศอสังหาริมทรัพย์', 'ช่วยเหลือ MapxProp'],
})

type ContactSearchParams = Promise<{ topic?: string | string[] }>

const PageContact = async ({ searchParams }: { searchParams: ContactSearchParams }) => {
  const params = await searchParams
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic

  return <ContactPageContent initialTopic={topic} />
}

export default PageContact
