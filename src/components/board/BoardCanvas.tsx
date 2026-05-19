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
import { useMoveCard } from '@/hooks/useMoveCard'
import { useBoardRealtime } from '@/hooks/useBoardRealtime'
import { useDemoStore } from '@/stores/useDemoStore'
import { computeOrderIndex } from '@/lib/fractionalIndex'
import { Button } from '@/components/ui/Button'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { Column } from './Column'
import { CardItemContent } from './CardItem'
import { CardDrawer } from './CardDrawer'
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
  useBoardRealtime(boardId)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const boardSnapshot = useRef<Board | null>(null)
  const lastOverId = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )
  const { mutate: moveCard } = useMoveCard(boardId)

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

    if (!over) {
      boardSnapshot.current = null
      return
    }

    const activeId = active.id as string
    const snapshot = boardSnapshot.current
    boardSnapshot.current = null
    if (!snapshot) return

    const current = queryClient.getQueryData<Board>(['board', boardId])
    if (!current) return

    const currentCol = current.columns.find((col) => col.cards.some((c) => c.id === activeId))
    if (!currentCol) return

    const originalColId = snapshot.columns.find((col) =>
      col.cards.some((c) => c.id === activeId)
    )?.id

    const isSameColumn = originalColId === currentCol.id

    let insertIndex: number
    let newOrderIndex: number

    if (isSameColumn) {
      const originalCards = snapshot.columns.find((col) => col.id === currentCol.id)!.cards
      const oldIndex = originalCards.findIndex((c) => c.id === activeId)
      if (oldIndex === -1) return
      const rawNewIndex = originalCards.findIndex((c) => c.id === over.id)
      const newIndex = rawNewIndex === -1 ? originalCards.length - 1 : rawNewIndex
      if (oldIndex === newIndex) return

      const reordered = arrayMove(originalCards, oldIndex, newIndex)
      insertIndex = newIndex
      const neighborsOnly = reordered.filter((c) => c.id !== activeId)
      const adjustedIndex = newIndex > oldIndex ? newIndex - 1 : newIndex
      newOrderIndex = computeOrderIndex(neighborsOnly, adjustedIndex)
    } else {
      const rawInsert = currentCol.cards.findIndex((c) => c.id === activeId)
      insertIndex = rawInsert === -1 ? currentCol.cards.length : rawInsert
      const neighborsOnly = currentCol.cards.filter((c) => c.id !== activeId)
      newOrderIndex = computeOrderIndex(neighborsOnly, insertIndex)
    }

    const simulateFailure = useDemoStore.getState().simulateFailure
    moveCard({ cardId: activeId, targetColumnId: currentCol.id, newOrderIndex, insertIndex, preSnapshot: snapshot, simulateFailure })
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
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full items-stretch gap-3 overflow-x-auto p-6">
        {board.columns.map((col) => (
          <Column key={col.id} column={col} boardId={boardId} />
        ))}
      </div>
      <DragOverlay>
        {activeCard && <CardItemContent card={activeCard} boardId={boardId} isDragOverlay />}
      </DragOverlay>
    </DndContext>
    <CardDrawer boardId={boardId} />
    </>
  )
}
