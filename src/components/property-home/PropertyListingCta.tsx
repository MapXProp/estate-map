import { ArrowRight, MapPin, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './PropertyListingCta.module.css'

export default function PropertyListingCta({ isThai }: { isThai: boolean }) {
  return (
    <section className={styles.cta} aria-labelledby="property-listing-cta-title" data-listing-cta>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowIcon}>
            <Plus size={14} aria-hidden="true" />
          </span>
          {isThai ? 'สำหรับเจ้าของพื้นที่' : 'FOR PROPERTY OWNERS'}
        </p>
        <h2 id="property-listing-cta-title" className={styles.title}>
          {isThai ? 'มีพื้นที่ดี ๆ' : 'Your space.'}
          <span>{isThai ? 'ให้คนได้ค้นพบ' : 'Someone’s next chapter.'}</span>
        </h2>
        <p className={styles.description}>
          {isThai
            ? 'บ้าน ห้องเช่า หรือพื้นที่ธุรกิจ เพิ่มรูปและรายละเอียด แล้วเริ่มลงประกาศบน MapxProp'
            : 'A home, a room or a business space. Add your photos and details, and start your listing on MapxProp.'}
        </p>
        <div className={styles.actions}>
          <Link href="/add-listing/1?new=1" className={styles.primary}>
            <Plus size={18} aria-hidden="true" />
            {isThai ? 'ลงประกาศฟรี' : 'List for free'}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link href="/contact?topic=listing" className={styles.secondary}>
            {isThai ? 'สอบถามเรา' : 'Contact us'}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className={styles.visual} aria-hidden="true">
        <div className={styles.backdrop} />
        <div className={styles.orbit} />
        <Image
          className={styles.artwork}
          src="/images/listing-cta/neighborhood.webp"
          alt=""
          width={960}
          height={720}
          sizes="(min-width: 1280px) 530px, (min-width: 768px) 45vw, 350px"
          loading="lazy"
        />
        <div className={styles.preview}>
          <div className={styles.previewTop}>
            <span />
            <span />
            <span />
            <span className={styles.previewLine} />
          </div>
          <div className={styles.previewImage}>
            <Image
              src="/images/channel-heroes/residential-house-daylight.jpg"
              alt=""
              fill
              sizes="180px"
              loading="lazy"
            />
            <span className={styles.previewPlus}>
              <Plus size={15} />
            </span>
          </div>
          <div className={styles.previewTitle}>{isThai ? 'ประกาศของคุณ' : 'Your property listing'}</div>
          <div className={styles.previewLocation}>
            <MapPin size={12} />
            {isThai ? 'เพิ่มรูป · ระบุทำเล' : 'Add photos · Pin a location'}
          </div>
        </div>
      </div>
    </section>
  )
}
