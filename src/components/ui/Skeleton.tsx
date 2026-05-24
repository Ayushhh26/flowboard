import { cn } from '@/lib/cn'
import { cardSurfaceClassName } from '@/lib/ui-colors'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-foreground/10', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-md border border-border border-l-[3px] border-l-zinc-300 bg-surface p-3 shadow-sm dark:border-l-zinc-600">
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className={cn('flex w-72 shrink-0 flex-col sm:w-80', cardSurfaceClassName)}>
      <div className="border-b border-border p-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 overflow-x-auto bg-canvas p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  )
}
