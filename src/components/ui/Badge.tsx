import { cn } from '@/lib/cn'
import { PRIORITY_STYLES } from '@/lib/ui-colors'
import type { Priority } from '@/types/card'

interface BadgeProps {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null
  const { label, badge, dot } = PRIORITY_STYLES[priority]
  return (
    <Badge className={badge}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden />
      {label}
    </Badge>
  )
}
