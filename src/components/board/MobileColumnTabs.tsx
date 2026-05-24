'use client'

import { cn } from '@/lib/cn'
import { focusRingClassName } from '@/lib/ui-colors'
import type { Column as ColumnType } from '@/types/column'

interface MobileColumnTabsProps {
  columns: ColumnType[]
  activeColumnId: string
  onSelect: (columnId: string) => void
}

export function MobileColumnTabs({ columns, activeColumnId, onSelect }: MobileColumnTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 md:hidden">
      {columns.map((col) => (
        <button
          key={col.id}
          type="button"
          onClick={() => onSelect(col.id)}
          className={cn(
            'min-h-[44px] shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            focusRingClassName,
            activeColumnId === col.id
              ? 'bg-accent text-white'
              : 'bg-foreground/5 text-muted hover:bg-foreground/10'
          )}
          aria-current={activeColumnId === col.id ? 'true' : undefined}
        >
          {col.title}
        </button>
      ))}
    </div>
  )
}
