'use client'

import { useState } from 'react'
import type { Column as ColumnType } from '@/types/column'
import { cn } from '@/lib/cn'
import { cardSurfaceClassName, focusRingClassName } from '@/lib/ui-colors'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tooltip } from '@/components/ui/Tooltip'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { CardItem } from './CardItem'
import { AddCardInput } from './AddCardInput'
import { DeleteColumnDialog } from './DeleteColumnDialog'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { useUpdateColumn } from '@/hooks/useUpdateColumn'

interface ColumnProps {
  column: ColumnType
  boardId: string
  canEdit: boolean
  allColumns: ColumnType[]
  visibleCount?: number
  totalCount?: number
  filtersActive?: boolean
}

export function Column({ column, boardId, canEdit, allColumns, visibleCount, totalCount, filtersActive }: ColumnProps) {
  const badgeCount = visibleCount ?? column.cards.length
  const showFilteredTooltip =
    !!filtersActive &&
    totalCount !== undefined &&
    visibleCount !== undefined &&
    totalCount !== visibleCount
  const filteredTooltip = `${badgeCount} of ${totalCount} tasks`

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column' },
    disabled: !canEdit,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column-drop' },
    disabled: !canEdit,
  })

  const { mutate: updateColumn } = useUpdateColumn(boardId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const otherColumns = allColumns.filter((c) => c.id !== column.id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <>
      <div
        ref={setSortableRef}
        style={style}
        className={cn(
          'flex w-72 shrink-0 flex-col sm:w-80',
          cardSurfaceClassName,
          isDragging && 'opacity-50'
        )}
      >
        <div className="flex items-center gap-1 rounded-t-lg border-b border-border bg-foreground/[0.03] px-2 py-3 dark:bg-foreground/[0.06]">
          {canEdit && (
            <button
              type="button"
              aria-label={`Drag column ${column.title}`}
              className={cn(
                'cursor-grab touch-none rounded p-1 text-muted hover:bg-foreground/5 hover:text-muted active:cursor-grabbing',
                focusRingClassName
              )}
              {...attributes}
              {...listeners}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="4" r="1.5" />
                <circle cx="11" cy="4" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="11" cy="12" r="1.5" />
              </svg>
            </button>
          )}

          <div className="min-w-0 flex-1">
            {canEdit ? (
              <InlineEdit
                value={column.title}
                onSave={(title) => {
                  if (title !== column.title) updateColumn({ columnId: column.id, title })
                }}
                className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted"
                inputClassName="text-[11px] font-semibold uppercase tracking-[0.1em]"
              />
            ) : (
              <h2
                className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted"
                aria-label={`${column.title}, ${badgeCount} tasks`}
              >
                {column.title}
              </h2>
            )}
          </div>

          {showFilteredTooltip ? (
            <Tooltip content={filteredTooltip}>
              <span
                aria-label={filteredTooltip}
                className="cursor-default rounded-full bg-accent-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-accent ring-1 ring-accent-ring/60"
              >
                {badgeCount}
              </span>
            </Tooltip>
          ) : (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums bg-foreground/5 text-muted'
              )}
            >
              {badgeCount}
            </span>
          )}

          {canEdit && (
            <button
              type="button"
              aria-label={`Delete column ${column.title}`}
              onClick={() => setDeleteOpen(true)}
              className={cn(
                'rounded p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-600',
                focusRingClassName
              )}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        <div
          ref={setDropRef}
          className={cn(
            'flex min-h-[8rem] flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors duration-200',
            isOver && canEdit && 'rounded-lg bg-accent-muted/90 ring-1 ring-inset ring-accent-ring'
          )}
        >
          <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <EmptyState
              title={filtersActive && (totalCount ?? 0) > 0 ? 'No matching tasks' : 'No tasks yet'}
              description={
                filtersActive && (totalCount ?? 0) > 0
                  ? 'Clear filters to see hidden tasks'
                  : 'Add a card to get started'
              }
            />
          ) : (
              column.cards.map((card) => (
                <CardItem key={card.id} card={card} boardId={boardId} canEdit={canEdit} />
              ))
            )}
          </SortableContext>
        </div>

        {canEdit && <AddCardInput columnId={column.id} boardId={boardId} />}
      </div>

      <DeleteColumnDialog
        column={column}
        otherColumns={otherColumns}
        boardId={boardId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
