import type { Column as ColumnType } from '@/types/column'
import { CardItem } from './CardItem'
import { AddCardInput } from './AddCardInput'

interface ColumnProps {
  column: ColumnType
  boardId: string
}

export function Column({ column, boardId }: ColumnProps) {
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

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {column.cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-sm text-gray-400">
            No tasks yet
          </div>
        ) : (
          column.cards.map((card) => (
            <CardItem key={card.id} card={card} boardId={boardId} />
          ))
        )}
      </div>

      <AddCardInput columnId={column.id} boardId={boardId} />
    </div>
  )
}
