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
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null
  const { label, badge } = PRIORITY_STYLES[priority]
  return <Badge className={badge}>{label}</Badge>
}
