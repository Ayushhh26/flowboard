'use client'

import { useState, useRef, useMemo, useSyncExternalStore } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensors,
  useSensor,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { useBoard } from '@/hooks/useBoard'
import { useMoveCard } from '@/hooks/useMoveCard'
import { useMoveColumn } from '@/hooks/useMoveColumn'
import { useBoardRealtime } from '@/hooks/useBoardRealtime'
import { useDemoStore } from '@/stores/useDemoStore'
import { useFilterStore } from '@/stores/useFilterStore'
import { filterCards, hasActiveFilters } from '@/lib/filterCards'
import { computeOrderIndex } from '@/lib/fractionalIndex'
import { Button } from '@/components/ui/Button'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Column } from './Column'
import { AddColumnButton } from './AddColumnButton'
import { FilterBar } from './FilterBar'
import { MobileColumnTabs } from './MobileColumnTabs'
import { CardItemContent } from './CardItem'
import { CardDrawer } from './CardDrawer'
import type { Card } from '@/types/card'
import type { Board, ViewerRole } from '@/types/board'
import type { Column as ColumnType } from '@/types/column'

interface BoardCanvasProps {
  boardId: string
  viewerRole: ViewerRole
}

function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium text-slate-600">Failed to load board</p>
      <Button variant="primary" onClick={onRetry}>Retry</Button>
    </div>
  )
}

function sortColumns(columns: ColumnType[]) {
  return [...columns].sort((a, b) => a.orderIndex - b.orderIndex)
}

const mobileMq = '(max-width: 767px)'

