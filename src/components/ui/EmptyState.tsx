import { cn } from '@/lib/cn'
import { linkClassName } from '@/lib/ui-colors'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-sm font-medium text-muted">{title}</p>
      {description && <p className="max-w-xs text-xs text-muted">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn('mt-1 cursor-pointer text-xs', linkClassName)}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
