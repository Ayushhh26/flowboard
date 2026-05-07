import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-200', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl bg-white shadow-sm">
      <div className="border-b border-gray-100 p-3">
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
    <div className="flex h-full gap-3 overflow-x-auto p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  )
}
