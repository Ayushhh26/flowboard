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
}

export function Column({ column, boardId }: ColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
        <h2
          className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          aria-label={`${column.title}, ${column.cards.length} tasks`}
        >
          {column.title}
        </h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {column.cards.length}
        </span>
      </div>

      <div
        ref={setDropRef}
        className={cn(
          'flex flex-1 flex-col gap-2 overflow-y-auto p-2',
          isOver && 'rounded-lg bg-blue-50'
        )}
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <EmptyState title="No tasks yet" />
          ) : (
            column.cards.map((card) => (
              <CardItem key={card.id} card={card} boardId={boardId} />
            ))
          )}
        </SortableContext>
      </div>

      <AddCardInput columnId={column.id} boardId={boardId} />
    </div>
  )
}
