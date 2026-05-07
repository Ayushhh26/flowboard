'use client'

import { useState, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensors,
  useSensor,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core'
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
  const boardSnapshot = useRef<Board | null>(null)
  const lastOverId = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  if (isLoading) return <BoardSkeleton />
  if (isError || !board) return <BoardError onRetry={() => refetch()} />

  const handleDragStart = ({ active }: DragStartEvent) => {
    boardSnapshot.current = queryClient.getQueryData<Board>(['board', boardId]) ?? null
    lastOverId.current = null
    const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const overId = over.id as string
    if (overId === lastOverId.current) return
    lastOverId.current = overId

    const current = queryClient.getQueryData<Board>(['board', boardId])
    if (!current) return

    const activeId = active.id as string
    const sourceCol = current.columns.find((col) => col.cards.some((c) => c.id === activeId))
    if (!sourceCol) return

    const isOverColumn = current.columns.some((col) => col.id === overId)
    const destCol = isOverColumn
      ? current.columns.find((col) => col.id === overId)!
      : current.columns.find((col) => col.cards.some((c) => c.id === overId))

    if (!destCol || sourceCol.id === destCol.id) return

    const movingCard = sourceCol.cards.find((c) => c.id === activeId)!
    const rawIndex = isOverColumn ? -1 : destCol.cards.findIndex((c) => c.id === overId)
    const insertIndex = rawIndex === -1 ? destCol.cards.length : rawIndex

    queryClient.setQueryData<Board>(['board', boardId], (old) => {
      if (!old) return old
      return {
        ...old,
        columns: old.columns.map((col) => {
          if (col.id === sourceCol.id) return { ...col, cards: col.cards.filter((c) => c.id !== activeId) }
          if (col.id === destCol.id) {
            const next = [...col.cards]
            next.splice(insertIndex, 0, { ...movingCard, columnId: destCol.id })
            return { ...col, cards: next }
          }
          return col
        }),
      }
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null)
    lastOverId.current = null

    if (!over || active.id === over.id) {
      boardSnapshot.current = null
      return
    }

    const current = queryClient.getQueryData<Board>(['board', boardId])
    if (!current) {
      boardSnapshot.current = null
      return
    }

    const sourceCol = current.columns.find((col) => col.cards.some((c) => c.id === active.id))
    const destCol = current.columns.find((col) => col.cards.some((c) => c.id === over.id))

    if (sourceCol && destCol && sourceCol.id === destCol.id) {
      const oldIndex = sourceCol.cards.findIndex((c) => c.id === active.id)
      const newIndex = sourceCol.cards.findIndex((c) => c.id === over.id)

      queryClient.setQueryData<Board>(['board', boardId], (old) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === sourceCol.id
              ? { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) }
              : col
          ),
        }
      })
    }
    // Cross-column: already handled by onDragOver

    boardSnapshot.current = null
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveCard(null)
    lastOverId.current = null
    if (boardSnapshot.current) {
      queryClient.setQueryData<Board>(['board', boardId], boardSnapshot.current)
      boardSnapshot.current = null
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
