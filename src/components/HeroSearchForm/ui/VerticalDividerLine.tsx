export const VerticalDividerLine = ({ responsive = false }: { responsive?: boolean }) => {
  return (
    <div
      className={
        responsive ? '-z-20 hidden h-8 self-center border-l min-[744px]:block' : '-z-20 h-8 self-center border-l'
      }
    />
  )
}
