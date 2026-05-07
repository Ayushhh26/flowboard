'use client'

import { useBoard } from '@/hooks/useBoard'
import { Button } from '@/components/ui/Button'
import { BoardSkeleton } from '@/components/ui/Skeleton'
import { Column } from './Column'

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

  if (isLoading) return <BoardSkeleton />
  if (isError || !board) return <BoardError onRetry={() => refetch()} />

  return (
    <div className="flex h-full items-start gap-3 overflow-x-auto p-6">
      {board.columns.map((col) => (
        <Column key={col.id} column={col} boardId={boardId} />
      ))}
    </div>
  )
}
