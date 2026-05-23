import { cn } from '@/lib/cn'
import { cardSurfaceClassName } from '@/lib/ui-colors'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-slate-200', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className={cn('flex w-72 shrink-0 flex-col sm:w-80', cardSurfaceClassName)}>
      <div className="border-b border-slate-100 p-3">
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
    <div className="flex h-full gap-4 overflow-x-auto bg-slate-50 p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  )
}
