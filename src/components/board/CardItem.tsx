'use client'

import { cn } from '@/lib/cn'
import { PRIORITY_STYLES } from '@/lib/ui-colors'
import { PriorityBadge } from '@/components/ui/Badge'
import type { Card } from '@/types/card'
import { useDeleteCard } from '@/hooks/useDeleteCard'
import { useDrawerStore } from '@/stores/useDrawerStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CardItemContentProps {
  card: Card
  boardId: string
  style?: React.CSSProperties
  className?: string
  isDragOverlay?: boolean
  onOpen?: () => void
  canEdit?: boolean
}

export function CardItemContent({
  card,
  boardId,
  style,
  className,
  isDragOverlay,
  onOpen,
  canEdit = true,
}: CardItemContentProps) {
  const { mutate: deleteCard } = useDeleteCard(boardId)

  return (
    <div
      style={style}
      onClick={onOpen}
      className={cn(
        'group relative rounded-lg border border-gray-200 border-l-[3px] bg-white p-3',
        canEdit ? 'cursor-grab' : 'cursor-pointer',
        'transition-shadow duration-150 hover:shadow-md',
        PRIORITY_STYLES[card.priority].border,
        className
      )}
    >
      <p className="pr-6 text-sm font-medium text-gray-900">{card.title}</p>

      <div className="mt-2 flex items-center gap-1.5">
        <PriorityBadge priority={card.priority} />
      </div>

      {!isDragOverlay && canEdit && (
        <button
          aria-label="Delete card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            deleteCard({ cardId: card.id })
          }}
          className="absolute right-1 top-1 rounded p-0.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="4" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="12" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface CardItemProps {
  card: Card
  boardId: string
  canEdit: boolean
}

export function CardItem({ card, boardId, canEdit }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !canEdit,
  })
  const { openCard } = useDrawerStore()

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative"
      {...attributes}
      {...listeners}
    >
      <CardItemContent
        card={card}
        boardId={boardId}
        className={isDragging ? 'invisible' : undefined}
        onOpen={() => openCard(card.id)}
        canEdit={canEdit}
      />
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/40" />
      )}
    </div>
  )
}
