'use client'

import type { Column as ColumnType } from '@/types/column'
import { cn } from '@/lib/cn'
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
    <div className="flex w-80 shrink-0 flex-col rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-2.5">
        <h2
          className="text-xs font-semibold uppercase tracking-wide text-gray-600"
          aria-label={`${column.title}, ${column.cards.length} tasks`}
        >
          {column.title}
        </h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
            column.cards.length > 0
              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setDropRef}
        className={cn(
          'flex min-h-[6rem] flex-1 flex-col gap-2 overflow-y-auto p-2',
          isOver && canEdit && 'rounded-lg bg-blue-50/80 ring-1 ring-inset ring-blue-200'
        )}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <EmptyState title="No tasks yet" />
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
