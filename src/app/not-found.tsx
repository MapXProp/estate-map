import I404Png from '@/images/404.png'
import ButtonPrimary from '@/shared/ButtonPrimary'
import Image from 'next/image'

const NotFound = () => (
  <div className="nc-Page404">
    <div className="relative container pt-5 pb-16 lg:pt-5 lg:pb-20">
      {/* HEADER */}
      <header className="mx-auto max-w-2xl space-y-2 text-center">
        <Image src={I404Png} alt="" />
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">ไม่พบหน้าที่คุณกำลังค้นหา</h1>
        <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          ประกาศอาจปิดไปแล้ว หรือที่อยู่หน้าเว็บไม่ถูกต้อง เลือกดูประกาศที่ยังเผยแพร่อยู่ได้ด้านล่าง
        </p>
        <div className="pt-8">
          <ButtonPrimary href="/real-estate-categories/all">ดูประกาศทั้งหมด</ButtonPrimary>
        </div>
      </header>
    </div>
  </div>
)

export default NotFound
