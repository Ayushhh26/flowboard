import { cn } from '@/lib/cn'
import { ROLE_STYLES } from '@/lib/ui-colors'
import type { ViewerRole } from '@/types/board'

type RoleBadgeRole = ViewerRole | 'pending'

interface RoleBadgeProps {
  role: RoleBadgeRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { label, className: roleClass } = ROLE_STYLES[role]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        roleClass,
        className
      )}
    >
      {label}
    </span>
  )
}
