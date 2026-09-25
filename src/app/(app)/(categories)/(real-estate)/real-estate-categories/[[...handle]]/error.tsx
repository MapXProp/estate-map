'use client'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container py-20 text-center">
      <h2 className="text-xl font-semibold">โหลดประกาศไม่สำเร็จ</h2>
      <p className="mt-3 text-neutral-500">กรุณาลองอีกครั้งในสักครู่</p>
      <button onClick={reset} className="mt-6 rounded-full bg-[#123f32] px-6 py-3 text-white">
        ลองอีกครั้ง
      </button>
    </div>
  )
}
