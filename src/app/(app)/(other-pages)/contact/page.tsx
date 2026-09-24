import JsonLd from '@/components/seo/JsonLd'
import { absoluteUrl, createPageMetadata } from '@/lib/seo'
import ContactPageContent from './ContactPageContent'

const pageInfo = {
  title: 'ติดต่อ MapxProp และสอบถามการลงประกาศ',
  description:
    'ติดต่อทีมงาน MapxProp เพื่อสอบถามการใช้งาน การค้นหาอสังหาริมทรัพย์ การลงประกาศ หรือแจ้งปัญหา ผ่านโทรศัพท์ อีเมล LINE และโซเชียลมีเดีย',
  path: '/contact',
  keywords: ['ติดต่อ MapxProp', 'สอบถามลงประกาศอสังหาริมทรัพย์', 'ช่วยเหลือ MapxProp'],
}
export const metadata = createPageMetadata(pageInfo)

type ContactSearchParams = Promise<{ topic?: string | string[] }>

const PageContact = async ({ searchParams }: { searchParams: ContactSearchParams }) => {
  const params = await searchParams
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          '@id': absoluteUrl('/contact#webpage'),
          url: absoluteUrl(pageInfo.path),
          name: pageInfo.title,
          description: pageInfo.description,
          inLanguage: 'th-TH',
          isPartOf: { '@id': absoluteUrl('/#website') },
          mainEntity: { '@id': absoluteUrl('/#organization') },
        }}
      />
      <ContactPageContent initialTopic={topic} />
    </>
  )
}

export default PageContact
