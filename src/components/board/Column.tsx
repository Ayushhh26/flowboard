'use client'

import type { Column as ColumnType } from '@/types/column'
import { cn } from '@/lib/cn'
import { cardSurfaceClassName } from '@/lib/ui-colors'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardItem } from './CardItem'
import { AddCardInput } from './AddCardInput'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'

interface ColumnProps {
  column: ColumnType
  boardId: string
  canEdit: boolean
}

export function Column({ column, boardId, canEdit }: ColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id, disabled: !canEdit })

  return (
    <div className={cn('flex w-72 shrink-0 flex-col sm:w-80', cardSurfaceClassName)}>
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
        <h2
          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
          aria-label={`${column.title}, ${column.cards.length} tasks`}
        >
          {column.title}
        </h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            column.cards.length > 0
              ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60'
              : 'bg-slate-100 text-slate-500'
          )}
        >
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setDropRef}
        className={cn(
          'flex min-h-[8rem] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-200',
          isOver && canEdit && 'rounded-lg bg-indigo-50/90 ring-1 ring-inset ring-indigo-200'
        )}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <EmptyState title="No tasks yet" description="Add a card to get started" />
          ) : (
            column.cards.map((card) => (
              <CardItem key={card.id} card={card} boardId={boardId} canEdit={canEdit} />
            ))
          )}
        </SortableContext>
      </div>

      {canEdit && <AddCardInput columnId={column.id} boardId={boardId} />}
    </div>
  )
}
