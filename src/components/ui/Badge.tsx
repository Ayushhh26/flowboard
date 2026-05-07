import { cn } from '@/lib/cn'
import type { Priority } from '@/types/card'

interface BadgeProps {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  )
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  none:   { label: 'No priority', className: 'bg-gray-100 text-gray-500' },
  low:    { label: 'Low',         className: 'bg-blue-50 text-blue-600' },
  medium: { label: 'Medium',      className: 'bg-yellow-50 text-yellow-700' },
  high:   { label: 'High',        className: 'bg-orange-50 text-orange-600' },
  urgent: { label: 'Urgent',      className: 'bg-red-50 text-red-600' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'none') return null
  const { label, className } = priorityConfig[priority]
  return <Badge className={className}>{label}</Badge>
}
