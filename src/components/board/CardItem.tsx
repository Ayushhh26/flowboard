'use client'

import { cn } from '@/lib/cn'
import { PRIORITY_STYLES } from '@/lib/ui-colors'
import { PriorityBadge } from '@/components/ui/Badge'
import { LabelChip } from '@/components/ui/LabelChip'
import { Avatar } from '@/components/ui/Avatar'
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
        'group relative rounded-md border border-border border-l-[3px] bg-surface p-3 shadow-sm',
        PRIORITY_STYLES[card.priority].border,
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        'transition-[border-color,box-shadow,background-color] duration-200 hover:border-foreground/20 hover:shadow-md',
        isDragOverlay && 'shadow-lg ring-1 ring-accent',
        className
      )}
    >
      <p className="pr-6 text-sm font-medium leading-snug text-foreground">{card.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={card.priority} />
        {card.labels.slice(0, 3).map((label) => (
          <LabelChip key={label.id} label={label} />
        ))}
        {card.assignee && (
          <Avatar
            name={card.assignee.name}
            src={card.assignee.avatarUrl}
            size="sm"
            className="ml-auto"
          />
        )}
      </div>

      {!isDragOverlay && canEdit && (
        <button
          type="button"
          aria-label="Delete card"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            deleteCard({ cardId: card.id })
          }}
          className="absolute right-1 top-1 cursor-pointer rounded p-0.5 text-muted opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
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
    data: { type: 'card' },
    disabled: !canEdit,
  })
  const { openCard } = useDrawerStore()

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      id={`card-${card.id}`}
      {...attributes}
      {...listeners}
      tabIndex={0}
    >
      <CardItemContent
        card={card}
        boardId={boardId}
        className={isDragging ? 'invisible' : undefined}
        onOpen={() => openCard(card.id)}
        canEdit={canEdit}
      />
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-accent bg-accent-muted/50" />
      )}
    </div>
  )
}
