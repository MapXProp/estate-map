export default function Loading() {
  return (
    <div className="container py-8" aria-busy="true" aria-label="กำลังค้นหาประกาศ">
      <div className="mb-6 h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      <div className="grid grid-cols-2 gap-4 min-[744px]:grid-cols-3 min-[1100px]:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  )
}
