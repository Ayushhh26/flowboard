'use client'

import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { useBoard } from '@/hooks/useBoard'
import { Button } from '@/components/ui/Button'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { Column } from './Column'
import { CardItemContent } from './CardItem'
import type { Card } from '@/types/card'
import type { Board } from '@/types/board'

interface BoardCanvasProps {
  boardId: string
}

function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium text-gray-600">Failed to load board</p>
      <Button variant="primary" onClick={onRetry}>Retry</Button>
    </div>
  )
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { data: board, isLoading, isError, refetch } = useBoard(boardId)
  const queryClient = useQueryClient()
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  if (isLoading) return <BoardSkeleton />
  if (isError || !board) return <BoardError onRetry={() => refetch()} />

  const handleDragStart = ({ active }: DragStartEvent) => {
    const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null)
    if (!over || active.id === over.id) return

    const sourceColumn = board.columns.find((col) => col.cards.some((c) => c.id === active.id))
    const destColumn = board.columns.find((col) => col.cards.some((c) => c.id === over.id))

    if (!sourceColumn || !destColumn) return

    if (sourceColumn.id === destColumn.id) {
      const oldIndex = sourceColumn.cards.findIndex((c) => c.id === active.id)
      const newIndex = sourceColumn.cards.findIndex((c) => c.id === over.id)

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === sourceColumn.id
              ? { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) }
              : col
          ),
        }
      })
    }
    // Cross-column: Day 7
  }

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full items-start gap-3 overflow-x-auto p-6">
        {board.columns.map((col) => (
          <Column key={col.id} column={col} boardId={boardId} />
        ))}
      </div>
      <DragOverlay>
        {activeCard && <CardItemContent card={activeCard} boardId={boardId} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
