'use client'

import { cn } from '@/lib/cn'
import { PRIORITY_OPTIONS, PRIORITY_STYLES } from '@/lib/ui-colors'
import type { Priority } from '@/types/card'

interface PrioritySelectProps {
  value: Priority
  onChange: (priority: Priority) => void
  disabled?: boolean
}

export function PrioritySelect({ value, onChange, disabled }: PrioritySelectProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Priority">
      {PRIORITY_OPTIONS.map((opt) => {
        const styles = PRIORITY_STYLES[opt.value]
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? styles.selected
                : 'border-border bg-surface text-muted hover:border-border hover:bg-background'
            )}
          >
            <span className={cn('h-2 w-2 shrink-0 rounded-full', styles.dot)} aria-hidden />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
