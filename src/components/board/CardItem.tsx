'use client'

import { cn } from '@/lib/cn'
import { PriorityBadge } from '@/components/ui/Badge'
import type { Card } from '@/types/card'
import { useDeleteCard } from '@/hooks/useDeleteCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const priorityBorderClass: Record<Card['priority'], string> = {
  none: 'border-l-transparent',
  low: 'border-l-blue-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
}

interface CardItemContentProps {
  card: Card
  boardId: string
  style?: React.CSSProperties
  className?: string
  isDragOverlay?: boolean
}

export function CardItemContent({ card, boardId, style, className, isDragOverlay }: CardItemContentProps) {
  const { mutate: deleteCard } = useDeleteCard(boardId)

  return (
    <div
      style={style}
      className={cn(
        'group relative cursor-grab rounded-lg border border-gray-200 border-l-[3px] bg-white p-3',
        'transition-shadow duration-150 hover:shadow-md',
        priorityBorderClass[card.priority],
        className
      )}
    >
      <p className="pr-6 text-sm font-medium text-gray-900">{card.title}</p>

      <div className="mt-2 flex items-center gap-1.5">
        <PriorityBadge priority={card.priority} />
      </div>

      {!isDragOverlay && (
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
}

export function CardItem({ card, boardId }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <CardItemContent
        card={card}
        boardId={boardId}
        className={isDragging ? 'opacity-50' : undefined}
      />
    </div>
  )
}
