import { cn } from '@/lib/utils'

interface SkeletonShimmerProps {
  className?: string
  rows?: number
  height?: string
}

export function SkeletonShimmer({
  className,
  rows = 1,
  height = 'h-8',
}: SkeletonShimmerProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded bg-muted',
            height,
            className
          )}
        />
      ))}
    </>
  )
}
