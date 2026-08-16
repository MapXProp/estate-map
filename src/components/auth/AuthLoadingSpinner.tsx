type Props = {
  className?: string
}

export default function AuthLoadingSpinner({ className = 'size-4' }: Props) {
  return (
    <span
      className={`${className} shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent`}
      aria-hidden="true"
    />
  )
}
