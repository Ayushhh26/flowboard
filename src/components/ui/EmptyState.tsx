interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 text-xs font-medium text-blue-500 hover:text-blue-600"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
