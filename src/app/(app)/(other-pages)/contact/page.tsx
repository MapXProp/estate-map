import ContactPageContent from './ContactPageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ติดต่อเรา | MapxProp',
  description: 'ติดต่อทีมงาน MapxProp ทางโทรศัพท์ อีเมล LINE และโซเชียลมีเดีย',
}

type ContactSearchParams = Promise<{ topic?: string | string[] }>

const PageContact = async ({ searchParams }: { searchParams: ContactSearchParams }) => {
  const params = await searchParams
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic

  return <ContactPageContent initialTopic={topic} />
}

export default PageContact
