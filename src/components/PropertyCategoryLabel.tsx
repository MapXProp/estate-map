import clsx from 'clsx'

type Props = {
  label: string
  ampersandClassName?: string
}

const PropertyCategoryLabel = ({ label, ampersandClassName }: Props) => {
  const [before, after] = label.split(' & ')

  if (!after) return <>{label}</>

  return (
    <>
      {before}{' '}
      <span
        aria-hidden="true"
        className={clsx('mx-0.5 text-[0.72em] font-normal text-neutral-400/70', ampersandClassName)}
      >
        &amp;
      </span>{' '}
      {after}
    </>
  )
}

export default PropertyCategoryLabel
