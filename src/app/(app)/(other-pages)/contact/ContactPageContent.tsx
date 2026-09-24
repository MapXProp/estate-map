'use client'

import SocialMediaLinks from '@/components/SocialMediaLinks'
import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { ArrowRight, ArrowUpRight, ChevronDown, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import Image from 'next/image'
import type { FormEvent } from 'react'
import styles from './ContactPage.module.css'

const contactEmail = 'mapxprop@gmail.com'
const contactPhone = '094-517-4626'
const lineUrl = 'https://line.me/ti/p/~mapxprop'
const photoUrl = 'https://unsplash.com/photos/modern-cafe-interior-with-tables-chairs-and-plants-IXzM29iGAz8'
const mapUrl =
  'https://www.google.com/maps/search/?api=1&query=8%20Somkij%20Building%2C%20Vibhavadi%20Rangsit%20Road%2C%20Chomphon%2C%20Chatuchak%2C%20Bangkok%2010900'

const topicOptions = [
  { value: 'general', labelTh: 'สอบถามทั่วไป', labelEn: 'General enquiry' },
  { value: 'listing', labelTh: 'สอบถามการลงประกาศ', labelEn: 'Listing support' },
  { value: 'report-listing', labelTh: 'แจ้งประกาศไม่ถูกต้อง', labelEn: 'Report an incorrect listing' },
  { value: 'partnership', labelTh: 'ร่วมงานกับ MapxProp', labelEn: 'Partner with MapxProp' },
] as const

const contactCopy = {
  th: {
    eyebrow: 'ติดต่อ MapxProp',
    title: 'มีคำถาม?',
    titleSecond: 'คุยกับเราได้เลย',
    description: 'เรื่องลงประกาศ การใช้งาน หรือร่วมงานกับเรา',
    hello: 'สวัสดีครับ',
    greeting: 'ให้เราช่วยอะไรดี?',
    photo: 'มุมนั่งคุยริมหน้าต่าง โต๊ะไม้และต้นไม้ในแสงธรรมชาติ',
    photoCredit: 'ภาพ',
    channels: 'เลือกช่องทางติดต่อ',
    line: 'แชตผ่าน LINE',
    lineHint: 'LINE ID: mapxprop',
    phone: 'โทรคุยกับเรา',
    email: 'ส่งอีเมล',
    address: 'ที่อยู่ติดต่อ',
    addressText: '8 อาคารสมกิจ ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900',
    openMap: 'ดูเส้นทาง',
    follow: 'เจอกันบนโซเชียล',
    formTitle: 'อยากเล่ารายละเอียดเพิ่มเติม?',
    formDescription: 'เขียนข้อความ แล้วส่งผ่านแอปอีเมลของคุณ',
    name: 'ชื่อ',
    namePlaceholder: 'ชื่อผู้ติดต่อ',
    emailLabel: 'อีเมลติดต่อกลับ',
    topic: 'เรื่องที่อยากคุย',
    message: 'ข้อความ',
    messagePlaceholder: 'ให้เราช่วยเรื่องอะไรดี…',
    formHint: 'ตรวจสอบและกดส่งอีกครั้งในแอปอีเมล',
    submit: 'เปิดแอปอีเมล',
  },
  en: {
    eyebrow: 'Contact MapxProp',
    title: 'Got a question?',
    titleSecond: 'Let’s talk.',
    description: 'Help with listings, using MapxProp, or working together.',
    hello: 'Hello there',
    greeting: 'How can we help?',
    photo: 'A sunlit cafe corner with a wooden table, chairs and indoor plants',
    photoCredit: 'Photo',
    channels: 'Choose how to get in touch',
    line: 'Chat on LINE',
    lineHint: 'LINE ID: mapxprop',
    phone: 'Give us a call',
    email: 'Email us',
    address: 'Contact address',
    addressText: '8 Somkij Building, Vibhavadi Rangsit Road, Chomphon, Chatuchak, Bangkok 10900',
    openMap: 'Get directions',
    follow: 'Find us on social',
    formTitle: 'Have more to share?',
    formDescription: 'Write a message to send from your email app.',
    name: 'Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Reply email',
    topic: 'What’s on your mind?',
    message: 'Message',
    messagePlaceholder: 'Tell us how we can help…',
    formHint: 'Review and send from your email app.',
    submit: 'Open email app',
  },
} as const

const ContactPageContent = ({ initialTopic }: { initialTopic?: string }) => {
  const { locale } = usePreferences()
  const isThai = locale === 'th'
  const t = contactCopy[isThai ? 'th' : 'en']
  const selectedTopic = topicOptions.find((option) => option.value === initialTopic)?.value || 'general'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const replyEmail = String(formData.get('email') || '').trim()
    const topic = String(formData.get('topic') || 'general')
    const message = String(formData.get('message') || '').trim()
    const topicOption = topicOptions.find((option) => option.value === topic) || topicOptions[0]
    const topicLabel = isThai ? topicOption.labelTh : topicOption.labelEn
    const subject = `[MapxProp] ${topicLabel}${name ? ` — ${name}` : ''}`
    const body = [`${t.name}: ${name}`, `${t.emailLabel}: ${replyEmail}`, '', message].join('\n')

    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <main className={styles.page}>
      <div className={`container ${styles.container}`}>
        <section className={styles.hero} aria-labelledby="contact-title">
          <div className={styles.intro}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              {t.eyebrow}
            </p>
            <h1 id="contact-title">
              {t.title}
              <br />
              {t.titleSecond}
            </h1>
            <p className={styles.description}>{t.description}</p>
            <div className={styles.introMark} aria-hidden="true">
              <MessageCircle />
              <span>LET’S CONNECT</span>
            </div>
          </div>

          <figure className={styles.visual}>
            <div className={styles.photoFrame}>
              <Image
                src="/images/contact/conversation-corner.webp"
                alt={t.photo}
                fill
                sizes="(max-width: 743px) 100vw, (max-width: 1280px) 52vw, 660px"
                preload
                className={styles.photo}
              />
            </div>
            <div className={styles.greeting} aria-hidden="true">
              <span className={styles.greetingIcon}>
                <MessageCircle strokeWidth={1.8} />
              </span>
              <span>
                <small>{t.hello}</small>
                <strong>{t.greeting}</strong>
              </span>
              <span className={styles.chatDots}>
                <i />
                <i />
                <i />
              </span>
            </div>
            <figcaption className={styles.photoCredit}>
              <a href={photoUrl} target="_blank" rel="noreferrer">
                {t.photoCredit}: Kouji Tsuru / Unsplash <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            </figcaption>
          </figure>
        </section>

        <section className={styles.channels} aria-label={t.channels}>
          <a className={`${styles.channel} ${styles.lineChannel}`} href={lineUrl} target="_blank" rel="noreferrer">
            <span className={styles.channelIcon}>
              <MessageCircle aria-hidden="true" />
            </span>
            <span className={styles.channelCopy}>
              <strong>{t.line}</strong>
              <span>{t.lineHint}</span>
            </span>
            <span className={styles.channelArrow}>
              <ArrowUpRight aria-hidden="true" />
            </span>
          </a>
          <a className={styles.channel} href={`tel:${contactPhone.replace(/-/g, '')}`}>
            <span className={styles.channelIcon}>
              <Phone aria-hidden="true" />
            </span>
            <span className={styles.channelCopy}>
              <span>{t.phone}</span>
              <strong>{contactPhone}</strong>
            </span>
            <span className={styles.channelArrow}>
              <ArrowUpRight aria-hidden="true" />
            </span>
          </a>
          <a className={styles.channel} href={`mailto:${contactEmail}`}>
            <span className={styles.channelIcon}>
              <Mail aria-hidden="true" />
            </span>
            <span className={styles.channelCopy}>
              <span>{t.email}</span>
              <strong>{contactEmail}</strong>
            </span>
            <span className={styles.channelArrow}>
              <ArrowUpRight aria-hidden="true" />
            </span>
          </a>
        </section>

        <div className={styles.detailsGrid}>
          <details className={styles.messagePanel} key={selectedTopic} open={selectedTopic !== 'general'}>
            <summary className={styles.messageSummary}>
              <span className={styles.formIcon}>
                <Mail aria-hidden="true" />
              </span>
              <span>
                <h2>{t.formTitle}</h2>
                <span className={styles.formDescription}>{t.formDescription}</span>
              </span>
              <ChevronDown className={styles.expandIcon} aria-hidden="true" />
            </summary>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <label>
                  {t.name}
                  <input name="name" required autoComplete="name" maxLength={120} placeholder={t.namePlaceholder} />
                </label>
                <label>
                  {t.emailLabel}
                  <input name="email" type="email" required autoComplete="email" placeholder="name@example.com" />
                </label>
              </div>
              <label>
                {t.topic}
                <select name="topic" defaultValue={selectedTopic}>
                  {topicOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {isThai ? option.labelTh : option.labelEn}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.message}
                <textarea name="message" required rows={4} placeholder={t.messagePlaceholder} />
              </label>
              <div className={styles.formBottom}>
                <p>{t.formHint}</p>
                <button type="submit">
                  {t.submit}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
          </details>

          <aside className={styles.addressPanel}>
            <div className={styles.addressRow}>
              <span className={styles.addressIcon}>
                <MapPin aria-hidden="true" />
              </span>
              <div>
                <h2>{t.address}</h2>
                <address>{t.addressText}</address>
                <a className={styles.mapLink} href={mapUrl} target="_blank" rel="noreferrer">
                  {t.openMap}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <div className={styles.socialRow}>
              <p>{t.follow}</p>
              <SocialMediaLinks />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default ContactPageContent
