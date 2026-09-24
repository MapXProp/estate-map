'use client'

import { usePreferences } from '@/components/preferences/PreferencesProvider'
import { ArrowRight, CheckCircle2, CreditCard, FileText, Plus, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './AccountDashboard.module.css'

export default function AccountBillingPanel() {
  const { locale } = usePreferences()
  const th = locale === 'th'
  const say = (thai: string, english: string) => (th ? thai : english)
  return (
    <div>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PLAN & BILLING</span>
          <h1>{say('แพ็กเกจและการชำระเงิน', 'Plan & billing')}</h1>
          <p>{say('เริ่มแบ่งปันพื้นที่ดี ๆ ได้ฟรีบน MapxProp', 'Sharing your space on MapxProp is currently free.')}</p>
        </div>
      </header>
      <section className={styles.plan}>
        <div>
          <small>
            <CheckCircle2 size={15} />
            {say('แพ็กเกจปัจจุบัน', 'Current plan')}
          </small>
          <h2>{say('ลงประกาศฟรี', 'Free listings')}</h2>
          <p>
            {say(
              'เพิ่มรูปและรายละเอียด ส่งให้ทีมงานตรวจสอบ แล้วติดตามสถานะได้จากประกาศของฉัน',
              'Add your photos and details, submit for review, and track progress in My listings.'
            )}
          </p>
          <Link href="/add-listing/1?new=1" className={`${styles.primaryAction} ${styles.orangeAction}`}>
            <Plus size={18} />
            {say('ลงประกาศใหม่', 'Create listing')}
          </Link>
        </div>
        <Image src="/images/listing-cta/neighborhood.webp" width={240} height={180} sizes="200px" alt="" />
      </section>
      <div className={styles.billingFacts}>
        <div>
          <CheckCircle2 size={21} />
          <h3>{say('ไม่มีค่าลงประกาศ', 'No listing fee')}</h3>
          <p>{say('การลงประกาศในปัจจุบันไม่มีค่าใช้จ่าย', 'Creating a listing is currently free.')}</p>
        </div>
        <div>
          <CreditCard size={21} />
          <h3>{say('ไม่ต้องเพิ่มบัตร', 'No card required')}</h3>
          <p>{say('เริ่มลงประกาศได้โดยไม่กรอกข้อมูลบัตร', 'Start without entering payment card details.')}</p>
        </div>
        <div>
          <ShieldCheck size={21} />
          <h3>{say('ไม่มีการเรียกเก็บเงิน', 'No active charges')}</h3>
          <p>{say('ขณะนี้ MapxProp ยังไม่มีระบบเรียกเก็บเงิน', 'MapxProp does not currently collect payments.')}</p>
        </div>
      </div>
      <section className={styles.panel}>
        <h2>{say('การชำระเงินและใบเสร็จ', 'Payments & receipts')}</h2>
        <p className={styles.panelDescription}>
          {say(
            'ยังไม่มีรายการชำระเงินหรือใบเสร็จ เนื่องจากการลงประกาศในปัจจุบันให้บริการฟรี',
            'There are no payments or receipts while listings are offered free of charge.'
          )}
        </p>
        <div className={styles.settingsRows}>
          <Link href="/account-listings">
            <FileText size={18} />
            <span>{say('จัดการประกาศของฉัน', 'Manage my listings')}</span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/contact">
            <span>{say('สอบถามเรื่องแพ็กเกจ', 'Ask about plans')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