function subscribeToMobileLayout(onChange: () => void) {
  const mq = window.matchMedia(mobileMq)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getMobileSnapshot() {
  return window.matchMedia(mobileMq).matches
}

function getServerMobileSnapshot() {
  return false
}

export function BoardCanvas({ boardId, viewerRole }: BoardCanvasProps) {
  const { data: board, isLoading, isError, refetch } = useBoard(boardId)
  const queryClient = useQueryClient()
  useBoardRealtime(boardId)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [mobileColumnId, setMobileColumnId] = useState<string | null>(null)
  const isMobile = useSyncExternalStore(
    subscribeToMobileLayout,
    getMobileSnapshot,
    getServerMobileSnapshot
  )
  const boardSnapshot = useRef<Board | null>(null)
  const lastOverId = useRef<string | null>(null)

  const filters = useFilterStore()
  const filterState = {
    search: filters.search,
    priorities: filters.priorities,
    assigneeIds: filters.assigneeIds,
    labelIds: filters.labelIds,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const { mutate: moveCard } = useMoveCard(boardId)
  const { mutate: moveColumn } = useMoveColumn(boardId)
  const canEdit = viewerRole !== 'viewer'

  const sortedColumns = useMemo(
    () => (board ? sortColumns(board.columns) : []),
    [board]
  )

  const displayColumns = useMemo(() => {
    return sortedColumns.map((col) => {
      const filtered = filterCards(col.cards, filterState)
      return { ...col, cards: filtered, totalCount: col.cards.length, visibleCount: filtered.length }
    })
  }, [
    sortedColumns,
    filters.search,
    filters.priorities,
    filters.assigneeIds,
    filters.labelIds,
  ])

  const activeMobileColumnId = mobileColumnId ?? sortedColumns[0]?.id ?? null
  const columnsToRender = isMobile
    ? displayColumns.filter((c) => c.id === activeMobileColumnId)
    : displayColumns

  const filtersActive = hasActiveFilters(filterState)
  const noFilterMatches =
    filtersActive && displayColumns.every((c) => c.visibleCount === 0)

  if (isLoading) return <BoardSkeleton />
  if (isError || !board) return <BoardError onRetry={() => refetch()} />

  const isColumnDrag = (active: DragStartEvent['active']) =>
    active.data.current?.type === 'column'

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!canEdit) return
    boardSnapshot.current = queryClient.getQueryData<Board>(['board', boardId]) ?? null
    lastOverId.current = null

    if (isColumnDrag(active)) return

    const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!canEdit || !over) return

    if (isColumnDrag(active)) {
      const overId = over.id as string
      if (overId === lastOverId.current) return
      lastOverId.current = overId

      const current = queryClient.getQueryData<Board>(['board', boardId])
      if (!current) return

      const columns = sortColumns(current.columns)
      const activeId = active.id as string
      const oldIndex = columns.findIndex((c) => c.id === activeId)
      const newIndex = columns.findIndex((c) => c.id === overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      queryClient.setQueryData<Board>(['board', boardId], {
        ...current,
        columns: arrayMove(columns, oldIndex, newIndex),
      })
      return
    }

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
    if (!canEdit) return

    if (!over) {
      boardSnapshot.current = null
      return
    }

    if (isColumnDrag(active)) {
      const snapshot = boardSnapshot.current
      boardSnapshot.current = null
      if (!snapshot) return

      const activeId = active.id as string
      const originalColumns = sortColumns(snapshot.columns)
      const currentColumns = sortColumns(
        queryClient.getQueryData<Board>(['board', boardId])?.columns ?? []
      )

      const oldIndex = originalColumns.findIndex((c) => c.id === activeId)
      const newIndex = currentColumns.findIndex((c) => c.id === activeId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const neighborsOnly = currentColumns.filter((c) => c.id !== activeId)
      const newOrderIndex = computeOrderIndex(neighborsOnly, newIndex)
      moveColumn({ columnId: activeId, newOrderIndex })
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
      <FilterBar boardId={boardId} labels={board.labels ?? []} />
      <MobileColumnTabs
        columns={displayColumns}
        activeColumnId={activeMobileColumnId ?? ''}
        onSelect={setMobileColumnId}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              if (active.data.current?.type === 'column') {
                const col = sortedColumns.find((c) => c.id === active.id)
                return col ? `Picked up column ${col.title}` : 'Picked up column'
              }
              const card = board.columns.flatMap((c) => c.cards).find((c) => c.id === active.id)
              return card ? `Picked up ${card.title}` : 'Picked up card'
            },
            onDragOver({ active, over }) {
              if (!over) return
              if (active.data.current?.type === 'column') {
                const col = sortedColumns.find((c) => c.id === over.id)
                return col ? `Column ${col.title} is a drop target` : undefined
              }
              return undefined
            },
            onDragEnd({ active, over }) {
              if (active.data.current?.type === 'column') {
                return over ? 'Column dropped' : 'Column drag cancelled'
              }
              return over ? `${activeCard?.title ?? 'Card'} dropped` : 'Drag cancelled'
            },
            onDragCancel({ active }) {
              if (active.data.current?.type === 'column') return 'Column reorder cancelled'
              return 'Drag cancelled'
            },
          },
        }}
      >
        {noFilterMatches ? (
          <EmptyState
            title="No tasks match filters"
            description="Try adjusting your search or filter criteria"
            action={{ label: 'Clear filters', onClick: () => useFilterStore.getState().clearAll() }}
          />
        ) : (
          <div className="flex h-full items-stretch gap-4 overflow-x-auto bg-slate-100/80 p-4 sm:p-6 max-md:flex-col max-md:overflow-x-hidden">
            <SortableContext items={sortedColumns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
              {columnsToRender.map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  boardId={boardId}
                  canEdit={canEdit}
                  allColumns={sortedColumns}
                  visibleCount={col.visibleCount}
                  totalCount={col.totalCount}
                  filtersActive={filtersActive}
                />
              ))}
            </SortableContext>
            {canEdit && <AddColumnButton boardId={boardId} />}
          </div>
        )}
        <DragOverlay>
          {activeCard && <CardItemContent card={activeCard} boardId={boardId} isDragOverlay canEdit={canEdit} />}
        </DragOverlay>
      </DndContext>
      <CardDrawer boardId={boardId} canEdit={canEdit} />
    </>
  )
}
